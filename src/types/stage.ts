/**
 * Silnik Stage: Stage → Kategoria → Punkt → Podpunkt → Pole.
 *
 * Treść jest danymi (supabase/content/*.json), nie kodem — te typy opisują
 * to, co przychodzi z bazy po imporcie.
 */

import type { SubpointGoalCondition } from "@/types/goals";

export const FIELD_KINDS = [
  "short_text",
  "long_text",
  "list_short",
  "list_long",
  "scale",
  "select",
  "multi_select",
  "number",
  "date",
  "files",
  "links",
  "checkmark",
  "sentence_template",
  "summary",
  "records",
  "action",
  "people",
] as const;

export type FieldKind = (typeof FIELD_KINDS)[number];

export type SentenceSlot = {
  key: string;
  label: string;
  size?: "sm" | "md" | "lg";
};

export type SummarySource = {
  /** Ścieżka `punkt.podpunkt.pole` w obrębie szablonu. */
  field: string;
  label: string;
};

export type RecordColumn = {
  key: string;
  label: string;
  placeholder?: string;
};

export type FieldConfig = {
  min?: number;
  max?: number;
  min_items?: number;
  max_items?: number;
  item_max?: number;
  unit?: string;
  options?: { value: string; label: string }[];
  min_label?: string;
  max_label?: string;
  accept?: string;
  max_files?: number;
  max_mb?: number;
  template?: string;
  slots?: SentenceSlot[];
  sources?: SummarySource[];
  confirm_label?: string;
  /** Pole, którego wartość staje się nazwą startupu (Ambition, roboczy tytuł). */
  syncs_startup_name?: boolean;
  /** Kolumny bloczka `records`. Użytkownik dodaje kolejne wiersze. */
  columns?: RecordColumn[];
  /** Pozwala dopisać własne kolumny do bloczka, np. w profilu co-foundera. */
  allow_custom_columns?: boolean;
  /** Pusta lista jest świadomą odpowiedzią — „niczego nie brakuje”. */
  empty_ok?: boolean;
  add_label?: string;
  /** Przycisk wychodzący z modala: sekcja Plików albo Social. */
  href?: string;
  label?: string;
};

/** Warunek, po którym podpunkt wypada z postępu etapu. */
export type SkipWhen = {
  answer_key: string;
  equals?: unknown;
  one_of?: string[];
};

export type RecordsValue = {
  rows: Record<string, string>[];
  extra_columns?: RecordColumn[];
};

export type StageField = {
  id: string;
  key: string;
  kind: FieldKind;
  question: string;
  help: string | null;
  example: string | null;
  isRequired: boolean;
  /** Klucz logiczny odpowiedzi — wspólny dla pytań powtarzanych w kategoriach. */
  answerKey: string;
  config: FieldConfig;
};

export type StageSubpoint = {
  id: string;
  key: string;
  title: string;
  description: string | null;
  isOptional: boolean;
  sharedKey: string | null;
  fields: StageField[];
  isComplete: boolean;
  /** Warunki liczby Goals. Pusta lista znaczy, że podpunkt ich nie ma. */
  goalConditions: SubpointGoalCondition[];
  /** Klucze `punkt.podpunkt`, które muszą być ukończone wcześniej. */
  dependsOn: string[];
  /** Wcześniejszy wynik jeszcze nie jest gotowy. */
  waitingOn: string | null;
  /** Warunek z treści sprawił, że podpunkt nie liczy się do postępu. */
  skipped: boolean;
  skipWhen: SkipWhen | null;
  /** Kategorie, w których to samo pytanie też występuje (zwinięte duplikaty). */
  alsoIn: string[];
};

export type StagePoint = {
  id: string;
  key: string;
  title: string;
  description: string | null;
  durationHint: string | null;
  guideBody: string | null;
  guideSources: string[];
  guideSourceLabel: string | null;
  subpoints: StageSubpoint[];
  done: number;
  total: number;
  isComplete: boolean;
};

export type StageCategory = {
  id: string;
  key: string;
  title: string;
  intro: string | null;
  points: StagePoint[];
  done: number;
  total: number;
  isComplete: boolean;
};

export type StageTree = {
  startupStageId: string;
  templateKey: string;
  title: string;
  subtitle: string | null;
  intro: string | null;
  finishLabel: string | null;
  status: "in_progress" | "completed";
  /** Idea Stage ma kilka kategorii; Ambition jedną, więc UI ją ukrywa. */
  showCategories: boolean;
  categories: StageCategory[];
  answers: Record<string, unknown>;
  lastSubpointId: string | null;
  done: number;
  total: number;
  canFinish: boolean;
  /**
   * Czy zalogowany user moze zmieniac odpowiedzi. Rola Czlonka daje odczyt,
   * Founder i Admin zapis. To samo egzekwuje RLS (migracja 008) — tutaj
   * trzymamy to po to, zeby interfejs nie obiecywal dzialania, ktore i tak
   * zostanie odrzucone.
   */
  canEdit: boolean;
};

/** Czy odpowiedź liczy się jako udzielona. Musi zgadzać się z triggerem w bazie. */
/**
 * Pominięte pytanie („Pomiń”). Zapisujemy je w tym samym miejscu co odpowiedź,
 * jako znacznik zamiast wartości:
 *
 *   • baza uznaje każdy niepusty obiekt za uzupełnienie, więc pominięte
 *     pytanie liczy się do postępu bez zmiany funkcji przeliczającej;
 *   • „Odpowiedz jednak” po prostu nadpisuje znacznik prawdziwą odpowiedzią —
 *     nie ma osobnej flagi, która mogłaby się rozjechać z treścią.
 *
 * Klucz z podwójnym podkreśleniem nie zderzy się z niczym, co zapisują pola:
 * luki szablonu zdania i kolumny tabel mają nazwy z treści etapów.
 * Komponent pola nigdy nie dostaje tego znacznika jako wartości — zamiast
 * kontrolki pokazuje wtedy informację o pominięciu.
 */
