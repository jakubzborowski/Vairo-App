import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { LOCALE_COOKIE, isLocale, negotiateLocale } from "@/i18n/config";

export async function proxy(request: NextRequest) {
  const response = await updateSession(request);

  // Pierwsze wejście: język z przeglądarki zapamiętany w ciasteczku, żeby
  // każda kolejna strona (i przekierowanie) mówiła tym samym językiem.
  // Wybór z Ustawień albo z profilu nadpisuje to ciasteczko — tu go nie ruszamy.
  if (!isLocale(request.cookies.get(LOCALE_COOKIE)?.value)) {
    response.cookies.set(LOCALE_COOKIE, negotiateLocale(request.headers.get("accept-language")), {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return response;
}

export default proxy;

export const config = {
  matcher: [
    /*
     * Auth refresh + route gates. Exclude Next internals, static files i /ingest
     * (proxy do PostHog — nie ma tam sesji do odświeżania).
     */
    "/((?!_next/static|_next/image|favicon.ico|brand/|ingest(?:/|$)|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)",
  ],
};
