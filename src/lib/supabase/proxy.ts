import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  authCookieOptions,
  getSupabaseEnv,
  safeNextPath,
} from "@/lib/supabase/config";

function isPublicAssetPath(path: string) {
  return (
    path.startsWith("/brand/") ||
    path.startsWith("/_next/") ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$/i.test(path)
  );
}

function hasAuthCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some((cookie) => cookie.name.includes("-auth-token"));
}

/**
 * Refresh + gate auth on matched requests.
 * Uses getClaims() (local JWT verify via JWKS) so auth checks stay cheap at scale.
 */
export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (isPublicAssetPath(path) || path.startsWith("/auth/callback")) {
    return NextResponse.next({ request });
  }

  const isAuthPage = path === "/login" || path === "/register";
  const isProtected = path === "/app" || path.startsWith("/app/");
  const needsAuthCheck = isAuthPage || isProtected;

  // Public pages with no session cookie: skip Supabase entirely.
  if (!needsAuthCheck && !hasAuthCookie(request)) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });
  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookieOptions: authCookieOptions,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, cacheHeaders) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        supabaseResponse = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, {
            ...authCookieOptions,
            ...options,
          });
        });

        Object.entries(cacheHeaders).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value);
        });
      },
    },
  });

  const { data: claimsData } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(claimsData?.claims);

  if (!needsAuthCheck) {
    return supabaseResponse;
  }

  if (!isAuthenticated && isProtected) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("next", safeNextPath(path));
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthenticated && isAuthPage) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = safeNextPath(
      request.nextUrl.searchParams.get("next"),
      "/app"
    );
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
