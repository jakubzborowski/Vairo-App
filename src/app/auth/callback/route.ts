import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  authCookieOptions,
  getTrustedOrigin,
  getSupabaseEnv,
  mapAuthExchangeError,
  safeNextPath,
} from "@/lib/supabase/config";
import {
  ensureOwnProfile,
  getProfileGate,
  resolvePostAuthPath,
} from "@/lib/profile";

/**
 * OAuth / magic-link PKCE callback (official SSR pattern).
 * Exchanges ?code= for a session and attaches Set-Cookie on the redirect.
 * Incomplete profiles go to /onboarding instead of /app.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const flowId = requestUrl.searchParams.get("sb_flow_id");
  const next = safeNextPath(requestUrl.searchParams.get("next"), "/onboarding");
  const oauthError = requestUrl.searchParams.get("error");
  const origin = getTrustedOrigin(requestUrl.origin);

  const fail = (codeName: string) => {
    const url = new URL("/register", origin);
    url.searchParams.set("error", codeName);
    return NextResponse.redirect(url);
  };

  if (oauthError) {
    const errorCode = requestUrl.searchParams.get("error_code");
    if (errorCode === "otp_expired") {
      return fail("auth_otp_expired");
    }
    return fail(oauthError === "access_denied" ? "auth_denied" : "auth_callback");
  }

  if (!code) {
    return fail("auth_missing_code");
  }

  const { url, anonKey } = getSupabaseEnv();
  const dest = { path: next };
  let response = NextResponse.redirect(`${origin}${dest.path}`);

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

        response = NextResponse.redirect(`${origin}${dest.path}`);

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, {
            ...authCookieOptions,
            ...options,
          });
        });

        Object.entries(cacheHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      },
    },
  });

  const { data: exchangeData, error } = await supabase.auth.exchangeCodeForSession(
    code,
    flowId ? { flowId } : undefined
  );

  if (error) {
    console.error("[auth/callback]", error.message, {
      hasVerifier: request.cookies
        .getAll()
        .some((cookie) => cookie.name.includes("code-verifier")),
    });
    return fail(mapAuthExchangeError(error.message));
  }

  const user = exchangeData.user;
  if (user) {
    await ensureOwnProfile(supabase, user);
    const profile = await getProfileGate(supabase, user.id);
    dest.path = resolvePostAuthPath(profile, next);

    const finalRedirect = NextResponse.redirect(`${origin}${dest.path}`);
    response.cookies.getAll().forEach(({ name, value }) => {
      finalRedirect.cookies.set(name, value, authCookieOptions);
    });
    return finalRedirect;
  }

  return response;
}
