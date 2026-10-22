"use client";

import { Flag, Lock, OctagonAlert } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/types/goals";
import { formatDay } from "./goal-format";
import { StatusIcon } from "./status";

export type BoardTask = {
  id: string;
  title: string;
  ownerId: string | null;
  ownerName: string;
  status: TaskStatus;
  dueDate: string | null;
  needsReassign: boolean;
  createdBy: string | null;
  createdAt: string;
  note?: string | null;
  blockerNote?: string | null;
  completedAt?: string | null;
  goalTitle: string;
  goalId: string;
};

export function isTaskOverdue(task: BoardTask, today: string) {
  return task.status !== "done" && Boolean(task.dueDate) && (task.dueDate as string) < today;
}

/**
 * Karta zadania na tablicy. Trzy rzeczy: cel (mały, nad tytułem), tytuł,
 * a na dole termin i osoba. Wybór osoby i pole daty, które dawniej stały na
 * każdej karcie, przeszły do menu ⋮ i panelu zadania — karta się czyta,
 * nie wypełnia.
 *
 * Zrobione zadanie jest ciche: bez celu, bez terminu, przekreślone.
 */
export function TaskCard({
  task,
  today,
  canEdit,
  highlighted,
  menu,
  onOpen,
  onKeyMove,
  dragging,
  onDragStart,
  onDragEnd,
}: {
  task: BoardTask;
  today: string;
  canEdit: boolean;
  highlighted?: boolean;
  /** Menu ⋮ — pokazuje się po najechaniu i przy fokusie. */
  menu?: React.ReactNode;
  onOpen: () => void;
  onKeyMove?: (direction: -1 | 1) => void;
  dragging?: boolean;
  onDragStart?: (event: React.DragEvent) => void;
  onDragEnd?: () => void;
}) {
  const done = task.status === "done";
  const overdue = isTaskOverdue(task, today);

  return (
    <li
      draggable={canEdit}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "group relative rounded-2xl border transition-[background-color,border-color,box-shadow,opacity]",
        done
          ? "border-transparent bg-white/[0.025]"
          : "border-transparent bg-[var(--surface)] lift-1 hover:border-white/14 hover:bg-[var(--surface-2)]",
        task.status === "blocked" && "border-[var(--danger)]/30 hover:border-[var(--danger)]/45",
        highlighted && "ring-1 ring-[var(--vairo)]/60",
        dragging && "opacity-50",
        canEdit && "cursor-grab active:cursor-grabbing"
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        onKeyDown={(event) => {
          if (!onKeyMove) return;
          if (event.key === "ArrowRight") {
            event.preventDefault();
            onKeyMove(1);
          }
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            onKeyMove(-1);
          }
        }}
        aria-label={`${task.title}. Otwórz zadanie.${canEdit ? " Strzałki w lewo i w prawo zmieniają kolumnę." : ""}`}
        className={cn(
          "block w-full rounded-2xl text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--vairo)]",
          done ? "px-3 py-2.5" : "p-3.5"
        )}
      >
        {done ? (
          <span className="flex items-center gap-2 pr-6">
            <StatusIcon status="done" task className="size-3.5" />
            <span className="min-w-0 flex-1 text-[13.5px] text-[var(--text-subtle)] line-through decoration-white/25">
              {task.title}
            </span>
          </span>
        ) : (
          <>
            <span className="flex items-center gap-1.5 pr-7 text-[12px] text-[var(--text-subtle)]">
              <Flag className="size-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{task.goalTitle}</span>
            </span>
            <span className="mt-1.5 block text-[14.5px] font-medium leading-snug text-white">
              {task.title}
            </span>
            {task.status === "blocked" && task.blockerNote ? (
              <span className="mt-1.5 flex items-start gap-1.5 text-[12.5px] leading-snug text-[var(--text-muted)]">
                <OctagonAlert className="mt-0.5 size-3.5 shrink-0 text-[var(--danger)]" aria-hidden="true" />
                {task.blockerNote}
              </span>
            ) : null}
            {task.needsReassign ? (
              <span className="mt-1.5 block text-[12.5px] text-[var(--danger-text)]">
                Osoba odeszła z teamu — zadanie czeka na przypisanie.
              </span>
            ) : null}
            <span className="mt-3 flex items-center gap-2">
              <span
                className={cn(
                  "text-[12.5px]",
                  overdue
                    ? "font-medium text-[var(--warning)]"
                    : task.dueDate
                      ? "text-[var(--text-muted)]"
                      : "text-[var(--text-subtle)]"
                )}
              >
                {task.dueDate
                  ? overdue
                    ? `minął ${formatDay(task.dueDate)}`
                    : `do ${formatDay(task.dueDate)}`
                  : "Bez terminu"}
              </span>
              <span className="ml-auto inline-flex items-center gap-1.5">
                {!canEdit ? (
                  <Lock
                    className="size-3 text-[var(--text-subtle)]"
                    aria-label={`Zmienia je ${task.ownerName}, Founder albo Admin`}
                  />
                ) : null}
                <Avatar name={task.ownerName} size="xs" />
              </span>
            </span>
          </>
        )}
      </button>
      {menu ? (
        <div className="absolute right-2 top-2 opacity-100 transition-opacity sm:opacity-0 sm:focus-within:opacity-100 sm:group-hover:opacity-100">
          {menu}
        </div>
      ) : null}
    </li>
  );
}
