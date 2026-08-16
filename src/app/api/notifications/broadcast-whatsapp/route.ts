import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { sendWhatsAppMessage } from "@/lib/notifications/whatsapp";

export const runtime = "nodejs";

type MemberProfile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  status: string | null;
  role: string | null;
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
     * Verify the logged-in Supabase user from request cookies.
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
     * Broadcasts are restricted to Super Admin only.
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
          error: "Your Super Admin profile could not be verified.",
        },
        403
      );
    }

    if (currentProfile.role !== "super_admin") {
      return jsonResponse(
        {
          success: false,
          error: "Only the Super Admin can send WhatsApp broadcasts.",
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
          error: "Your Super Admin account is not active.",
        },
        403
      );
    }

    /*
     * Parse request only after authorization.
     */
    let body: {
      title?: unknown;
      message?: unknown;
    };

    try {
      body = (await request.json()) as {
        title?: unknown;
        message?: unknown;
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

    const title =
      typeof body.title === "string"
        ? body.title.trim()
        : "";

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    if (!title) {
      return jsonResponse(
        {
          success: false,
          error: "Broadcast title is required.",
        },
        400
      );
    }

    if (!message) {
      return jsonResponse(
        {
          success: false,
          error: "Broadcast message is required.",
        },
        400
      );
    }

    /*
     * Basic size protection.
     *
     * The future WhatsApp Content Template will also have
     * platform-specific length and variable requirements.
     */
    if (title.length > 120) {
      return jsonResponse(
        {
          success: false,
          error:
            "Broadcast title must be 120 characters or fewer.",
        },
        400
      );
    }

    if (message.length > 1000) {
      return jsonResponse(
        {
          success: false,
          error:
            "WhatsApp broadcast message must be 1000 characters or fewer.",
        },
        400
      );
    }

    /*
     * IMPORTANT:
     *
     * Do not send arbitrary free-form broadcast messages
     * from production.
     *
     * Business-initiated WhatsApp broadcasts require an
     * approved WhatsApp Content Template outside the
     * customer-service window.
     *
     * We will replace this production guard after the
     * KwachaRise broadcast Marketing template is approved
     * and wired using ContentSid / ContentVariables.
     */
    if (process.env.NODE_ENV === "production") {
      return jsonResponse(
        {
          success: false,
          error:
            "WhatsApp broadcast sending is temporarily disabled in production until the approved broadcast template is configured.",
        },
        503
      );
    }

    /*
     * Load eligible members.
     */
    const {
      data: profiles,
      error: profilesError,
    } = await supabaseAdmin
      .from("profiles")
      .select(
        "id, full_name, phone, status, role, whatsapp_notifications_enabled, whatsapp_notifications_opt_in"
      )
      .eq("role", "member")
      .not("phone", "is", null)
      .or(
        "whatsapp_notifications_enabled.eq.true,whatsapp_notifications_opt_in.eq.true"
      );

    if (profilesError) {
      throw new Error(profilesError.message);
    }

    const members = ((profiles || []) as MemberProfile[]).filter(
      canReceiveWhatsApp
    );

    if (members.length === 0) {
      return jsonResponse(
        {
          success: true,
          message: "No eligible WhatsApp members found.",
          sent: 0,
          failed: 0,
          results: [],
        },
        200
      );
    }

    /*
     * LOCAL/DEVELOPMENT ONLY.
     *
     * This temporary free-form message will be replaced
     * with an approved Marketing Content Template before
     * production WhatsApp broadcasts are enabled.
     */
    const whatsappText =
      `KwachaRise Broadcast: ${title}\n\n${message}`;

    const results = await Promise.allSettled(
      members.map((member) =>
        sendWhatsAppMessage({
          to: member.phone || "",
          message: whatsappText,
        })
      )
    );

    const formattedResults = results.map(
      (result, index) => {
        const member = members[index];

        if (result.status === "fulfilled") {
          return {
            member_id: member.id,
            success: true,
            data: result.value,
          };
        }

        return {
          member_id: member.id,
          success: false,
          error:
            result.reason instanceof Error
              ? result.reason.message
              : "Failed to send WhatsApp message.",
        };
      }
    );

    const failed = formattedResults.filter(
      (item) => !item.success
    );

    const sent = formattedResults.filter(
      (item) => item.success
    );

    return jsonResponse(
      {
        success: failed.length === 0,
        message:
          failed.length === 0
            ? "Broadcast WhatsApp messages sent successfully."
            : "Broadcast processed, but some WhatsApp messages failed.",
        total_members: members.length,
        sent: sent.length,
        failed: failed.length,
        results: formattedResults,
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
            : "Failed to send broadcast WhatsApp messages.",
      },
      500
    );
  }
}