import type { Locale } from "@/i18n/config";
import { formatMessage, type MessageValues } from "@/i18n/format";

/**
 * Wspólny rdzeń `t()` dla serwera i klienta. Nie importuje słowników —
 * dostaje gotowy (scalony z polskim) słownik jednej przestrzeni.
 *
 * `t.has(key)` — dla kluczy budowanych z danych (np. `industry.<slug>`),
 * gdzie brak tłumaczenia jest normalny: branża dopisana przez użytkownika
 * zostaje w brzmieniu, w jakim ją wpisał.
 */
export type Translate<K extends string = string> = ((key: K, values?: MessageValues) => string) & {
  has: (key: string) => boolean;
  /** Tekst dla klucza spoza typu (zbudowanego z danych) albo `fallback`. */
  maybe: (key: string, fallback: string, values?: MessageValues) => string;
};

export function makeTranslate<K extends string>(
  locale: Locale,
  dict: Record<string, string> | undefined,
  namespace: string
): Translate<K> {
  const t = ((key: K, values?: MessageValues) => {
    const message = dict?.[key];
    if (message === undefined) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[i18n] brak klucza ${namespace}.${key}`);
      }
      return key;
    }
    return formatMessage(locale, message, values);
  }) as Translate<K>;
  t.has = (key) => dict?.[key] !== undefined;
  t.maybe = (key, fallback, values) => {
    const message = dict?.[key];
    return message === undefined ? fallback : formatMessage(locale, message, values);
  };
  return t;
}
