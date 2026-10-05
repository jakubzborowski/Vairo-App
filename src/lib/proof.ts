import type { ProofRequirement, ProofSnapshot } from "@/types/goals";

/**
 * Ta sama reguła co `proof_matches` w migracji 018.
 * Baza i tak odrzuca zły dowód — tu tylko mówimy człowiekowi, czego brakuje,
 * zanim kliknie „Ukończ".
 */
export function proofMatches(
  requirement: ProofRequirement | null | undefined,
  snapshot: ProofSnapshot | null | undefined
): boolean {
  if (!requirement || !snapshot) return false;
  if (snapshot.kind !== requirement.kind) return false;

  switch (requirement.kind) {
    case "sentence": {
      const text = snapshot.text?.trim() ?? "";
      return text.length >= 1 && text.length <= 240 && !text.includes("\n");
    }
    case "long_text": {
      const text = snapshot.text?.trim() ?? "";
      return text.length >= 1 && text.length <= 8000;
    }
    case "select": {
      if (!snapshot.option) return false;
      const options = requirement.options ?? [];
      if (options.length === 0) return true;
      return options.some((option) => option.value === snapshot.option);
    }
    case "scale": {
      const min = requirement.min ?? 1;
      const max = requirement.max ?? 5;
      return (
        typeof snapshot.scale === "number" &&
        Number.isInteger(snapshot.scale) &&
        snapshot.scale >= min &&
        snapshot.scale <= max
      );
    }
    case "link": {
      const url = snapshot.url?.trim() ?? "";
      const note = snapshot.note?.trim() ?? "";
      return /^https?:\/\/\S+$/i.test(url) && note.length >= 1 && note.length <= 500;
    }
    case "file":
      return Boolean(snapshot.file?.path && snapshot.file.name);
    case "module_result":
      return Boolean(
        snapshot.module &&
          ((snapshot.workflow_id && typeof snapshot.version === "number") ||
            snapshot.ref_id)
      );
    case "goal_set": {
      const ids = snapshot.goal_ids ?? [];
      const unique = new Set(ids);
      const min = Math.max(requirement.min_count ?? 1, 1);
      return unique.size === ids.length && unique.size >= min;
    }
    default:
      return false;
  }
}

export function proofGap(requirement: ProofRequirement): string {
  switch (requirement.kind) {
    case "sentence":
      return "Wpisz jedno zdanie — bez enteru.";
    case "long_text":
      return "Opisz wynik kilkoma zdaniami.";
    case "select":
      return "Wybierz jedną z przygotowanych opcji.";
    case "scale":
      return "Zaznacz wartość na skali.";
    case "link":
      return "Wklej adres https i jednym zdaniem napisz, co tam jest.";
    case "file":
      return "Wybierz plik z biblioteki tego startupu.";
    case "module_result":
      return "Wybierz zapisaną wersję Rozpiski.";
    case "goal_set":
      return "Wskaż ukończone cele z dowodem.";
    default:
      return "Dodaj dowód w wymaganym formacie.";
  }
}

export function isProofKind(value: string): value is ProofRequirement["kind"] {
  return (
    value === "sentence" ||
    value === "long_text" ||
    value === "select" ||
    value === "scale" ||
    value === "link" ||
    value === "file" ||
    value === "module_result" ||
    value === "goal_set"
  );
}

export function parseRequirement(value: unknown): ProofRequirement {
  const raw = (value ?? {}) as Partial<ProofRequirement>;
  const kind = typeof raw.kind === "string" && isProofKind(raw.kind) ? raw.kind : "long_text";
  return {
    kind,
    label: typeof raw.label === "string" && raw.label.trim() ? raw.label.trim() : "Wynik",
    options: Array.isArray(raw.options) ? raw.options : undefined,
    min: typeof raw.min === "number" ? raw.min : undefined,
    max: typeof raw.max === "number" ? raw.max : undefined,
    min_count: typeof raw.min_count === "number" ? raw.min_count : undefined,
    module: typeof raw.module === "string" ? raw.module : undefined,
  };
}

export function parseSnapshot(value: unknown): ProofSnapshot | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as ProofSnapshot;
  if (!raw.kind || !isProofKind(raw.kind)) return null;
  return raw;
}

type QualifyGoal = {
  startupId: string;
  goalTypeId: string;
  status: string;
  archivedAt: string | null;
  ownerId?: string | null;
  dueDate?: string | null;
  proofRequirement: ProofRequirement;
  proofSnapshot: ProofSnapshot | null;
};

/** Cel wlicza się do warunku. Sam zbieżny tytuł nie wystarcza — powiązanie jest osobno. */
export function goalQualifies(
  goal: QualifyGoal,
  condition: {
    startupId: string;
    goalTypeId: string;
    proofKind: string | null;
    countsWhen?: "completed" | "defined" | null;
    matchAnyType?: boolean;
  }
): boolean {
  if (goal.startupId !== condition.startupId) return false;
  if (goal.archivedAt) return false;
  if (!condition.matchAnyType && goal.goalTypeId !== condition.goalTypeId) return false;
  if (condition.countsWhen === "defined") {
    return Boolean(goal.ownerId && goal.dueDate && goal.proofRequirement.kind);
  }
  if (goal.status !== "completed") return false;
  if (!proofMatches(goal.proofRequirement, goal.proofSnapshot)) return false;
  if (condition.proofKind && goal.proofSnapshot?.kind !== condition.proofKind) return false;
  return true;
}
