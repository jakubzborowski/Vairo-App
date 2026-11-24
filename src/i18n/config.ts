/**
 * Języki interfejsu.
 *
 * Polski jest językiem źródłowym: każdy klucz najpierw powstaje w `pl`,
 * a brakujące tłumaczenie spada na polski (nigdy na sam klucz). Ten plik nie
 * importuje niczego z serwera — czyta go i proxy, i klient.
 */

export const LOCALES = ["pl", "en", "de", "uk", "es"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "pl";

/**
 * Język dla przeglądarki ustawionej na język spoza listy (np. francuski,
 * rosyjski). Angielski rozumie najwięcej takich osób; polski zostaje
 * językiem źródłowym i domyślnym, gdy przeglądarka nie podaje żadnego.
 */
export const FOREIGN_FALLBACK_LOCALE: Locale = "en";

/** Ciasteczko z językiem. Czyta je proxy, layout i każda akcja serwerowa. */
export const LOCALE_COOKIE = "vairo-locale";

/** Nazwy języków zawsze we własnym języku — tak człowiek szuka swojego. */
export const LOCALE_NAMES: Record<Locale, string> = {
  pl: "Polski",
  en: "English",
  de: "Deutsch",
  uk: "Українська",
  es: "Español",
};

/** Tag BCP-47 do `Intl`, Web Speech API i atrybutu `lang`. */
export const LOCALE_TAGS: Record<Locale, string> = {
  pl: "pl-PL",
  en: "en-GB",
  de: "de-DE",
  uk: "uk-UA",
  es: "es-ES",
};

/** Nazwa języka po angielsku — dla instrukcji modelu AI i Whispera. */
export const LOCALE_ENGLISH_NAMES: Record<Locale, string> = {
  pl: "Polish",
  en: "English",
  de: "German",
  uk: "Ukrainian",
  es: "Spanish",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * Wybór języka z nagłówka `Accept-Language` przy pierwszym wejściu.
 * Nie zgadujemy narodowości z pokrewnego języka przeglądarki (np. rosyjski →
 * ukraiński) — język spoza listy dostaje angielski, a przełącznik jest
 * w Ustawieniach. Bez nagłówka: polski.
 */
export function negotiateLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const ranked = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { tag: tag.trim().toLowerCase(), q: q ? Number(q.trim().slice(2)) || 0 : 1 };
    })
    .filter((entry) => entry.tag)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return ranked.length ? FOREIGN_FALLBACK_LOCALE : DEFAULT_LOCALE;
}
