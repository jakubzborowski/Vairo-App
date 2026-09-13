import type { CookieOptions } from "@supabase/ssr";

/**
 * Shared cookie defaults for browser + server Supabase clients.
 * SameSite=Lax is required for OAuth top-level redirects (Google → app).
 * Secure is enabled in production (HTTPS / PWA).
 *
 * Note: @supabase/ssr keeps auth cookies readable by JS (httpOnly: false)
 * so PKCE + browser client work. Mitigate XSS with CSP + strict markup.
 */
export const authCookieOptions: CookieOptions = {
  path: "/",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
};

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return { url, anonKey };
}

/**
 * Public site origin for OAuth / magic-link / post-login redirects.
 * Never trust raw Host / X-Forwarded-Host from the client.
 */
export function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return "http://localhost:3000";
}

/**
 * Trusted absolute origin for auth redirects.
 * Production: only NEXT_PUBLIC_SITE_URL / Vercel URL.
 * Development: allow the request origin when it is localhost / 127.0.0.1.
 */
export function getTrustedOrigin(requestOrigin?: string | null) {
  const configured = getSiteUrl();

  if (process.env.NODE_ENV === "development" && requestOrigin) {
    try {
      const origin = new URL(requestOrigin).origin;
      if (
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)
      ) {
        return origin;
      }
    } catch {
      // fall through to configured
    }
  }

  return configured;
}

/**
 * Only allow in-app relative paths (blocks open redirects + auth loops).
 * Allowed: /app, /app/..., /onboarding, /onboarding/...
 */
export function safeNextPath(
  next: string | null | undefined,
  fallback = "/app"
) {
  if (!next || typeof next !== "string") return fallback;

  const path = next.split("?")[0]?.split("#")[0] ?? "";

  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes("\\") ||
    path.includes("..")
  ) {
    return fallback;
  }

  if (
    path === "/app" ||
    path.startsWith("/app/") ||
    path === "/onboarding" ||
    path.startsWith("/onboarding/")
  ) {
    return path;
  }

  return fallback;
}

/** Stable, non-leaky auth error codes for the login UI. */
export type AuthErrorCode =
  | "auth_callback"
  | "auth_denied"
  | "auth_exchange"
  | "auth_missing_code"
  | "auth_network"
  | "auth_otp_expired";

export function authErrorMessage(code: string | null): string {
  switch (code) {
    case "auth_denied":
      return "Anulowano logowanie. Spróbuj ponownie.";
    case "auth_otp_expired":
      return "Link wygasł lub został już użyty. Wyślij nowy magic link.";
    case "auth_missing_code":
      return "Brak kodu autoryzacji. Poproś o nowy link.";
    case "auth_network":
      return "Problem z połączeniem do serwera auth. Spróbuj ponownie.";
    case "auth_exchange":
    case "auth_callback":
      return "Logowanie nie powiodło się. Spróbuj ponownie.";
    default:
      return "Logowanie nie powiodło się. Spróbuj ponownie.";
  }
}

export function mapAuthExchangeError(message: string): AuthErrorCode {
  const lower = message.toLowerCase();
  if (lower.includes("fetch") || lower.includes("network")) {
    return "auth_network";
  }
  return "auth_exchange";
}
