import type { MessageKey } from "@/i18n/messages";
import type { Translate } from "@/i18n/translator";

/**
 * Nazwy z bazy, które Vairo samo zasiało (`is_suggested`): umiejętności
 * i branże. Tłumaczymy je po `slug` ze słownika `labels`
 * (`skill.<slug>`, `industry.<slug>`). Pozycje dopisane przez ludzi zostają
 * w brzmieniu autora — nie zgadujemy przekładu cudzych słów.
 */
type Labels = Translate<MessageKey<"labels">>;

export function skillLabel(tl: Labels, skill: { slug: string; label: string }) {
  return tl.maybe(`skill.${skill.slug}`, skill.label);
}

export function industryLabel(tl: Labels, tag: { slug: string; label: string }) {
  return tl.maybe(`industry.${tag.slug}`, tag.label);
}
