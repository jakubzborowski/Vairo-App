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
 * Logged-in user, verified once per request.
 *
 * `getClaims()` checks the JWT signature locally (JWKS, cached) instead of
 * a round trip to Supabase Auth on every page — the proxy already refreshed
 * the session for this request. Projects still on a symmetric JWT secret
 * fall back to `getUser()` inside the SDK, so nothing gets less strict.
 * Pages read only `id` and `email`; anything needing the full Auth user
 * (e.g. pending e-mail change) calls `auth.getUser()` itself.
 */
export const getCurrentUser = cache(async (): Promise<{ id: string; email: string | null } | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;
  return { id: claims.sub, email: typeof claims.email === "string" ? claims.email : null };
});
