import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

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
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      !serviceRoleKey
    ) {
      return jsonResponse(
        {
          error:
            "Required Supabase environment variables are missing.",
        },
        500
      );
    }

    /*
     * Verify the logged-in user from the Supabase
     * authentication cookies.
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
          error: "You must be logged in.",
        },
        401
      );
    }

    /*
     * Server-only Supabase client.
     * Never expose the service-role key to browser code.
     */
    const serviceClient = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    /*
     * Verify the caller's actual server-side profile.
     */
    const {
      data: currentProfile,
      error: profileError,
    } = await serviceClient
      .from("profiles")
      .select("id, role, status")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !currentProfile) {
      return jsonResponse(
        {
          error:
            "Your Super Admin profile could not be verified.",
        },
        403
      );
    }

    if (currentProfile.role !== "super_admin") {
      return jsonResponse(
        {
          error:
            "Only Super Admin can create admin accounts.",
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
          error: "Your account is not active.",
        },
        403
      );
    }

    /*
     * Parse the request only after authorization.
     */
    let body: {
      fullName?: unknown;
      email?: unknown;
      phone?: unknown;
      temporaryPassword?: unknown;
    };

    try {
      body = (await request.json()) as typeof body;
    } catch {
      return jsonResponse(
        {
          error: "Invalid request body.",
        },
        400
      );
    }

    const fullName =
      typeof body.fullName === "string"
        ? body.fullName.trim()
        : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const phone =
      typeof body.phone === "string"
        ? body.phone.trim()
        : "";

    const temporaryPassword =
      typeof body.temporaryPassword === "string"
        ? body.temporaryPassword.trim()
        : "";

    if (!fullName || !email || !temporaryPassword) {
      return jsonResponse(
        {
          error:
            "Full name, email, and temporary password are required.",
        },
        400
      );
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return jsonResponse(
        {
          error: "Please enter a valid email address.",
        },
        400
      );
    }

    if (temporaryPassword.length < 8) {
      return jsonResponse(
        {
          error:
            "Temporary password must be at least 8 characters.",
        },
        400
      );
    }

    /*
     * Create the Supabase Auth account.
     * This is a server-only Admin API operation.
     */
    const {
      data: createdUserData,
      error: createUserError,
    } = await serviceClient.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone,
        created_by_super_admin: user.id,
      },
    });

    if (createUserError || !createdUserData.user) {
      return jsonResponse(
        {
          error:
            createUserError?.message ||
            "Failed to create admin authentication account.",
        },
        400
      );
    }

    const createdUser = createdUserData.user;

    const referralCode = `KRA${createdUser.id
      .replaceAll("-", "")
      .slice(0, 8)
      .toUpperCase()}`;

    /*
     * Create/update the corresponding KwachaRise profile.
     */
    const { error: profileUpsertError } =
      await serviceClient
        .from("profiles")
        .upsert(
          {
            id: createdUser.id,
            email,
            full_name: fullName,
            phone: phone || null,
            role: "admin",
            status: "active",
            kyc_status: "approved",
            referral_code: referralCode,
            email_notifications_opt_in: true,
            whatsapp_notifications_opt_in: false,
          },
          {
            onConflict: "id",
          }
        );

    if (profileUpsertError) {
      /*
       * Roll back the Auth account so we do not leave
       * an orphan administrator login behind.
       */
      const { error: rollbackError } =
        await serviceClient.auth.admin.deleteUser(
          createdUser.id
        );

      if (rollbackError) {
        console.error(
          "Failed to roll back Admin Auth user:",
          rollbackError
        );
      }

      console.error(
        "Failed to create Admin profile:",
        profileUpsertError
      );

      return jsonResponse(
        {
          error:
            "The Admin profile could not be created. The account creation was cancelled.",
        },
        500
      );
    }

    return jsonResponse(
      {
        success: true,
        message: "Admin account created successfully.",
        admin: {
          id: createdUser.id,
          email,
          fullName,
        },
      },
      200
    );
  } catch (error) {
    console.error(
      "Create Admin API error:",
      error
    );

    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong while creating the Admin account.",
      },
      500
    );
  }
}