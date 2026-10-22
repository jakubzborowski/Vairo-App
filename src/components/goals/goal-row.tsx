import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { GoalItem } from "@/types/goals";
import { dueLine, formatDay, tasksLine } from "./goal-format";
import { StatusBadge, StatusIcon } from "./status";

/**
 * Lista celów: jedna karta, wiersze rozdzielone kreską. Osobna karta na każdy
 * cel dawała ścianę ramek, w której oko nie miało gdzie się zatrzymać.
 */
export function GoalList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <ul
      className={cn(
        "overflow-hidden rounded-[18px] border border-white/[0.07] bg-[var(--surface)] lift-1",
        "divide-y divide-white/[0.06]",
        className
      )}
    >
      {children}
    </ul>
  );
}

/**
 * Wiersz celu. Cały jest linkiem do szczegółu — nie ma w nim drugiej akcji,
 * więc nie ma o co się pomylić. Najwyżej dwie plakietki: status i „Do etapu".
 * Spóźnienie jest napisane słowem, nie tylko kolorem.
 */
export function GoalRow({ goal }: { goal: GoalItem }) {
  const done = goal.status === "completed";
  const countsForStage = goal.conditions.length > 0;

  return (
    <li>
      <Link
        href={`/app/goals/${goal.id}`}
        className="group flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.03] sm:items-center sm:gap-3.5 sm:px-[18px]"
      >
        <StatusIcon status={goal.status} className="mt-0.5 sm:mt-0" />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span
              className={cn(
                "text-[14.5px] font-medium leading-snug",
                done ? "text-[var(--text-muted)]" : "text-white"
              )}
            >
              {goal.title}
            </span>
            <StatusBadge status={goal.status} />
            {countsForStage ? (
              <span className="inline-flex h-[22px] items-center rounded-[7px] border border-white/12 px-2 text-[12px] font-medium text-[var(--text-muted)]">
                Do etapu
              </span>
            ) : null}
          </span>
          <span className="mt-1 flex flex-wrap gap-x-1.5 text-[12.5px] text-[var(--text-subtle)]">
            <span>{goal.ownerName}</span>
            <span aria-hidden="true">·</span>
            <span className={cn(goal.overdue && "font-medium text-[var(--warning)]")}>
              {goal.overdue ? `Po terminie od ${formatDay(goal.dueDate)}` : dueLine(goal)}
            </span>
            <span aria-hidden="true">·</span>
            <span>{tasksLine(goal)}</span>
            {/* Wytyczne 4.4: na pozycji widać sygnał brakującego dowodu
                i Milestone, do którego cel się liczy. */}
            {done ? null : (
              <>
                <span aria-hidden="true">·</span>
                <span className={cn(goal.status === "awaiting_proof" && "text-[var(--warning)]")}>
                  bez dowodu
                </span>
              </>
            )}
            {goal.conditions[0] ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="truncate">do: {goal.conditions[0].subpointTitle}</span>
              </>
            ) : null}
          </span>
        </span>
        <ChevronRight
          className="mt-0.5 size-4 shrink-0 text-[var(--text-subtle)] transition-transform group-hover:translate-x-0.5 sm:mt-0"
          aria-hidden="true"
        />
      </Link>
    </li>
  );
}

/** Szkielet listy w kształcie prawdziwych wierszy — nic nie skacze po wczytaniu. */
export function GoalListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-[18px] border border-white/[0.07] bg-[var(--surface)]">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3.5 border-t border-white/[0.06] px-[18px] py-4 first:border-t-0"
        >
          <Skeleton className="size-[18px] rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-3.5" style={{ width: `${[72, 54, 64, 48][index % 4]}%` }} />
            <Skeleton className="mt-2 h-3 w-40" />
          </div>
        </div>
      ))}
    </div>
  );
}
