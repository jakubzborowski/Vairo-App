import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  authCookieOptions,
  getTrustedOrigin,
  getSupabaseEnv,
  mapAuthExchangeError,
  safeNextPath,
} from "@/lib/supabase/config";

/**
 * OAuth / magic-link PKCE callback (official SSR pattern).
 * Exchanges ?code= for a session and attaches Set-Cookie on the redirect.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const flowId = requestUrl.searchParams.get("sb_flow_id");
  const next = safeNextPath(requestUrl.searchParams.get("next"), "/app");
  const oauthError = requestUrl.searchParams.get("error");
  const origin = getTrustedOrigin(requestUrl.origin);

  const fail = (codeName: string) => {
    const url = new URL("/login", origin);
    url.searchParams.set("error", codeName);
    return NextResponse.redirect(url);
  };

  if (oauthError) {
    return fail(oauthError === "access_denied" ? "auth_denied" : "auth_callback");
  }

  if (!code) {
    return fail("auth_missing_code");
  }

  const { url, anonKey } = getSupabaseEnv();
  // Allowlist origin only — never trust X-Forwarded-Host from the client.
  const redirectUrl = `${origin}${next}`;

  let response = NextResponse.redirect(redirectUrl);

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

        response = NextResponse.redirect(redirectUrl);

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

  const { error } = await supabase.auth.exchangeCodeForSession(
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

  return response;
}
