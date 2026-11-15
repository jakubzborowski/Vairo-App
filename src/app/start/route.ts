import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { authCookieOptions, getSupabaseEnv } from "@/lib/supabase/config";

/**
 * Prefetch to nie kliknięcie. Next w wersji produkcyjnej pobiera z wyprzedzeniem
 * każdy widoczny `<Link href="/start">` — bez tego strażnika samo wejście na
 * ekran z takim linkiem (onboarding, strona główna) wylogowywało człowieka,
 * a pierwsza akcja serwera kończyła się ekranem „Coś poszło nie tak”.
 */
function isPrefetch(request: NextRequest) {
  const h = request.headers;
  return (
    h.has("next-router-prefetch") ||
    h.has("next-router-segment-prefetch") ||
    h.get("purpose") === "prefetch" ||
    (h.get("sec-purpose") ?? "").includes("prefetch")
  );
}

/**
 * Marketing entry: always start at account creation.
 * Clears any existing session so users aren't skipped into profile onboarding.
 */
export async function GET(request: NextRequest) {
  const { url, anonKey } = getSupabaseEnv();
  const registerUrl = new URL("/register", request.url);
  let response = NextResponse.redirect(registerUrl);

  if (isPrefetch(request)) return response;

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
