import {
  Box,
  FileText,
  Flag,
  FlaskConical,
  Hammer,
  Layers,
  Link2,
  List,
  MessagesSquare,
  Paperclip,
  SlidersHorizontal,
  Type,
  UserCheck,
  Waypoints,
  type LucideIcon,
} from "lucide-react";
import type { ProofKind, ProofRequirement } from "@/types/goals";

/** Ikona typu celu. Nieznany typ (nowy w bazie) dostaje flagę. */
const TYPE_ICONS: Record<string, LucideIcon> = {
  custom: Flag,
  product_test: FlaskConical,
  build_result: Hammer,
  prototype: Box,
  customer: UserCheck,
  research: MessagesSquare,
};

export function goalTypeIcon(id: string): LucideIcon {
  return TYPE_ICONS[id] ?? Flag;
}

type KindMeta = {
  icon: LucideIcon;
  label: string;
  /** Przykład pod nazwą formy w kreatorze. */
  example: string;
  /** Pytanie w kroku „co ma pokazać" — zna już formę. */
  question: string;
  placeholder: string;
};

export const PROOF_KIND_META: Record<ProofKind, KindMeta> = {
  sentence: {
    icon: Type,
    label: "Jedno zdanie",
    example: "np. „Klient zapłacił za pierwszy miesiąc”",
    question: "O czym ma mówić to zdanie?",
    placeholder: "Na przykład: kto zapłacił i za co",
  },
  long_text: {
    icon: FileText,
    label: "Dłuższy tekst",
    example: "np. opis wyniku testu",
    question: "Co ma się znaleźć w tym opisie?",
    placeholder: "Na przykład: co zadziałało, a co nie",
  },
  link: {
    icon: Link2,
    label: "Link",
    example: "np. adres działającej strony",
    question: "Co ma być pod tym linkiem?",
    placeholder: "Na przykład: strona, na której da się założyć konto",
  },
  file: {
    icon: Paperclip,
    label: "Plik",
    example: "np. podpisana umowa, raport",
    question: "Jaki plik zamknie ten cel?",
    placeholder: "Na przykład: podpisana umowa w PDF",
  },
  module_result: {
    icon: Waypoints,
    label: "Wersja Rozpiski",
    example: "zapisany plan pracy",
    question: "Jaki plan ma pokazać Rozpiska?",
    placeholder: "Na przykład: przebieg od zamówienia do dostawy",
  },
  select: {
    icon: List,
    label: "Wybór z listy",
    example: "jedna z ustalonych odpowiedzi",
    question: "O co pytamy przy kończeniu celu?",
    placeholder: "Na przykład: czy klient przedłużył umowę",
  },
  scale: {
    icon: SlidersHorizontal,
    label: "Skala",
    example: "ocena od 1 do 5",
    question: "Co oceniacie na skali od 1 do 5?",
    placeholder: "Na przykład: jak bardzo test potwierdził pomysł",
  },
  goal_set: {
    icon: Layers,
    label: "Zestaw ukończonych celów",
    example: "kilka celów zamyka jeden",
    question: "Jakie cele składają się na ten wynik?",
    placeholder: "Na przykład: trzy testy z użytkownikami",
  },
};

/** Formy pokazywane w kreatorze. Skala i zestaw celów zostają dla warunków etapu. */
export const COMMON_PROOF_KINDS: ProofKind[] = [
  "sentence",
  "long_text",
  "link",
  "file",
  "module_result",
  "select",
];

export function buildRequirement(kind: ProofKind, label: string, optionsText: string): ProofRequirement {
  const clean = label.trim();
  if (kind === "select") {
    const options = optionsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => ({ value: line, label: line }));
    return { kind, label: clean, options };
  }
  if (kind === "scale") return { kind, label: clean, min: 1, max: 5 };
  if (kind === "goal_set") return { kind, label: clean, min_count: 1 };
  if (kind === "module_result") return { kind, label: clean, module: "workflow" };
  return { kind, label: clean };
}

export function optionsCount(optionsText: string) {
  return optionsText.split("\n").filter((line) => line.trim()).length;
}
