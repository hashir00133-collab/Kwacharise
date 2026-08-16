import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { sendWhatsAppMessage } from "@/lib/notifications/whatsapp";

export const runtime = "nodejs";

type ReceiverProfile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: string | null;
  status: string | null;
  whatsapp_notifications_enabled: boolean | null;
  whatsapp_notifications_opt_in: boolean | null;
};

function canReceiveWhatsApp(profile: ReceiverProfile) {
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
     * Verify the logged-in Supabase user from the request cookies.
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
            // No cookie updates are required in this route.
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
     * Verify the caller is an active Admin or Super Admin.
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
            "Only Admins and Super Admins can send pairing notifications.",
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
      receiverUserId?: unknown;
      payerName?: unknown;
      payerPhone?: unknown;
      amount?: unknown;
      withdrawalMethod?: unknown;
    };

    try {
      body = (await request.json()) as typeof body;
    } catch {
      return jsonResponse(
        {
          success: false,
          error: "Invalid request body.",
        },
        400
      );
    }

    const receiverUserId =
      typeof body.receiverUserId === "string"
        ? body.receiverUserId.trim()
        : "";

    const payerName =
      typeof body.payerName === "string" && body.payerName.trim()
        ? body.payerName.trim()
        : "A member";

    const payerPhone =
      typeof body.payerPhone === "string"
        ? body.payerPhone.trim()
        : "";

    const amount = Number(body.amount || 0);

    const withdrawalMethod =
      typeof body.withdrawalMethod === "string"
        ? body.withdrawalMethod.trim()
        : "";

    if (!receiverUserId) {
      return jsonResponse(
        {
          success: false,
          error: "Receiver user ID is required.",
        },
        400
      );
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return jsonResponse(
        {
          success: false,
          error: "Valid pairing amount is required.",
        },
        400
      );
    }

    /*
     * Load the receiving member from the database.
     */
    const {
      data: receiverProfile,
      error: receiverError,
    } = await supabaseAdmin
      .from("profiles")
      .select(
        "id, full_name, phone, role, status, whatsapp_notifications_enabled, whatsapp_notifications_opt_in"
      )
      .eq("id", receiverUserId)
      .single();

    if (receiverError || !receiverProfile) {
      return jsonResponse(
        {
          success: false,
          error:
            receiverError?.message ||
            "Receiver profile not found.",
        },
        404
      );
    }

    const receiver = receiverProfile as ReceiverProfile;

    if (receiver.role !== "member") {
      return jsonResponse(
        {
          success: false,
          error: "The pairing receiver must be a member.",
        },
        409
      );
    }

    if (!canReceiveWhatsApp(receiver)) {
      return jsonResponse(
        {
          success: true,
          message: "Pairing WhatsApp notification skipped.",
          result: {
            skipped: true,
            reason:
              "Receiver has no valid WhatsApp phone number or has not enabled WhatsApp notifications.",
          },
        },
        200
      );
    }

    /*
     * Temporary free-form WhatsApp message.
     *
     * This will be replaced by the approved
     * kwacharise_pairing_created_v2 Content SID.
     *
     * Account/wallet information is intentionally NOT included
     * in the WhatsApp notification.
     */
    const message = `KwachaRise: You've been paired for a withdrawal. ${payerName} will send K${amount.toFixed(
      2
    )}. Payer phone: ${
      payerPhone || "Not provided"
    }. Withdrawal method: ${
      withdrawalMethod || "Not provided"
    }. Open KwachaRise to view payment details and confirm receipt once paid.`;

    const result = await sendWhatsAppMessage({
      to: receiver.phone || "",
      message,
    });

    return jsonResponse(
      {
        success: true,
        message:
          "Pairing WhatsApp notification sent successfully.",
        result: {
          skipped: false,
          sent: true,
          to: receiver.phone,
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
            : "Failed to send pairing WhatsApp notification.",
      },
      500
    );
  }
}