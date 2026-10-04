/**
 * Silnik Stage: Stage → Kategoria → Punkt → Podpunkt → Pole.
 *
 * Treść jest danymi (supabase/content/*.json), nie kodem — te typy opisują
 * to, co przychodzi z bazy po imporcie.
 */

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
export function hasAnswer(value: unknown): boolean {
  if (value === null || value === undefined) return false;
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
 * Decyzja konczaca etap (guidelines 10.5). System nie ocenia pomyslu —
 * zapisuje to, co zdecydowal czlowiek, razem ze snapshotem odpowiedzi.
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
      "Wyniki wystarczaja, zeby isc dalej. Etap zostaje domkniety, a kolejny sie otwiera.",
    tone: "brand",
  },
  pivot: {
    label: "Zmien kierunek",
    description:
      "Cos sie nie potwierdzilo. Zapisujemy decyzje, etap zostaje otwarty, a Ty wybierasz, ktore podpunkty wypelnic na nowo. Poprzednie odpowiedzi zostaja w historii.",
    tone: "warning",
  },
  pause: {
    label: "Wstrzymaj",
    description:
      "Odkladasz ten startup na pozniej. Nic nie ginie, kolejny etap sie nie otwiera.",
    tone: "warning",
  },
  archive: {
    label: "Odrzuc pomysl",
    description:
      "Zamykasz ten pomysl. Startup trafia do archiwum razem z cala praca, ktora zostala wykonana.",
    tone: "danger",
  },
};

/** Etapy, ktore koncza sie decyzja. Pozostale domykamy jednym przyciskiem. */
export const STAGES_WITH_DECISION: string[] = ["idea"];
