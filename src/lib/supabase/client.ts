import { createBrowserClient } from "@supabase/ssr";
import { authCookieOptions, getSupabaseEnv } from "@/lib/supabase/config";

/**
 * Browser Supabase client (Client Components only).
 * Uses cookie storage (PKCE verifier + session) so SSR proxy can read the session.
 */
export function createClient() {
  const { url, anonKey } = getSupabaseEnv();

  return createBrowserClient(url, anonKey, {
    cookieOptions: authCookieOptions,
    auth: {
      flowType: "pkce",
      detectSessionInUrl: false,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}
