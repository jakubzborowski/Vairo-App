import { LOCALE_TAGS, type Locale } from "@/i18n/config";
import type { MessageKey } from "@/i18n/messages";
import type { Translate } from "@/i18n/translator";
import { plural } from "@/lib/utils";
import type { GoalItem, ProofKind } from "@/types/goals";

/**
 * Słowa, którymi cele mówią o sobie. Jedno miejsce, bo te same zdania stoją
 * na liście, w szczególe i w kreatorze — a dwa różne brzmienia tej samej
 * rzeczy czyta się jak dwie różne rzeczy.
 *
 * Teksty są w słowniku `goals` (`format.*`), daty w języku użytkownika.
 * Komponent kliencki bierze gotowy zestaw z `useGoalFormat()`
 * (goal-format-hook.ts), serwerowy — z `makeGoalFormat(await getT("goals"),
 * await getLocale())`.
 */

type GoalsT = Translate<MessageKey<"goals">>;

function parseDay(iso: string) {
  const date = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Same daty — bez słownika, do miejsc spoza celów (Pliki, Dokumenty, Rozpiska). */
export function makeDateFormat(locale: Locale) {
  const tag = LOCALE_TAGS[locale];
  const DAY = new Intl.DateTimeFormat(tag, { day: "numeric", month: "short" });
  const DAY_LONG = new Intl.DateTimeFormat(tag, { day: "numeric", month: "long" });
  const DAY_TIME = new Intl.DateTimeFormat(tag, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const run = (format: Intl.DateTimeFormat) => (iso: string | null | undefined) => {
    if (!iso) return "";
    const date = parseDay(iso);
    return date ? format.format(date) : iso;
  };
  return {
    /** „15 paź" */
    formatDay: run(DAY),
    /** „15 października" */
    formatDayLong: run(DAY_LONG),
    /** „12 paź, 14:32" */
    formatMoment: run(DAY_TIME),
  };
}

export type DateFormat = ReturnType<typeof makeDateFormat>;

/** Polska odmiana — ta sama co w całej aplikacji (dla miejsc jeszcze bez słownika). */
export { plural };

export function allTasksDone(goal: GoalItem) {
  return goal.tasks.length > 0 && goal.tasks.every((task) => task.status === "done");
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

export function makeGoalFormat(t: GoalsT, locale: Locale) {
  const dates = makeDateFormat(locale);
  const { formatDay } = dates;

  function tasksLine(goal: GoalItem) {
    if (goal.tasks.length === 0) return t("format.noTasks");
    const done = goal.tasks.filter((task) => task.status === "done").length;
    return t("format.tasksDone", { done, count: goal.tasks.length });
  }

  function dueLine(goal: GoalItem) {
    if (goal.status === "completed") {
      return goal.completedAt
        ? t("format.completedOn", { date: formatDay(goal.completedAt) })
        : t("format.completed");
    }
    return goal.overdue
      ? t("format.overdueSince", { date: formatDay(goal.dueDate) })
      : t("format.dueBy", { date: formatDay(goal.dueDate) });
  }

  /**
   * Jedno zdanie o tym, czego cel teraz potrzebuje — zamiast trzech plakietek
   * („Do zrobienia" + „Po terminie" + „Brak dowodu"), które trzeba było samemu
   * złożyć w myśl.
   */
  function goalHint(goal: GoalItem): { text: string; tone: "warning" | "danger" | "muted" | "success" } {
    if (goal.status === "completed") {
      return { text: t("format.hintCompleted", { date: formatDay(goal.completedAt) }), tone: "success" };
    }
    if (goal.needsReassign) {
      return { text: t("format.hintReassign"), tone: "danger" };
    }
    if (goal.status === "blocked") {
      return {
        text: goal.blockerNote
          ? t("format.hintBlockedNote", { note: goal.blockerNote })
          : t("format.hintBlocked"),
        tone: "muted",
      };
    }
    if (goal.overdue) {
      return { text: t("format.hintOverdue", { date: formatDay(goal.dueDate) }), tone: "warning" };
    }
    if (goal.status === "awaiting_proof" || allTasksDone(goal)) {
      return { text: t("format.hintProofOnly"), tone: "warning" };
    }
    if (goal.status === "in_progress") {
      return { text: t("format.hintInProgress", { date: formatDay(goal.dueDate) }), tone: "muted" };
    }
    return { text: t("format.hintTodo", { date: formatDay(goal.dueDate) }), tone: "muted" };
  }

  /** Krótki stan do listy „Co robi zespół". */
  function teamState(goal: GoalItem): { text: string; warning: boolean } {
    if (goal.status === "blocked") return { text: t("format.stateBlocked"), warning: false };
    if (goal.overdue) return { text: t("format.stateOverdue"), warning: true };
    if (goal.status === "awaiting_proof" || allTasksDone(goal)) {
      return { text: t("format.stateProofOnly"), warning: true };
    }
    if (goal.tasks.length > 0) return { text: tasksLine(goal), warning: false };
    return { text: t(`goalStatus.${goal.status}`).toLowerCase(), warning: false };
  }

  /** „dłuższy tekst", „link" — forma dowodu w zdaniu. */
  function proofKindWord(kind: ProofKind) {
    return t(`proofKind.${kind}`).toLowerCase();
  }

  return { ...dates, tasksLine, dueLine, goalHint, teamState, proofKindWord };
}

export type GoalFormat = ReturnType<typeof makeGoalFormat>;
