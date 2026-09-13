import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { authCookieOptions, getSupabaseEnv } from "@/lib/supabase/config";

/**
 * Marketing entry: always start at account creation.
 * Clears any existing session so users aren't skipped into profile onboarding.
 */
export async function GET(request: NextRequest) {
  const { url, anonKey } = getSupabaseEnv();
  const registerUrl = new URL("/register", request.url);
  let response = NextResponse.redirect(registerUrl);

  const supabase = createServerClient(url, anonKey, {
    cookieOptions: authCookieOptions,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        response = NextResponse.redirect(registerUrl);
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, {
            ...authCookieOptions,
            ...options,
          });
        });
      },
    },
  });

  await supabase.auth.signOut();
  return response;
}
