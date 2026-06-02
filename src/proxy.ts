import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const memberRoutes = [
  "/dashboard",
  "/deposit",
  "/withdraw",
  "/kyc",
  "/referral",
  "/leaderboard",
  "/ledger",
  "/pairing",
  "/account",
];

const adminRoutes = ["/admin", "/admin/kyc"];

const superAdminRoutes = ["/superadmin", "/superadmin/settings"];

function routeMatches(pathname: string, routes: string[]) {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isMemberRoute = routeMatches(pathname, memberRoutes);
  const isAdminRoute = routeMatches(pathname, adminRoutes);
  const isSuperAdminRoute = routeMatches(pathname, superAdminRoutes);

  if (!isMemberRoute && !isAdminRoute && !isSuperAdminRoute) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables.");
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },

      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const needsRoleCheck = isMemberRoute || isAdminRoute || isSuperAdminRoute;

  if (needsRoleCheck) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .single();

    if (error || !profile) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("error", "profile_not_found");
      return NextResponse.redirect(loginUrl);
    }

    if (profile.status === "blocked" || profile.status === "suspended") {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("error", "account_inactive");
      return NextResponse.redirect(loginUrl);
    }

    if (isSuperAdminRoute && profile.role !== "super_admin") {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = "/dashboard";
      dashboardUrl.search = "";
      return NextResponse.redirect(dashboardUrl);
    }

    if (
      isAdminRoute &&
      profile.role !== "admin" &&
      profile.role !== "super_admin"
    ) {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = "/dashboard";
      dashboardUrl.search = "";
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/deposit/:path*",
    "/withdraw/:path*",
    "/kyc/:path*",
    "/referral/:path*",
    "/leaderboard/:path*",
    "/ledger/:path*",
    "/pairing/:path*",
    "/account/:path*",
    "/admin/:path*",
    "/superadmin/:path*",
  ],
};