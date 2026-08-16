import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { sendWhatsAppMessage } from "@/lib/notifications/whatsapp";

export const runtime = "nodejs";

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
    /*
     * This endpoint is intentionally disabled in production.
     * Production WhatsApp testing should use approved templates
     * and controlled recipient accounts instead.
     */
    if (process.env.NODE_ENV === "production") {
      return jsonResponse(
        {
          success: false,
          error: "WhatsApp test endpoint is disabled in production.",
        },
        403
      );
    }

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
     * Verify the logged-in user from Supabase cookies.
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
     * Server-only client used to verify the user's role.
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
            "Only Admins and Super Admins can run WhatsApp tests.",
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

    const rawNumbers = process.env.TWILIO_TEST_WHATSAPP_TO;

    if (!rawNumbers) {
      return jsonResponse(
        {
          success: false,
          error: "TWILIO_TEST_WHATSAPP_TO is not configured.",
        },
        400
      );
    }

    const numbers = rawNumbers
      .split(",")
      .map((number) => number.trim())
      .filter(Boolean);

    if (numbers.length === 0) {
      return jsonResponse(
        {
          success: false,
          error: "No WhatsApp test numbers are configured.",
        },
        400
      );
    }

    /*
     * Development-only free-form test message.
     */
    const results = await Promise.allSettled(
      numbers.map((to) =>
        sendWhatsAppMessage({
          to,
          message:
            "KwachaRise WhatsApp Test ✅ Your WhatsApp notification setup is working.",
        })
      )
    );

    const formattedResults = results.map(
      (result, index) => {
        if (result.status === "fulfilled") {
          return {
            number: numbers[index],
            success: true,
            data: result.value,
          };
        }

        return {
          number: numbers[index],
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

    return jsonResponse(
      {
        success: failed.length === 0,
        message:
          failed.length === 0
            ? "WhatsApp test messages sent successfully."
            : "Some WhatsApp test messages failed.",
        sent_to: numbers,
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
            : "Failed to send WhatsApp test message.",
      },
      500
    );
  }
}