export const SKIPPED_ANSWER: Readonly<{ __skipped: true }> = Object.freeze({
  __skipped: true,
});

export function isSkipped(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    (value as Record<string, unknown>).__skipped === true
  );
}

/**
 * Czy pytanie można pominąć. Tylko wymagane — opcjonalne i tak da się
 * zostawić puste. Bez podsumowania (potwierdza się je, nie odpowiada na nie)
 * i bez pola, które nadaje nazwę startupowi: bez niej team nie ma nazwy.
 */
export function canSkipField(field: { kind: FieldKind; isRequired: boolean; config: FieldConfig }) {
  return field.isRequired && field.kind !== "summary" && !field.config.syncs_startup_name;
}

export function hasAnswer(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (isSkipped(value)) return true;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return true;
  if (Array.isArray(value)) {
    return value.length > 0 && value.some((item) => hasAnswer(item));
  }
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some(hasAnswer);
  }
  return false;
}

/**
 * Luka w szablonie zdania: `{kto}`, `{po-co}`. Nazwy luk w treści etapów
 * mają też myślniki — wcześniejsza reguła `[a-z0-9_]` ich nie łapała, więc
 * `{po-co}` zostawało w zdaniu dosłownie i trzeciego pola nie dało się wypełnić.
 * Funkcja, nie stała: wyrażenie z flagą `g` trzyma stan (`lastIndex`).
 */
export function templateSlotPattern() {
  return /\{([a-z0-9_-]+)\}/gi;
}

/** Pusta wartość startowa dla danego typu pola. */
export function emptyValueFor(kind: FieldKind): unknown {
  switch (kind) {
    case "list_short":
    case "list_long":
    case "multi_select":
    case "files":
    case "links":
      return [];
    case "checkmark":
      return false;
    case "scale":
    case "number":
      return null;
    case "sentence_template":
    case "summary":
      return {};
    case "records":
      return { rows: [], extra_columns: [] } satisfies RecordsValue;
    case "action":
      return false;
    case "people":
      return [];
    default:
      return "";
  }
}

export function asRecords(value: unknown): RecordsValue {
  if (value && typeof value === "object" && !Array.isArray(value) && "rows" in value) {
    const raw = value as RecordsValue;
    return {
      rows: Array.isArray(raw.rows) ? raw.rows : [],
      extra_columns: Array.isArray(raw.extra_columns) ? raw.extra_columns : [],
    };
  }
  return { rows: [], extra_columns: [] };
}

/** Czy zapisana wartość spełnia pole. Pusta lista bloczków liczy się tylko przy `empty_ok`. */
export function fieldAnswered(
  field: { kind: FieldKind; config: FieldConfig },
  value: unknown
): boolean {
  if (isSkipped(value)) return true;
  if (field.kind === "records") {
    if (value === null || value === undefined) return false;
    const filled = asRecords(value).rows.some((row) =>
      Object.values(row).some((cell) => String(cell ?? "").trim().length > 0)
    );
    if (filled) return true;
    return Boolean(field.config.empty_ok) && typeof value === "object";
  }
  if (field.kind === "action") return value === true;
  if (field.kind === "people") {
    if (Array.isArray(value) && value.length > 0) return true;
    return Boolean(field.config.empty_ok) && Array.isArray(value);
  }
  return hasAnswer(value);
}

export function matchesSkip(
  skip: SkipWhen | null | undefined,
  answers: Record<string, unknown>
): boolean {
  if (!skip) return false;
  const value = answers[skip.answer_key];
  if (skip.one_of && skip.one_of.length > 0) {
    return typeof value === "string" && skip.one_of.includes(value);
  }
  if ("equals" in skip) return value === skip.equals;
  return false;
}

/**
 * Decyzja kończąca etap (guidelines 10.5). System nie ocenia pomysłu —
 * zapisuje to, co zdecydował człowiek, razem ze snapshotem odpowiedzi.
 */
export const STAGE_DECISIONS = ["continue", "pivot", "pause", "archive"] as const;

export type StageDecision = (typeof STAGE_DECISIONS)[number];

export const STAGE_DECISION_COPY: Record<
  StageDecision,
  { label: string; description: string; tone: "brand" | "warning" | "danger" }
> = {
  continue: {
    label: "Kontynuuj",
    description:
      "Wyniki wystarczają, żeby iść dalej. Etap zostaje domknięty, a kolejny się otwiera.",
    tone: "brand",
  },
  pivot: {
    label: "Zmień kierunek",
    description:
      "Coś się nie potwierdziło. Zapisujemy decyzję, etap zostaje otwarty, a Ty wybierasz, które podpunkty wypełnić na nowo. Poprzednie odpowiedzi zostają w historii.",
    tone: "warning",
  },
  pause: {
    label: "Wstrzymaj",
    description:
      "Odkładasz ten startup na później. Nic nie ginie, kolejny etap się nie otwiera.",
    tone: "warning",
  },
  archive: {
    label: "Odrzuć pomysł",
    description:
      "Zamykasz ten pomysł. Startup trafia do archiwum razem z całą pracą, która została wykonana.",
    tone: "danger",
  },
};

/** Etapy, które kończą się decyzją. Pozostałe domykamy jednym przyciskiem. */
export const STAGES_WITH_DECISION: string[] = ["idea"];
