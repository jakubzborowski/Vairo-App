import { LOCALE_TAGS, type Locale } from "@/i18n/config";

/**
 * Minimalny formatter komunikatów w składni ICU — tyle, ile potrzebuje Vairo:
 *
 *   "Witaj, {name}"
 *   "{count, plural, one {# cel} few {# cele} many {# celów} other {# celu}}"
 *   "{count, plural, =0 {Brak zadań} one {# zadanie} other {# zadań}}"
 *   "{role, select, founder {Founder} admin {Admin} other {Członek}}"
 *
 * Kategorie liczby mnogiej bierzemy z `Intl.PluralRules`, więc polski
 * i ukraiński dostają one/few/many, a niemiecki i hiszpański one/other.
 * Brak kategorii w tłumaczeniu → `other`. Bez zależności, działa na serwerze
 * i w przeglądarce.
 */

export type MessageValues = Record<string, string | number | null | undefined>;

const pluralCache = new Map<Locale, Intl.PluralRules>();

function pluralRules(locale: Locale) {
  let rules = pluralCache.get(locale);
  if (!rules) {
    rules = new Intl.PluralRules(LOCALE_TAGS[locale]);
    pluralCache.set(locale, rules);
  }
  return rules;
}

/** Indeks nawiasu zamykającego dla `{` na pozycji `start`. */
function matchBrace(text: string, start: number): number {
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** `one {…} few {…} other {…}` → mapa wariantów. */
function parseOptions(body: string): Map<string, string> {
  const options = new Map<string, string>();
  let i = 0;
  while (i < body.length) {
    while (i < body.length && /\s/.test(body[i])) i++;
    const keyStart = i;
    while (i < body.length && body[i] !== "{" && !/\s/.test(body[i])) i++;
    const key = body.slice(keyStart, i);
    while (i < body.length && /\s/.test(body[i])) i++;
    if (body[i] !== "{") break;
    const end = matchBrace(body, i);
    if (end < 0) break;
    options.set(key, body.slice(i + 1, end));
    i = end + 1;
  }
  return options;
}

function formatNumber(locale: Locale, value: number) {
  return new Intl.NumberFormat(LOCALE_TAGS[locale]).format(value);
}

export function formatMessage(
  locale: Locale,
  message: string,
  values: MessageValues = {},
  pound?: number
): string {
  let out = "";
  let i = 0;

  while (i < message.length) {
    const ch = message[i];

    if (ch === "#" && pound !== undefined) {
      out += formatNumber(locale, pound);
      i++;
      continue;
    }

    if (ch !== "{") {
      out += ch;
      i++;
      continue;
    }

    const end = matchBrace(message, i);
    if (end < 0) {
      out += message.slice(i);
      break;
    }

    const inner = message.slice(i + 1, end);
    const firstComma = inner.indexOf(",");

    if (firstComma < 0) {
      const name = inner.trim();
      const value = values[name];
      out += value === null || value === undefined ? "" : String(value);
    } else {
      const name = inner.slice(0, firstComma).trim();
      const rest = inner.slice(firstComma + 1);
      const secondComma = rest.indexOf(",");
      const type = rest.slice(0, secondComma).trim();
      const options = parseOptions(rest.slice(secondComma + 1));
      const raw = values[name];

      if (type === "plural") {
        const n = Number(raw ?? 0);
        const exact = options.get(`=${n}`);
        const branch =
          exact ?? options.get(pluralRules(locale).select(n)) ?? options.get("other") ?? "";
        out += formatMessage(locale, branch, values, n);
      } else if (type === "select") {
        const branch = options.get(String(raw)) ?? options.get("other") ?? "";
        out += formatMessage(locale, branch, values, pound);
      } else {
        out += raw === null || raw === undefined ? "" : String(raw);
      }
    }

    i = end + 1;
  }

  return out;
}

// ── Daty i liczby ──────────────────────────────────────────────────────────

/** `Intl.DateTimeFormat` w języku interfejsu. Strefa czasu zostaje domyślna. */
export function dateFormatter(locale: Locale, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], options);
}

export function formatDate(
  locale: Locale,
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions
) {
  return dateFormatter(locale, options).format(new Date(date));
}

export function numberFormatter(locale: Locale, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(LOCALE_TAGS[locale], options);
}
