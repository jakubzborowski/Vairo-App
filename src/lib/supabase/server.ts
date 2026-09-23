import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { authCookieOptions, getSupabaseEnv } from "@/lib/supabase/config";

/**
 * Server Supabase client for Server Components, Server Actions, Route Handlers.
 * Cookie writes from Server Components are best-effort — the proxy owns refresh.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseEnv();

  return createServerClient(url, anonKey, {
    cookieOptions: authCookieOptions,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, { ...authCookieOptions, ...options });
          });
        } catch {
          // Called from a Server Component — proxy will persist the session.
        }
      },
    },
  });
}
