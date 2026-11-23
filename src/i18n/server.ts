import { cache } from "react";
import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, isLocale, negotiateLocale, type Locale } from "@/i18n/config";
import { dictionaryFor, type MessageKey, type Namespace } from "@/i18n/messages";
import { makeTranslate, type Translate } from "@/i18n/translator";

/**
 * Język bieżącego żądania.
 *
 * Kolejność: ciasteczko `vairo-locale` (wybór z Ustawień albo zapamiętany
 * z profilu przy logowaniu) → `Accept-Language` przeglądarki → polski.
 * Proxy ustawia ciasteczko przy pierwszym wejściu, ale pierwsza odpowiedź
 * renderuje się jeszcze bez niego — stąd odczyt nagłówka tutaj.
 *
 * `cache()` — jedno żądanie, jedno odczytanie, niezależnie od tego, ile
 * komponentów woła `getT()`.
 */
export const getLocale = cache(async (): Promise<Locale> => {
  const store = await cookies();
  const fromCookie = store.get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;
  const list = await headers();
  return negotiateLocale(list.get("accept-language"));
});

const dictionary = cache(async () => dictionaryFor(await getLocale()));

/** `t()` jednej przestrzeni słownika, np. `const t = await getT("settings")`. */
export async function getT<N extends Namespace>(namespace: N): Promise<Translate<MessageKey<N>>> {
  const locale = await getLocale();
  const dict = await dictionary();
  return makeTranslate<MessageKey<N>>(locale, dict[namespace], namespace);
}

/** `t()` dla wskazanego języka — np. mail albo powiadomienie dla innej osoby. */
export function getTFor<N extends Namespace>(
  locale: Locale,
  namespace: N
): Translate<MessageKey<N>> {
  return makeTranslate<MessageKey<N>>(locale, dictionaryFor(locale)[namespace], namespace);
}

/** Cały scalony słownik — dla `I18nProvider` w głównym layoucie. */
export async function getDictionary() {
  return dictionary();
}
