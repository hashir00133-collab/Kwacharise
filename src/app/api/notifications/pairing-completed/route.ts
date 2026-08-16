import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { sendWhatsAppMessage } from "@/lib/notifications/whatsapp";

export const runtime = "nodejs";

type MemberProfile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: string | null;
  status: string | null;
  whatsapp_notifications_enabled: boolean | null;
  whatsapp_notifications_opt_in: boolean | null;
};

function canReceiveWhatsApp(profile: MemberProfile) {
  return (
    profile.phone &&
    profile.role === "member" &&
    profile.status !== "blocked" &&
    profile.status !== "suspended" &&
    (profile.whatsapp_notifications_enabled === true ||
      profile.whatsapp_notifications_opt_in === true)
  );
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing.");
    }

    if (!supabaseAnonKey) {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing."
      );
    }

    if (!serviceRoleKey) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing.");
    }

    /*
     * Verify the currently logged-in user from Supabase cookies.
     */
    const authClient = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },

          setAll() {
            // No cookie updates are required in this API route.
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse(
        {
          success: false,
          error: "You must be logged in.",
        },
        401
      );
    }

    /*
     * Server-only Supabase client.
     */
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    /*
     * Verify that the caller is an active Admin or Super Admin.
     */
    const {
      data: currentProfile,
      error: currentProfileError,
    } = await supabaseAdmin
      .from("profiles")
      .select("id, role, status")
      .eq("id", user.id)
      .maybeSingle();

    if (currentProfileError || !currentProfile) {
      return jsonResponse(
        {
          success: false,
          error: "Your administrator profile could not be verified.",
        },
        403
      );
    }

    const isAdministrator =
      currentProfile.role === "admin" ||
      currentProfile.role === "super_admin";

    if (!isAdministrator) {
      return jsonResponse(
        {
          success: false,
          error:
            "Only Admins and Super Admins can send pairing completed notifications.",
        },
        403
      );
    }

    if (
      currentProfile.status === "blocked" ||
      currentProfile.status === "suspended"
    ) {
      return jsonResponse(
        {
          success: false,
          error: "Your administrator account is not active.",
        },
        403
      );
    }

    /*
     * Parse the request only after authorization.
     */
    let body: {
      pairingId?: unknown;
    };

    try {
      body = (await request.json()) as {
        pairingId?: unknown;
      };
    } catch {
      return jsonResponse(
        {
          success: false,
          error: "Invalid request body.",
        },
        400
      );
    }

    const pairingId =
      typeof body.pairingId === "string"
        ? body.pairingId.trim()
        : "";

    if (!pairingId) {
      return jsonResponse(
        {
          success: false,
          error: "Pairing ID is required.",
        },
        400
      );
    }

    /*
     * Load the pairing directly from the database.
     */
    const {
      data: pairing,
      error: pairingError,
    } = await supabaseAdmin
      .from("pairings")
      .select(
        "id, payer_user_id, receiver_user_id, amount, status"
      )
      .eq("id", pairingId)
      .single();

    if (pairingError || !pairing) {
      return jsonResponse(
        {
          success: false,
          error:
            pairingError?.message ||
            "Pairing not found.",
        },
        404
      );
    }

    /*
     * Do not send a completion notification unless the
     * pairing is actually completed in the database.
     */
    if (pairing.status !== "completed") {
      return jsonResponse(
        {
          success: false,
          error:
            "Pairing completed notification cannot be sent because this pairing is not completed.",
        },
        409
      );
    }

    const amount = Number(pairing.amount || 0);

    if (!Number.isFinite(amount) || amount <= 0) {
      return jsonResponse(
        {
          success: false,
          error: "Pairing has an invalid amount.",
        },
        409
      );
    }

    /*
     * Load the payer who should receive the completion message.
     */
    const {
      data: payerProfile,
      error: payerError,
    } = await supabaseAdmin
      .from("profiles")
      .select(
        "id, full_name, phone, role, status, whatsapp_notifications_enabled, whatsapp_notifications_opt_in"
      )
      .eq("id", pairing.payer_user_id)
      .single();

    if (payerError || !payerProfile) {
      return jsonResponse(
        {
          success: false,
          error:
            payerError?.message ||
            "Payer profile not found.",
        },
        404
      );
    }

    const payer = payerProfile as MemberProfile;

    if (payer.role !== "member") {
      return jsonResponse(
        {
          success: false,
          error: "The pairing payer must be a member.",
        },
        409
      );
    }

    if (!canReceiveWhatsApp(payer)) {
      return jsonResponse(
        {
          success: true,
          message:
            "Pairing completed WhatsApp notification skipped.",
          result: {
            skipped: true,
            reason:
              "Payer has no valid WhatsApp phone number or has not enabled WhatsApp notifications.",
          },
        },
        200
      );
    }

    /*
     * Temporary free-form message.
     *
     * This will be replaced with the approved
     * kwacharise_pairing_completed Content SID
     * after Meta approves the template.
     */
    const message =
      `KwachaRise: Payment has been confirmed for K${amount.toFixed(
        2
      )}. ` +
      `Your investment cycle is complete and your capital has been reinvested automatically. ` +
      `You can view the updated details in your KwachaRise account.`;

    const result = await sendWhatsAppMessage({
      to: payer.phone || "",
      message,
    });

    return jsonResponse(
      {
        success: true,
        message:
          "Pairing completed WhatsApp notification sent successfully.",
        result: {
          skipped: false,
          sent: true,
          to: payer.phone,
          data: result,
        },
      },
      200
    );
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to send pairing completed WhatsApp notification.",
      },
      500
    );
  }
}