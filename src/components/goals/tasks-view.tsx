"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ListTodo } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { MenuSelect } from "@/components/ui/menu-select";
import { createTask, updateTask } from "@/app/app/goals/actions";
import { canAssignToOthers, canChangeOwnWork, type StartupRole } from "@/types/startup";
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type GoalItem,
  type TaskStatus,
  type TeamMemberOption,
} from "@/types/goals";

const fieldClass =
  "h-10 w-full rounded-xl border border-white/10 bg-[var(--surface-2)] px-3 text-[14px] text-white outline-none focus:border-[var(--vairo)]/70";

export function TasksView({
  startupId,
  userId,
  role,
  members,
  goals,
  initialTaskId,
}: {
  startupId: string;
  userId: string;
  role: StartupRole;
  members: TeamMemberOption[];
  goals: GoalItem[];
  initialTaskId: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mine, setMine] = useState(true);
  const [title, setTitle] = useState("");
  const [goalId, setGoalId] = useState(goals.find((goal) => !goal.archivedAt)?.id ?? "");
  const [ownerId, setOwnerId] = useState(userId);

  const canAssign = canAssignToOthers(role);
  const rows = useMemo(() => {
    return goals
      .filter((goal) => !goal.archivedAt)
      .flatMap((goal) =>
        goal.tasks
          .filter((task) => (mine ? task.ownerId === userId : true))
          .map((task) => ({ ...task, goalTitle: goal.title, goalId: goal.id }))
      );
  }, [goals, mine, userId]);

  const save = (work: () => Promise<{ error: string | null }>) => {
    setError(null);
    start(async () => {
      const result = await work();
      if (result.error) setError(result.error);
      else router.refresh();
    });
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="font-heading text-[1.6rem] font-semibold text-white">Taski</h1>
      <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[var(--text-muted)]">
        Zadanie należy do jednego celu. Ma właściciela i opcjonalny termin.
        Odznaczenie zadania nie kończy celu.
      </p>

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={() => setMine(true)}
          className={
            mine
              ? "rounded-lg bg-[var(--vairo)]/12 px-3 py-1.5 text-[13px] text-[var(--vairo)]"
              : "rounded-lg px-3 py-1.5 text-[13px] text-[var(--text-subtle)]"
          }
        >
          Moje
        </button>
        <button
          type="button"
          onClick={() => setMine(false)}
          className={
            !mine
              ? "rounded-lg bg-white/8 px-3 py-1.5 text-[13px] text-white"
              : "rounded-lg px-3 py-1.5 text-[13px] text-[var(--text-subtle)]"
          }
        >
          Cały team
        </button>
      </div>

      {goals.some((goal) => !goal.archivedAt) ? (
        <form
          className="mt-4 flex flex-col gap-2 rounded-2xl border border-white/10 bg-[var(--surface)] p-4"
          onSubmit={(event) => {
            event.preventDefault();
            const next = title;
            setTitle("");
            save(() =>
              createTask({
                startupId,
                goalId,
                title: next,
                ownerId: canAssign ? ownerId : userId,
              })
            );
          }}
        >
          <input
            className={fieldClass}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Co jest do zrobienia"
            aria-label="Tytuł zadania"
          />
          <MenuSelect
            ariaLabel="Cel"
            value={goalId}
            onChange={setGoalId}
            options={goals
              .filter((goal) => !goal.archivedAt)
              .map((goal) => ({ value: goal.id, label: goal.title }))}
          />
          {canAssign ? (
            <MenuSelect
              ariaLabel="Właściciel"
              value={ownerId}
              onChange={setOwnerId}
              options={members.map((member) => ({ value: member.id, label: member.name }))}
            />
          ) : null}
          <Button type="submit" loading={pending} disabled={title.trim().length < 2} title={title.trim().length < 2 ? "Wpisz zadanie" : undefined}>
            Dodaj
          </Button>
        </form>
      ) : (
        <p className="mt-4 text-[14px] text-[var(--text-muted)]">
          Najpierw dodaj cel. Zadanie nie wisi osobno.
        </p>
      )}

      {error ? <p className="mt-3 text-[13px] text-[var(--danger)]">{error}</p> : null}

      {rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={ListTodo}
            title={mine ? "Nie masz otwartych zadań" : "Team nie ma zadań"}
            description="Zadanie to konkretny krok pod celem. Termin jest opcjonalny."
          />
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {rows.map((task) => {
            const canEdit = canChangeOwnWork(role, userId, task.ownerId);
            const highlighted = task.id === initialTaskId;
            return (
              <li
                key={task.id}
                className={
                  highlighted
                    ? "flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--vairo)]/40 bg-[var(--surface)] px-4 py-3"
                    : "flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-[var(--surface)] px-4 py-3"
                }
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium text-white">{task.title}</p>
                  <p className="text-[12.5px] text-[var(--text-subtle)]">
                    {task.goalTitle}
                    {task.dueDate ? ` · ${task.dueDate}` : ""}
                    {` · ${task.ownerName}`}
                  </p>
                </div>
                {task.needsReassign ? <Badge tone="danger">Do przypisania</Badge> : null}
                <MenuSelect
                  size="sm"
                  className="w-auto min-w-[150px]"
                  disabled={!canEdit}
                  value={task.status}
                  ariaLabel={`Status: ${task.title}`}
                  onChange={(next) =>
                    save(() =>
                      updateTask({
                        startupId,
                        taskId: task.id,
                        status: next as TaskStatus,
                      })
                    )
                  }
                  options={TASK_STATUSES.map((status) => ({
                    value: status,
                    label: TASK_STATUS_LABELS[status],
                  }))}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
