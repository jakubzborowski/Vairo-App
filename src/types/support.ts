/**
 * Pomoc i opinie — zgłoszenia do zespołu Vairo (migracja 043).
 *
 * Stałe leżą tutaj, nie w `actions.ts`: pliki `"use server"` eksportują
 * wyłącznie funkcje async.
 */

export const SUPPORT_KINDS = ["bug", "idea", "question", "other"] as const;
export type SupportKind = (typeof SUPPORT_KINDS)[number];

// Nazwy rodzajów i podpowiedzi pod polem: słownik `help`, `kind.<kind>.label|hint`.

export const SUPPORT_MESSAGE_MIN = 10;
export const SUPPORT_MESSAGE_MAX = 4000;

export function isSupportKind(value: unknown): value is SupportKind {
  return typeof value === "string" && (SUPPORT_KINDS as readonly string[]).includes(value);
}

/** Adres strony, z której ktoś przyszedł — tylko ścieżka wewnątrz aplikacji. */
export function safeFromPath(value: unknown) {
  if (typeof value !== "string") return null;
  const path = value.split("#")[0].slice(0, 300);
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  if (path.startsWith("/app/help")) return null;
  return path;
}

/** Kod błędu z ekranu „Coś poszło nie tak” (digest Next.js) — po nim
 *  znajduje się wpis w logach serwera. Tylko litery i cyfry. */
export function safeErrorCode(value: unknown) {
  return typeof value === "string" && /^[A-Za-z0-9]{1,40}$/.test(value) ? value : null;
}

/**
 * Publiczny adres wsparcia — druga droga obok formularza (strona Pomocy)
 * i jedyna na ekranie błędu poza /app. Strony logowania celowo go nie
 * pokazują (decyzja 3.11: przed logowaniem nic nie zmieniamy). Bez zmiennej nie pokazujemy niczego, zamiast
 * zmyślonego adresu.
 */
export function publicSupportEmail() {
  const value = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();
  return value && value.includes("@") ? value : null;
}
