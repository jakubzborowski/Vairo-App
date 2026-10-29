/**
 * Kolor kategorii walidacyjnej — z uwag do redesignu:
 * Ogólne pomarańcz, SaaS czerwień, B2B niebieski, B2C zieleń,
 * Hardware cyjan, Social żółty.
 *
 * Kolor oznacza MIEJSCE (w której kategorii jesteś), a nie akcję, więc idzie
 * wyłącznie na znaczniki: kreskę przy wierszu, kropkę, ikonę nagłówka,
 * obwódkę kolumny. Tekst zostaje biały lub szary, a przycisk główny —
 * pomarańczowy. Wartości to tokeny z globals.css, nie hexy.
 *
 * `social` jest tu zawczasu: kategoria jeszcze nie istnieje w bazie, ale
 * kolor jest już ustalony i nie trzeba go będzie wymyślać przy jej dodaniu.
 */
const CATEGORY_ACCENT: Record<string, string> = {
  general: "var(--cat-general)",
  saas: "var(--cat-saas)",
  b2b: "var(--cat-b2b)",
  b2c: "var(--cat-b2c)",
  hardware: "var(--cat-hardware)",
  social: "var(--cat-social)",
};

/** Kolor kategorii albo `undefined`, gdy klucz nie jest kategorią. */
export function categoryAccent(key: string | null | undefined): string | undefined {
  return key ? CATEGORY_ACCENT[key] : undefined;
}

/**
 * Styl ustawiający zmienną `--accent` na elemencie. Klasy Tailwinda biorą
 * kolor z `var(--accent)`, więc jeden komponent obsługuje każdą kategorię
 * bez generowania osobnych klas na każdy kolor.
 */
export function accentStyle(accent: string | undefined): React.CSSProperties | undefined {
  return accent ? ({ "--accent": accent } as React.CSSProperties) : undefined;
}
