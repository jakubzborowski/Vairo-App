import {
  ChevronDown,
  CircleCheck,
  CircleDashed,
  CircleDot,
  Hourglass,
  OctagonAlert,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  GOAL_STATUS_LABELS,
  TASK_STATUS_LABELS,
  type GoalStatus,
  type TaskStatus,
} from "@/types/goals";

/**
 * Jeden język statusów dla celów i zadań.
 *
 * Status ma zawsze dwie warstwy: kolor i słowo (albo ikonę o innym kształcie).
 * Sam kolor nie wystarcza — „po terminie" i „zablokowany" różnią się na
 * ekranie tylko odcieniem, a tego część ludzi w ogóle nie rozróżni.
 */
type Look = { text: string; bg: string; icon: LucideIcon; iconColor: string };

const LOOKS: Record<GoalStatus, Look> = {
  todo: {
    text: "text-[var(--text-muted)]",
    bg: "bg-white/8",
    icon: CircleDashed,
    iconColor: "text-[var(--text-subtle)]",
  },
  in_progress: {
    text: "text-[var(--info-text)]",
    bg: "bg-[var(--info)]/15",
    icon: CircleDot,
    iconColor: "text-[var(--info)]",
  },
  blocked: {
    text: "text-[var(--danger-text)]",
    bg: "bg-[var(--danger)]/15",
    icon: OctagonAlert,
    iconColor: "text-[var(--danger)]",
  },
  awaiting_proof: {
    text: "text-[var(--warning)]",
    bg: "bg-[var(--warning)]/15",
    icon: Hourglass,
    iconColor: "text-[var(--warning)]",
  },
  completed: {
    text: "text-[var(--success)]",
    bg: "bg-[var(--success)]/15",
    icon: CircleCheck,
    iconColor: "text-[var(--success)]",
  },
};

/** Zadanie ma te same stany co cel, z wyjątkiem dowodu. */
const TASK_LOOK: Record<TaskStatus, GoalStatus> = {
  todo: "todo",
  in_progress: "in_progress",
  blocked: "blocked",
  done: "completed",
};

export function goalLook(status: GoalStatus) {
  return LOOKS[status];
}

export function taskLook(status: TaskStatus) {
  return LOOKS[TASK_LOOK[status]];
}

const badgeBase =
  "inline-flex h-[22px] shrink-0 items-center gap-1 whitespace-nowrap rounded-[7px] px-2 text-[12px] font-medium";

/** Plakietka statusu. Nigdy nie jest przyciskiem — od tego jest `StatusTrigger`. */
export function StatusBadge({
  status,
  task,
  className,
}: {
  status: GoalStatus | TaskStatus;
  /** Zadanie ma inne słowa („Zrobione", „Zablokowane"). */
  task?: boolean;
  className?: string;
}) {
  const look = task ? taskLook(status as TaskStatus) : goalLook(status as GoalStatus);
  const label = task
    ? TASK_STATUS_LABELS[status as TaskStatus]
    : GOAL_STATUS_LABELS[status as GoalStatus];
  return <span className={cn(badgeBase, look.text, look.bg, className)}>{label}</span>;
}

/**
 * Zawartość klikalnej plakietki — do wyzwalacza menu. Strzałka mówi, że to
 * da się zmienić; bez niej plakietka wygląda jak zwykła etykieta.
 */
export function StatusTriggerContent({
  status,
  task,
}: {
  status: GoalStatus | TaskStatus;
  task?: boolean;
}) {
  const look = task ? taskLook(status as TaskStatus) : goalLook(status as GoalStatus);
  const label = task
    ? TASK_STATUS_LABELS[status as TaskStatus]
    : GOAL_STATUS_LABELS[status as GoalStatus];
  return (
    <span
      className={cn(
        "inline-flex h-[26px] items-center gap-1 whitespace-nowrap rounded-[7px] pl-2 pr-1.5 text-[12px] font-medium",
        look.text,
        look.bg
      )}
    >
      {label}
      <ChevronDown className="size-3.5 opacity-80" aria-hidden="true" />
    </span>
  );
}

export function StatusIcon({
  status,
  task,
  className,
}: {
  status: GoalStatus | TaskStatus;
  task?: boolean;
  className?: string;
}) {
  const look = task ? taskLook(status as TaskStatus) : goalLook(status as GoalStatus);
  const Icon = look.icon;
  return (
    <Icon
      className={cn("size-[18px] shrink-0", look.iconColor, className)}
      strokeWidth={2}
      aria-hidden="true"
    />
  );
}

/** Kafelek z ikoną statusu — lewa kolumna wiersza na liście „Teraz". */
export function StatusChip({ status, overdue }: { status: GoalStatus; overdue?: boolean }) {
  // Spóźnienie jest ważniejsze niż „do zrobienia" — klepsydra w kolorze
  // ostrzeżenia mówi o nim, zanim ktoś przeczyta zdanie obok.
  const look = goalLook(overdue && status !== "blocked" ? "awaiting_proof" : status);
  const Icon = look.icon;
  return (
    <span
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-[14px]",
        look.bg
      )}
      aria-hidden="true"
    >
      <Icon className={cn("size-[18px]", look.iconColor)} strokeWidth={2} />
    </span>
  );
}
