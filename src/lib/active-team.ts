import { cookies } from "next/headers";

export const ACTIVE_TEAM_COOKIE = "vairo-team";

/**
 * Aktywny workspace trzymamy w ciasteczku, nie w query stringu.
 *
 * Layout `/app` renderuje sidebar ze switcherem, a layouty w App Routerze
 * **nie dostają `searchParams`** — przy `?team=` switcher zawsze pokazywałby
 * pierwszy startup, niezależnie od tego, co user wybrał. Ciasteczko czyta
 * tak samo layout, jak każda strona, więc cała aplikacja widzi ten sam kontekst.
 */
export async function getActiveStartupId(): Promise<string | null> {
  const store = await cookies();
  return store.get(ACTIVE_TEAM_COOKIE)?.value ?? null;
}

/** Wywoływane wyłącznie z Server Action albo Route Handlera. */
export async function setActiveStartupId(startupId: string) {
  const store = await cookies();
  store.set(ACTIVE_TEAM_COOKIE, startupId, {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });
}

/**
 * Czyści wskazanie aktywnego workspace'u — po usunięciu startupu albo wyjściu
 * z niego. Bez tego ciasteczko wskazywałoby na nieistniejący team i cała
 * aplikacja próbowałaby go wczytać przy każdym żądaniu.
 */
export async function clearActiveStartupIfMatches(startupId: string) {
  const store = await cookies();
  if (store.get(ACTIVE_TEAM_COOKIE)?.value === startupId) {
    store.delete(ACTIVE_TEAM_COOKIE);
  }
}
