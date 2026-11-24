import type { Locale } from "@/i18n/config";
import pl from "./pl";
import en from "./en";
import de from "./de";
import uk from "./uk";
import es from "./es";

/**
 * Wszystkie słowniki. Importuje to WYŁĄCZNIE serwer (`server.ts`, layout) —
 * klient dostaje jeden scalony słownik przez `I18nProvider`, więc do
 * przeglądarki nie trafia pięć języków naraz.
 */
export type Messages = typeof pl;
export type Namespace = keyof Messages;
export type MessageKey<N extends Namespace> = keyof Messages[N] & string;

/** Słownik jednego języka: przestrzeń → klucz → tekst. */
export type Dictionary = { [N in Namespace]: Record<string, string> };

const ALL: Record<Locale, Partial<Record<Namespace, Record<string, string>>>> = {
  pl,
  en,
  de,
  uk,
  es,
};

/**
 * Słownik języka z polskim pod spodem: brakujące tłumaczenie pokazuje polski
 * tekst, a nie sam klucz. `npm run i18n:check` pilnuje, żeby takich luk nie było.
 */
export function dictionaryFor(locale: Locale): Dictionary {
  const base = ALL.pl as Dictionary;
  if (locale === "pl") return base;
  const overlay = ALL[locale];
  const out = {} as Dictionary;
  for (const ns of Object.keys(base) as Namespace[]) {
    out[ns] = { ...base[ns], ...(overlay[ns] ?? {}) };
  }
  return out;
}
