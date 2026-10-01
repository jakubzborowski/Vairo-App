/**
 * Goals są celami użytkownika. Milestones (etapy) zostają treścią Vairo.
 * Cel wlicza się do warunku dopiero po jawnym powiązaniu, właściwym typie,
 * statusie Ukończony i snapshotcie proof.
 */

export const GOAL_STATUSES = [
  "todo",
  "in_progress",
  "blocked",
  "awaiting_proof",
  "completed",
] as const;

export type GoalStatus = (typeof GOAL_STATUSES)[number];

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  todo: "Do zrobienia",
  in_progress: "W trakcie",
  blocked: "Zablokowany",
  awaiting_proof: "Czeka na proof",
  completed: "Ukończony",
};

export const TASK_STATUSES = ["todo", "in_progress", "blocked", "done"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "Do zrobienia",
  in_progress: "W trakcie",
  blocked: "Zablokowany",
  done: "Zrobione",
};

export const PROOF_KINDS = [
  "sentence",
  "long_text",
  "select",
  "scale",
  "link",
  "file",
  "module_result",
  "goal_set",
] as const;

export type ProofKind = (typeof PROOF_KINDS)[number];

export const PROOF_KIND_LABELS: Record<ProofKind, string> = {
  sentence: "Jedno zdanie",
  long_text: "Dłuższy tekst",
  select: "Wybór z listy",
  scale: "Skala",
  link: "Link",
  file: "Plik",
  module_result: "Rozpiska",
  goal_set: "Zestaw ukończonych celów",
};

export type ProofOption = { value: string; label: string };

export type ProofRequirement = {
  kind: ProofKind;
  label: string;
  options?: ProofOption[];
  min?: number;
  max?: number;
  min_count?: number;
  module?: string;
};

export type ProofFile = {
  id?: string | null;
  path: string;
  name: string;
  size?: number;
};

/** Niezmienna wersja dowodu. Późniejsza edycja materiału jej nie podmienia. */
export type ProofSnapshot = {
  kind: ProofKind;
  captured_at?: string;
  captured_by?: string;
  text?: string;
  option?: string;
  scale?: number;
  url?: string;
  note?: string;
  file?: ProofFile;
  module?: string;
  workflow_id?: string;
  version?: number;
  ref_id?: string;
  title?: string;
  nodes?: unknown;
  edges?: unknown;
  goal_ids?: string[];
};

export type ProofDraft =
  | { kind: "sentence" | "long_text"; text: string }
  | { kind: "select"; option: string }
  | { kind: "scale"; scale: number }
  | { kind: "link"; url: string; note: string }
  | { kind: "file"; fileId?: string; path?: string; name?: string; size?: number }
  | { kind: "module_result"; workflowId: string }
  | { kind: "goal_set"; goalIds: string[] };

export type GoalTypeOption = {
  id: string;
  label: string;
  description: string | null;
};

export type TeamMemberOption = {
  id: string;
  name: string;
  role: "founder" | "admin" | "member";
};

export type GoalTask = {
  id: string;
  title: string;
  ownerId: string | null;
  ownerName: string;
  status: TaskStatus;
  dueDate: string | null;
  needsReassign: boolean;
};

export type GoalMaterial = {
  id: string;
  kind: "file" | "link" | "note";
  fileName: string | null;
  filePath: string | null;
  url: string | null;
  body: string | null;
};

export type GoalConditionRef = {
  id: string;
  label: string;
  subpointTitle: string;
  minCount: number;
  done: number;
  /** Czy ten konkretny cel wlicza się do licznika. */
  counts: boolean;
};

export type GoalEvent = {
  id: string;
  kind: string;
  createdAt: string;
  actorName: string | null;
  payload: Record<string, unknown>;
};

export type GoalItem = {
  id: string;
  title: string;
  description: string | null;
  goalTypeId: string;
  goalTypeLabel: string;
  ownerId: string | null;
  ownerName: string;
  dueDate: string;
  status: GoalStatus;
  proofRequirement: ProofRequirement;
  proofSnapshot: ProofSnapshot | null;
  note: string | null;
  blockerNote: string | null;
  needsReassign: boolean;
  archivedAt: string | null;
  completedAt: string | null;
  createdBy: string | null;
  tasks: GoalTask[];
  materials: GoalMaterial[];
  conditions: GoalConditionRef[];
  events: GoalEvent[];
  overdue: boolean;
};

export type MilestoneCondition = {
  id: string;
  subpointId: string;
  subpointTitle: string;
  goalTypeId: string;
  goalTypeLabel: string;
  minCount: number;
  done: number;
  proofKind: ProofKind | null;
};

export type SubpointGoalCondition = {
  id: string;
  goalTypeId: string;
  label: string;
  minCount: number;
  done: number;
  proofKind: string | null;
};

export type LibraryPick = {
  id: string;
  name: string;
  path: string;
  size: number;
};

export type WorkflowPick = {
  id: string;
  title: string;
  version: number;
};
