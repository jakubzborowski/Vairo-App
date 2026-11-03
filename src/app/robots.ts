import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/supabase/config";

/**
 * Wyszukiwarki widzą tylko stronę główną i logowanie. Linki zaproszeń
 * (`/join/<token>`) niosą sekret — nie mogą trafić do indeksu, nawet jeśli
 * ktoś wklei je publicznie. Reszta i tak wymaga zalogowania.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/app", "/join", "/auth", "/onboarding", "/start"],
    },
    host: getSiteUrl(),
  };
}
