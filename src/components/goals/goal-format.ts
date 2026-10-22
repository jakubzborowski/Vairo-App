import { plural } from "@/lib/utils";
import {
  GOAL_STATUS_LABELS,
  PROOF_KIND_LABELS,
  type GoalItem,
  type ProofKind,
} from "@/types/goals";

/**
 * Słowa, którymi cele mówią o sobie. Jedno miejsce, bo te same zdania stoją
 * na liście, w szczególe i w kreatorze — a dwa różne brzmienia tej samej
 * rzeczy czyta się jak dwie różne rzeczy.
 */

const DAY = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short" });
const DAY_LONG = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long" });
const DAY_TIME = new Intl.DateTimeFormat("pl-PL", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function parseDay(iso: string) {
  const date = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** „15 paź" */
export function formatDay(iso: string | null | undefined) {
  if (!iso) return "";
  const date = parseDay(iso);
  return date ? DAY.format(date) : iso;
}

/** „15 października" */
export function formatDayLong(iso: string | null | undefined) {
  if (!iso) return "";
  const date = parseDay(iso);
  return date ? DAY_LONG.format(date) : iso;
}

/** „12 paź, 14:32" */
export function formatMoment(iso: string | null | undefined) {
  if (!iso) return "";
  const date = parseDay(iso);
  return date ? DAY_TIME.format(date) : iso;
}

/** Polska odmiana — ta sama co w całej aplikacji. */
export { plural };

export function tasksLine(goal: GoalItem) {
  if (goal.tasks.length === 0) return "bez zadań";
  const done = goal.tasks.filter((task) => task.status === "done").length;
  return `${done} z ${goal.tasks.length} ${plural(goal.tasks.length, "zadania", "zadań", "zadań")}`;
}

export function allTasksDone(goal: GoalItem) {
  return goal.tasks.length > 0 && goal.tasks.every((task) => task.status === "done");
}

export function dueLine(goal: GoalItem) {
  if (goal.status === "completed") {
    return goal.completedAt ? `ukończony ${formatDay(goal.completedAt)}` : "ukończony";
  }
  return goal.overdue ? `po terminie od ${formatDay(goal.dueDate)}` : `do ${formatDay(goal.dueDate)}`;
}

/**
 * Jedno zdanie o tym, czego cel teraz potrzebuje — zamiast trzech plakietek
 * („Do zrobienia" + „Po terminie" + „Brak dowodu"), które trzeba było samemu
 * złożyć w myśl.
 */
export function goalHint(goal: GoalItem): { text: string; tone: "warning" | "danger" | "muted" | "success" } {
  if (goal.status === "completed") {
    return { text: `Ukończony z dowodem ${formatDay(goal.completedAt)}.`, tone: "success" };
  }
  if (goal.needsReassign) {
    return { text: "Poprzednia osoba odeszła z teamu — wskaż nowego właściciela.", tone: "danger" };
  }
  if (goal.status === "blocked") {
    return {
      text: goal.blockerNote
        ? `Zablokowany — ${goal.blockerNote}`
        : "Zablokowany. Opisz, co stoi na przeszkodzie.",
      tone: "muted",
    };
  }
  if (goal.overdue) {
    return {
      text: `Termin minął ${formatDay(goal.dueDate)}. Dowód dodany teraz nadal się liczy.`,
      tone: "warning",
    };
  }
  if (goal.status === "awaiting_proof" || allTasksDone(goal)) {
    return { text: "Brakuje tylko dowodu — zadania są zrobione.", tone: "warning" };
  }
  if (goal.status === "in_progress") {
    return { text: `W trakcie, termin ${formatDay(goal.dueDate)}.`, tone: "muted" };
  }
  return { text: `Do zrobienia, termin ${formatDay(goal.dueDate)}.`, tone: "muted" };
}

/** Krótki stan do listy „Co robi zespół". */
export function teamState(goal: GoalItem): { text: string; warning: boolean } {
  if (goal.status === "blocked") return { text: "zablokowany", warning: false };
  if (goal.overdue) return { text: "po terminie", warning: true };
  if (goal.status === "awaiting_proof" || allTasksDone(goal)) {
    return { text: "brakuje tylko dowodu", warning: true };
  }
  if (goal.tasks.length > 0) return { text: tasksLine(goal), warning: false };
  return { text: GOAL_STATUS_LABELS[goal.status].toLowerCase(), warning: false };
}

/** „dłuższy tekst", „link" — forma dowodu w zdaniu. */
export function proofKindWord(kind: ProofKind) {
  return PROOF_KIND_LABELS[kind].toLowerCase();
}

/** Kolejność „co najpierw": im pilniejsze, tym wyżej. */
export function urgency(goal: GoalItem) {
  if (goal.needsReassign) return 0;
  if (goal.overdue) return 1;
  if (goal.status === "blocked") return 2;
  if (goal.status === "awaiting_proof" || allTasksDone(goal)) return 3;
  if (goal.status === "in_progress") return 4;
  return 5;
}
