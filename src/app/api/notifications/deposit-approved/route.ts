import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { sendWhatsAppMessage } from "@/lib/notifications/whatsapp";

export const runtime = "nodejs";

function money(value: unknown) {
  const amount = Number(value || 0);

  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function isWhatsAppEnabled(profile: any) {
  return (
    profile?.whatsapp_notifications_enabled === true ||
    profile?.whatsapp_notifications_opt_in === true
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
     * Verify the currently logged-in user from the Supabase
     * authentication cookies attached to this request.
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
     * Server-only client.
     * The service-role key must never be exposed to browser code.
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
            "Only Admins and Super Admins can send deposit notifications.",
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
     * Parse and validate the request body only after authorization.
     */
    let body: { depositId?: unknown };

    try {
      body = (await request.json()) as {
        depositId?: unknown;
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

    const depositId =
      typeof body.depositId === "string"
        ? body.depositId.trim()
        : "";

    if (!depositId) {
      return jsonResponse(
        {
          success: false,
          error: "depositId is required.",
        },
        400
      );
    }

    /*
     * Load the approved deposit.
     */
    const {
      data: deposit,
      error: depositError,
    } = await supabaseAdmin
      .from("deposit_requests")
      .select(
        "id, user_id, amount, expected_profit, maturity_date, transaction_reference, status"
      )
      .eq("id", depositId)
      .single();

    if (depositError || !deposit) {
      return jsonResponse(
        {
          success: false,
          error:
            depositError?.message ||
            "Deposit request not found.",
        },
        404
      );
    }

    /*
     * Never send an approval notification for a deposit
     * that is not actually approved.
     */
    if (deposit.status !== "approved") {
      return jsonResponse(
        {
          success: false,
          error:
            "Deposit notification cannot be sent because this deposit is not approved.",
        },
        409
      );
    }

    /*
     * Load the member's WhatsApp settings.
     */
    const {
      data: profile,
      error: profileError,
    } = await supabaseAdmin
      .from("profiles")
      .select(
        "id, full_name, phone, whatsapp_notifications_enabled, whatsapp_notifications_opt_in"
      )
      .eq("id", deposit.user_id)
      .single();

    if (profileError || !profile) {
      return jsonResponse(
        {
          success: false,
          error:
            profileError?.message ||
            "Member profile not found.",
        },
        404
      );
    }

    if (!profile.phone) {
      return jsonResponse(
        {
          success: true,
          message:
            "Deposit approved WhatsApp notification skipped.",
          result: {
            skipped: true,
            reason: "Member has no phone number saved.",
          },
        },
        200
      );
    }

    if (!isWhatsAppEnabled(profile)) {
      return jsonResponse(
        {
          success: true,
          message:
            "Deposit approved WhatsApp notification skipped.",
          result: {
            skipped: true,
            reason:
              "Member has not enabled WhatsApp notifications.",
          },
        },
        200
      );
    }

    /*
     * Temporary free-form message.
     *
     * We will replace this with the approved Twilio Content SID
     * after kwacharise_deposit_approved_v2 is approved by Meta.
     */
    const message = `KwachaRise: Your deposit of K${money(
      deposit.amount
    )} has been confirmed. Your countdown has started. Expected profit: K${money(
      deposit.expected_profit
    )}. Reference: ${
      deposit.transaction_reference || "N/A"
    }. You can view the deposit details in your KwachaRise account.`;

    const result = await sendWhatsAppMessage({
      to: profile.phone,
      message,
    });

    return jsonResponse(
      {
        success: true,
        message:
          "Deposit approved WhatsApp notification processed.",
        result: {
          skipped: false,
          sent: true,
          to: profile.phone,
          result,
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
            : "Failed to send deposit approved WhatsApp notification.",
      },
      500
    );
  }
}