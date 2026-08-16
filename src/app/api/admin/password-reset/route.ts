import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  buildEmailTemplate,
  sendEmail,
} from "@/lib/email/sendEmail";

type PasswordResetRequestBody = {
  email?: unknown;
};

function getRequiredEnvironmentVariable(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function createJsonResponse(
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
     * Required Supabase environment variables.
     * The service role key is used only inside this server route.
     */
    const supabaseUrl = getRequiredEnvironmentVariable(
      "NEXT_PUBLIC_SUPABASE_URL"
    );

    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const serviceRoleKey = getRequiredEnvironmentVariable(
      "SUPABASE_SERVICE_ROLE_KEY"
    );

    if (!supabaseAnonKey) {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
    }

    /*
     * Check that the request includes the logged-in admin's token.
     */
    const authorizationHeader =
      request.headers.get("authorization");

    if (
      !authorizationHeader ||
      !authorizationHeader.startsWith("Bearer ")
    ) {
      return createJsonResponse(
        {
          error:
            "Your admin session is missing. Please log in again.",
        },
        401
      );
    }

    const accessToken = authorizationHeader
      .slice("Bearer ".length)
      .trim();

    if (!accessToken) {
      return createJsonResponse(
        {
          error:
            "Your admin session is invalid. Please log in again.",
        },
        401
      );
    }

    /*
     * Client used only to verify the current admin's access token.
     */
    const authenticationClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    );

    const {
      data: { user: currentUser },
      error: currentUserError,
    } = await authenticationClient.auth.getUser(accessToken);

    if (currentUserError || !currentUser) {
      return createJsonResponse(
        {
          error:
            "Your admin session has expired. Please log in again.",
        },
        401
      );
    }

    /*
     * Server-only Supabase client.
     * Never place the service role key in browser code.
     */
    const serviceClient = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    );

    /*
     * Confirm that the logged-in user is an Admin or Super Admin.
     */
    const {
      data: currentProfile,
      error: currentProfileError,
    } = await serviceClient
      .from("profiles")
      .select("id, role, status")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (currentProfileError || !currentProfile) {
      return createJsonResponse(
        {
          error:
            "Your administrator profile could not be verified.",
        },
        403
      );
    }

    const isAdministrator =
      currentProfile.role === "admin" ||
      currentProfile.role === "super_admin";

    if (!isAdministrator) {
      return createJsonResponse(
        {
          error:
            "Only Admins and Super Admins can send password reset emails.",
        },
        403
      );
    }

    if (
      currentProfile.status === "blocked" ||
      currentProfile.status === "suspended"
    ) {
      return createJsonResponse(
        {
          error:
            "Your administrator account is not currently active.",
        },
        403
      );
    }

    /*
     * Read and validate the member email.
     */
    let body: PasswordResetRequestBody;

    try {
      body =
        (await request.json()) as PasswordResetRequestBody;
    } catch {
      return createJsonResponse(
        {
          error: "The request information is invalid.",
        },
        400
      );
    }

    const cleanEmail =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    if (!cleanEmail) {
      return createJsonResponse(
        {
          error: "Please enter the member email address.",
        },
        400
      );
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(cleanEmail)) {
      return createJsonResponse(
        {
          error: "Please enter a valid email address.",
        },
        400
      );
    }

    /*
     * Verify that the email belongs to a registered member.
     */
    const {
      data: memberProfile,
      error: memberProfileError,
    } = await serviceClient
      .from("profiles")
      .select("id, email, full_name, role, status")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (memberProfileError) {
      console.error(
        "Member lookup error:",
        memberProfileError
      );

      return createJsonResponse(
        {
          error:
            "The member account could not be checked. Please try again.",
        },
        500
      );
    }

    if (!memberProfile) {
      return createJsonResponse(
        {
          error:
            "No registered member was found with that email address.",
        },
        404
      );
    }

    if (memberProfile.role !== "member") {
      return createJsonResponse(
        {
          error:
            "This password reset tool can only be used for member accounts.",
        },
        400
      );
    }

    /*
     * Generate a Supabase recovery token without starting a
     * browser PKCE flow.
     */
    const {
      data: recoveryData,
      error: recoveryError,
    } = await serviceClient.auth.admin.generateLink({
      type: "recovery",
      email: cleanEmail,
    });

    if (recoveryError) {
      console.error(
        "Recovery link generation error:",
        recoveryError
      );

      return createJsonResponse(
        {
          error:
            recoveryError.message ||
            "The password reset link could not be generated.",
        },
        400
      );
    }

    const tokenHash =
      recoveryData?.properties?.hashed_token;

    if (!tokenHash) {
      console.error(
        "Supabase did not return a recovery token hash."
      );

      return createJsonResponse(
        {
          error:
            "The password reset token could not be created.",
        },
        500
      );
    }

    /*
     * Use the configured site URL in production.
     * During local testing, request.nextUrl.origin will be
     * http://localhost:3000.
     */
    const configuredSiteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.trim();

    const siteOrigin = (
      configuredSiteUrl || request.nextUrl.origin
    ).replace(/\/+$/, "");

    const resetUrl = new URL(
      "/reset-password",
      siteOrigin
    );

    resetUrl.searchParams.set(
      "token_hash",
      tokenHash
    );

    resetUrl.searchParams.set(
      "type",
      "recovery"
    );

    const memberName =
      memberProfile.full_name?.trim() || "Member";

    /*
     * Send the custom KwachaRise email through Resend.
     */
    const emailHtml = buildEmailTemplate({
      title: "Reset Your Password",
      message:
        `Hello ${memberName}, an administrator has requested a password reset for your KwachaRise account. ` +
        "Click the button below to choose a new password. If you were not expecting this email, please contact KwachaRise support.",
      actionText: "Reset Password",
      actionUrl: resetUrl.toString(),
    });

    const emailText = [
      `Hello ${memberName},`,
      "",
      "An administrator has requested a password reset for your KwachaRise account.",
      "",
      "Open the link below to choose a new password:",
      resetUrl.toString(),
      "",
      "If you were not expecting this email, please contact KwachaRise support.",
    ].join("\n");

    try {
      await sendEmail({
        to: cleanEmail,
        subject: "Reset your KwachaRise password",
        html: emailHtml,
        text: emailText,
      });
    } catch (emailError) {
      console.error(
        "Password reset email error:",
        emailError
      );

      return createJsonResponse(
        {
          error:
            emailError instanceof Error
              ? emailError.message
              : "The password reset email could not be sent.",
        },
        500
      );
    }

    return createJsonResponse(
      {
        success: true,
        message:
          `Password reset email sent to ${cleanEmail}. ` +
          "Ask the member to check their inbox.",
      },
      200
    );
  } catch (error) {
    console.error(
      "Admin password reset route error:",
      error
    );

    return createJsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected server error occurred.",
      },
      500
    );
  }
}