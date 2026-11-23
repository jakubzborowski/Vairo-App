import type { Locale } from "@/i18n/config";

/**
 * Tłumaczenie treści etapów — nakładka na polski wiersz z bazy.
 *
 * Każda tabela `stage_*` ma kolumnę `translations` (migracja 049):
 *   { "de": { "title": "…", "config": { "options": [...] } }, "uk": …, "es": … }
 * Wypełnia ją 050, generowana z `supabase/content/i18n/` przez
 * `node scripts/content-i18n.mjs build`.
 *
 * Zasady:
 *   • polski jest zawsze pod spodem — brak tłumaczenia pola = polski tekst;
 *   • `config` łączymy głęboko: tłumaczenie niesie tylko teksty (etykiety
 *     opcji, kolumn, slotów), a liczby, klucze i `value` opcji zostają
 *     z oryginału — to one trafiają do odpowiedzi i warunków;
 *   • bez migracji 049 kolumny nie ma — `selectTranslations()` mówi
 *     zapytaniom, czy o nią prosić, a wiersz bez niej przechodzi bez zmian.
 */

export type Translations = Partial<Record<Locale, Record<string, unknown>>> | null | undefined;

/** Fragment `select` z kolumną tłumaczeń — pusty dla polskiego. */
export function selectTranslations(locale: Locale, prefix = "") {
  return locale === "pl" ? "" : `${prefix}translations, `;
}

/** Czy błąd zapytania to brak kolumny z 049 (wtedy ponawiamy bez niej). */
export function isMissingTranslations(message: string | undefined) {
  return Boolean(message && message.includes("translations"));
}

type Plain = Record<string, unknown>;

const isPlain = (value: unknown): value is Plain =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Łączenie `config`: tablice z tłumaczenia (options, columns, slots…) mają
 * już pełny kształt oryginału z podmienionymi etykietami — generator składa
 * je z oryginału — więc zastępują tablicę w całości. Obiekty łączymy rekurencyjnie.
 */
function mergeConfig(base: unknown, overlay: unknown): unknown {
  if (!isPlain(base) || !isPlain(overlay)) return overlay ?? base;
  const out: Plain = { ...base };
  for (const [key, value] of Object.entries(overlay)) {
    out[key] = isPlain(value) && isPlain(base[key]) ? mergeConfig(base[key], value) : value;
  }
  return out;
}

/** Wiersz `stage_*` w języku użytkownika. Nie zmienia wejścia. */
export function localizeRow<T extends { translations?: Translations }>(row: T, locale: Locale): T {
  if (locale === "pl" || !row?.translations) return row;
  const tr = row.translations[locale];
  if (!isPlain(tr)) return row;

  const out = { ...row } as Plain;
  for (const [key, value] of Object.entries(tr)) {
    if (key === "config") out.config = mergeConfig(out.config, value);
    else if (typeof value === "string" ? value.trim() !== "" : value !== null && value !== undefined) {
      out[key] = value;
    }
  }
  return out as T;
}

/**
 * Całe drzewo z `select` PostgRESTa (kategorie → punkty → podpunkty → pola)
 * w jednym przejściu. Nazwy zagnieżdżeń jak w aliasach zapytania.
 */
export function localizeTree<T>(rows: T[], locale: Locale, children: string[] = ["points", "subpoints", "fields"]): T[] {
  if (locale === "pl") return rows;
  const [child, ...rest] = children;
  return rows.map((row) => {
    const localized = localizeRow(row as { translations?: Translations }, locale) as Plain;
    if (child && Array.isArray(localized[child])) {
      localized[child] = localizeTree(localized[child] as unknown[], locale, rest);
    }
    return localized as T;
  });
}
