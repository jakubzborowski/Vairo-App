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

/**
 * Ikona formy dowodu. Nazwa, przykład, pytanie w kreatorze i podpowiedź są
 * w słowniku `goals`: `proofMeta.<kind>.label|example|question|placeholder`.
 */
export const PROOF_KIND_META: Record<ProofKind, { icon: LucideIcon }> = {
  sentence: { icon: Type },
  long_text: { icon: FileText },
  link: { icon: Link2 },
  file: { icon: Paperclip },
  module_result: { icon: Waypoints },
  select: { icon: List },
  scale: { icon: SlidersHorizontal },
  goal_set: { icon: Layers },
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
