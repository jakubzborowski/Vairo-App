import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { authCookieOptions, getSupabaseEnv } from "@/lib/supabase/config";

/**
 * Server Supabase client for Server Components, Server Actions, Route Handlers.
 * Cookie writes from Server Components are best-effort — the proxy owns refresh.
 *
 * One instance per request: layout and page render concurrently and both ask
 * for the client, and helpers memoized with `cache()` (e.g. `getUserStartups`)
 * key on its identity.
 */
export const createClient = cache(async () => {
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
});

/**
 * Logged-in user, verified against Supabase Auth once per request.
 * Layout and page used to call `auth.getUser()` separately — two round trips
 * to Auth before either could start loading data.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
