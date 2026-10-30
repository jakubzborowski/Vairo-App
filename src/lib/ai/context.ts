import {
  asRecords,
  isSkipped,
  templateSlotPattern,
  type StageField,
  type StagePoint,
  type StageTree,
} from "@/types/stage";

/** Odpowiedź jako tekst dla modelu. Puste i pominięte → null. */
export function answerToText(field: StageField, value: unknown): string | null {
  if (value === null || value === undefined || isSkipped(value)) return null;
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number") return `${value}${field.config.unit ? ` ${field.config.unit}` : ""}`;
  if (typeof value === "boolean") return value ? "tak" : null;
  if (Array.isArray(value)) {
    const items = value
      .map((item) => (typeof item === "string" ? item : (item as { name?: string; url?: string })?.name ?? (item as { url?: string })?.url ?? ""))
      .filter((item) => typeof item === "string" && item.trim());
    return items.length ? items.map((item) => `– ${item}`).join("\n") : null;
  }
  if (field.kind === "sentence_template" && field.config.template) {
    const slots = value as Record<string, unknown>;
    if (!Object.values(slots).some((v) => typeof v === "string" && v.trim())) return null;
    return field.config.template.replace(templateSlotPattern(), (_, key: string) => {
      const slot = slots[key];
      return typeof slot === "string" && slot.trim() ? slot.trim() : "…";
    });
  }
  if (field.kind === "records") {
    const rows = asRecords(value).rows ?? [];
    const lines = rows
      .map((row) => Object.values(row).filter((v) => typeof v === "string" && v.trim()).join(" | "))
      .filter(Boolean);
    return lines.length ? lines.map((line) => `– ${line}`).join("\n") : null;
  }
  try {
    const json = JSON.stringify(value);
    return json && json !== "{}" ? json.slice(0, 600) : null;
  } catch {
    return null;
  }
}

export function locateField(tree: StageTree, answerKey: string) {
  for (const category of tree.categories)
    for (const point of category.points)
      for (const subpoint of point.subpoints)
        for (const field of subpoint.fields)
          if (field.answerKey === answerKey) return { category, point, subpoint, field };
  return null;
}

export function locatePoint(tree: StageTree, pointKey: string) {
  for (const category of tree.categories)
    for (const point of category.points) if (point.key === pointKey) return { category, point };
  return null;
}

function clip(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max)}\n[…skrócone]` : text;
}

/** Odpowiedzi z punktu jako „Pytanie: odpowiedź”. */
export function pointAnswers(tree: StageTree, point: StagePoint, answers: Record<string, unknown>) {
  const lines: string[] = [];
  for (const subpoint of point.subpoints) {
    for (const field of subpoint.fields) {
      const text = answerToText(field, answers[field.answerKey]);
      lines.push(`${field.question}\n${text ?? "(brak odpowiedzi)"}`);
    }
  }
  return lines.join("\n\n");
}

/** Wszystkie odpowiedzi etapu (bez pustych), przycięte do limitu. */
export function stageAnswers(tree: StageTree, answers: Record<string, unknown>, max = 14_000) {
  const seen = new Set<string>();
  const blocks: string[] = [];
  for (const category of tree.categories) {
    for (const point of category.points) {
      const lines: string[] = [];
      for (const subpoint of point.subpoints)
        for (const field of subpoint.fields) {
          if (seen.has(field.answerKey)) continue;
          seen.add(field.answerKey);
          const text = answerToText(field, answers[field.answerKey]);
          if (text) lines.push(`${field.question}\n${text}`);
        }
      if (lines.length) blocks.push(`## ${category.title} → ${point.title}\n${lines.join("\n\n")}`);
    }
  }
  return clip(blocks.join("\n\n"), max);
}

export function startupHeader(params: { name: string; categories: string[]; tree: StageTree }) {
  return [
    `Startup: ${params.name}`,
    `Kategorie: ${params.categories.join(", ")}`,
    `Etap programu: ${params.tree.title}${params.tree.intro ? ` — ${params.tree.intro}` : ""}`,
  ].join("\n");
}

export { clip };
