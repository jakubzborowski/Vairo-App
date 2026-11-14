import type { NextConfig } from "next";
import path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
let supabaseOrigin = "https://*.supabase.co";
try {
  if (supabaseUrl) supabaseOrigin = new URL(supabaseUrl).origin;
} catch {
  // keep wildcard fallback for build without env
}

// PostHog idzie przez nasz serwer (/ingest), nie wprost z przeglądarki: CSP
// zostaje na 'self', a blokery reklam nie wycinają zapytań. Region (EU/US)
// wynika z adresu API; domyślnie EU — dane użytkowników zostają w Unii.
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";
const posthogAssetsHost = posthogHost.replace(".i.posthog.com", "-assets.i.posthog.com");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    // Mikrofon tylko dla samej aplikacji — „Nagraj głosem” w polach etapów.
    // `microphone=()` blokował go całkowicie: przeglądarka odmawiała, zanim
    // zapytała o zgodę.
    value: "camera=(), microphone=(self), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "object-src 'none'",
      // Next.js + Turbopack require inline/eval in dev; keep minimal in prod.
      process.env.NODE_ENV === "production"
        ? "script-src 'self' 'unsafe-inline'"
        : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      `connect-src 'self' ${supabaseOrigin} https://*.supabase.co wss://*.supabase.co`,
      // Podgląd PDF w Plikach to <iframe> z podpisanym adresem Storage —
      // przy `'none'` zamiast podglądu był pusty, zablokowany prostokąt.
      `frame-src ${supabaseOrigin}`,
    ].join("; "),
  },
];

const noStore = [
  {
    key: "Cache-Control",
    value: "private, no-cache, no-store, must-revalidate, max-age=0",
  },
];

const nextConfig: NextConfig = {
  // Pin Turbopack to this app — a parent lockfile under the user home confuses resolution.
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: new URL(
          supabaseUrl || "https://placeholder.supabase.co"
        ).hostname,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // Wymagane przez PostHog: bez tego Next dopisuje `/` do /ingest/e/ i ucina POST.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      { source: "/ingest/static/:path*", destination: `${posthogAssetsHost}/static/:path*` },
      { source: "/ingest/array/:path*", destination: `${posthogAssetsHost}/array/:path*` },
      { source: "/ingest/:path*", destination: `${posthogHost}/:path*` },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      { source: "/app", headers: noStore },
      { source: "/app/:path*", headers: noStore },
      { source: "/login", headers: noStore },
      { source: "/register", headers: noStore },
      { source: "/auth/:path*", headers: noStore },
    ];
  },
};

export default nextConfig;
