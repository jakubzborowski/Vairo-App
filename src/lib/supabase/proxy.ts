import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  authCookieOptions,
  getSupabaseEnv,
  safeNextPath,
} from "@/lib/supabase/config";
import { getProfileGate, resolvePostAuthPath } from "@/lib/profile";
import { onboardingPathForStep, type OnboardingStep } from "@/types/profile";

const ONBOARDED_COOKIE = "vairo-onboarded";

const onboardedCookieOptions = {
  path: "/",
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 365,
};

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
 * Refresh + gate auth / onboarding on matched requests.
 * Uses getClaims() (local JWT verify via JWKS) so auth checks stay cheap at scale.
 */
export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (isPublicAssetPath(path) || path.startsWith("/auth/callback") || path === "/start") {
    return NextResponse.next({ request });
  }

  const isAuthPage = path === "/login" || path === "/register";
  const isApp = path === "/app" || path.startsWith("/app/");
  const isOnboarding =
    path === "/onboarding" || path.startsWith("/onboarding/");
  const isProtected = isApp || isOnboarding;
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
  const claims = claimsData?.claims as Record<string, unknown> | undefined;
  const userId = typeof claims?.sub === "string" ? claims.sub : null;
  const isAuthenticated = Boolean(userId);

  if (!needsAuthCheck) {
    return supabaseResponse;
  }

  if (!isAuthenticated && isProtected) {
    const redirectUrl = request.nextUrl.clone();
    // New users create an account first; profile onboarding comes after auth.
    redirectUrl.pathname = "/register";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("next", safeNextPath(path, "/onboarding"));
    return NextResponse.redirect(redirectUrl);
  }

  // Onboarding się nie cofa, więc raz potwierdzony nie wymaga pytania bazy
  // przy każdym żądaniu. Ciasteczko jest przypięte do id z JWT — inne konto
  // w tej samej przeglądarce przejdzie normalne sprawdzenie. To tylko bramka
  // UX: każda strona i tak weryfikuje sesję, a RLS dane.
  if (isApp && userId && request.cookies.get(ONBOARDED_COOKIE)?.value === userId) {
    return supabaseResponse;
  }

  if (isAuthenticated && userId && (isAuthPage || isProtected)) {
    const profile = await getProfileGate(supabase, userId);
    const postAuthPath = resolvePostAuthPath(
      profile,
      safeNextPath(request.nextUrl.searchParams.get("next"), "/app")
    );

    if (isAuthPage) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = postAuthPath;
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    const isComplete = Boolean(profile?.onboarding_completed_at);

    if (isApp && !isComplete) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = onboardingPathForStep(
        (profile?.onboarding_step as OnboardingStep | undefined) ?? "name"
      );
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    if (isOnboarding && isComplete) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/app";
      redirectUrl.search = "";
      const redirect = NextResponse.redirect(redirectUrl);
      redirect.cookies.set(ONBOARDED_COOKIE, userId, onboardedCookieOptions);
      return redirect;
    }

    if (isApp && isComplete) {
      supabaseResponse.cookies.set(ONBOARDED_COOKIE, userId, onboardedCookieOptions);
    }
  }

  return supabaseResponse;
}
