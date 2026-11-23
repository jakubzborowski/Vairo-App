import type { MessageKey } from "@/i18n/messages";
import type { Translate } from "@/i18n/translator";

/**
 * Nazwy z bazy, które Vairo samo zasiało (`is_suggested`): branże
 * (umiejętności z seedu to angielskie nazwy techniczne). Tłumaczymy je ze słownika `labels` (`skill.<slug>`,
 * `industry.<slug>`). Pozycje dopisane przez ludzi zostają w brzmieniu
 * autora — nie zgadujemy przekładu cudzych słów.
 *
 * Widoki `public_*` oddają umiejętności i tagi bez `slug` (tylko id i nazwę),
 * więc zasiane pozycje rozpoznajemy też po polskiej nazwie z seedów
 * (002, 003c). Nowa zasiana pozycja = wpis tutaj i klucz w `labels`.
 */
type Labels = Translate<MessageKey<"labels">>;
type Named = { slug?: string | null; label: string };

// Zasiane umiejętności (002) to nazwy techniczne po angielsku — React, SQL,
// UI Design — i tak zostają w każdym języku. Mapa jest pusta celowo.
const SEEDED_SKILLS: Record<string, string> = {};

const SEEDED_INDUSTRIES: Record<string, string> = {
  Finanse: "fintech",
  Edukacja: "edtech",
  Zdrowie: "healthtech",
  Gastronomia: "gastronomia",
  Logistyka: "logistyka",
  Nieruchomości: "nieruchomosci",
  Produktywność: "produktywnosc",
  "HR i rekrutacja": "hr",
  "Marketing i sprzedaż": "marketing",
  "Media i treści": "media",
  "Rozrywka i gry": "rozrywka",
  "Sport i kondycja": "sport",
  Podróże: "podroze",
  "Moda i uroda": "moda",
  "Dom i wnętrza": "dom",
  Motoryzacja: "motoryzacja",
  Rolnictwo: "rolnictwo",
  Budownictwo: "budownictwo",
  "Energia i środowisko": "energia",
  Prawo: "prawo",
  Społeczności: "spolecznosci",
};

export function skillLabel(tl: Labels, skill: Named) {
  const slug = skill.slug ?? SEEDED_SKILLS[skill.label];
  return slug ? tl.maybe(`skill.${slug}`, skill.label) : skill.label;
}

export function industryLabel(tl: Labels, tag: Named) {
  const slug = tag.slug ?? SEEDED_INDUSTRIES[tag.label];
  return slug ? tl.maybe(`industry.${slug}`, tag.label) : tag.label;
}
