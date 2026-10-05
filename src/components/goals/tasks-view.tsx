"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
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

type BoardTask = {
  id: string;
  title: string;
  ownerId: string | null;
  ownerName: string;
  status: TaskStatus;
  dueDate: string | null;
  needsReassign: boolean;
  goalTitle: string;
  goalId: string;
};

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
  const [statusOverride, setStatusOverride] = useState<Record<string, TaskStatus>>({});
  const [over, setOver] = useState<TaskStatus | null>(null);

  const canAssign = canAssignToOthers(role);

  useEffect(() => {
    setStatusOverride({});
  }, [goals]);

  const rows = useMemo(() => {
    return goals
      .filter((goal) => !goal.archivedAt)
      .flatMap((goal) =>
        goal.tasks
          .filter((task) => (mine ? task.ownerId === userId : true))
          .map(
            (task): BoardTask => ({
              ...task,
              status: statusOverride[task.id] ?? task.status,
              goalTitle: goal.title,
              goalId: goal.id,
            })
          )
      );
  }, [goals, mine, userId, statusOverride]);

  const save = (work: () => Promise<{ error: string | null }>) => {
    setError(null);
    start(async () => {
      const result = await work();
      if (result.error) setError(result.error);
      else router.refresh();
    });
  };

  const move = (task: BoardTask, status: TaskStatus) => {
    if (task.status === status) return;
    if (!canChangeOwnWork(role, userId, task.ownerId)) {
      setError("To zadanie należy do kogoś innego.");
      return;
    }
    setStatusOverride((current) => ({ ...current, [task.id]: status }));
    setError(null);
    start(async () => {
      const result = await updateTask({ startupId, taskId: task.id, status });
      if (result.error) {
        setStatusOverride((current) => {
          const next = { ...current };
          delete next[task.id];
          return next;
        });
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <h1 className="font-heading text-[1.6rem] font-semibold text-white">Taski</h1>
      <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[var(--text-muted)]">
        Każde zadanie należy do jednego celu. Przeciągnij bloczek, żeby zmienić stan.
        Przypisanie innej osobie robi Founder albo Admin. Zrobione zadanie nie kończy celu.
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
          className="mt-4 grid gap-2 rounded-2xl border border-white/10 bg-[var(--surface)] p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto]"
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
          <Button
            type="submit"
            loading={pending}
            disabled={title.trim().length < 2}
            title={title.trim().length < 2 ? "Wpisz zadanie" : undefined}
          >
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
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {TASK_STATUSES.map((status) => {
            const cards = rows.filter((task) => task.status === status);
            const active = over === status;
            return (
              <section
                key={status}
                aria-label={TASK_STATUS_LABELS[status]}
                onDragOver={(event) => {
                  event.preventDefault();
                  setOver(status);
                }}
                onDragLeave={() => setOver((current) => (current === status ? null : current))}
                onDrop={(event) => {
                  event.preventDefault();
                  setOver(null);
                  const taskId = event.dataTransfer.getData("text/plain");
                  const task = rows.find((item) => item.id === taskId);
                  if (task) move(task, status);
                }}
                className={
                  active
                    ? "flex min-w-0 flex-col rounded-2xl border border-[var(--vairo)]/50 bg-[var(--vairo)]/8 p-3"
                    : "flex min-w-0 flex-col rounded-2xl border border-white/10 bg-[var(--surface)] p-3"
                }
              >
                <header className="mb-3 flex items-baseline justify-between gap-2">
                  <h2 className="text-[13px] font-semibold text-white">
                    {TASK_STATUS_LABELS[status]}
                  </h2>
                  <span className="text-[12px] text-[var(--text-subtle)]">{cards.length}</span>
                </header>
                {status === "blocked" ? (
                  <p className="mb-3 text-[12px] leading-relaxed text-[var(--text-subtle)]">
                    Przeszkodę opisz na karcie celu. Samo przesunięcie jej nie zapisuje.
                  </p>
                ) : null}
                <ul className="flex min-h-24 flex-col gap-2">
                  {cards.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      startupId={startupId}
                      userId={userId}
                      role={role}
                      members={members}
                      highlighted={task.id === initialTaskId}
                      onMove={(next) => move(task, next)}
                      onSave={save}
                    />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TaskCard({
  task,
  startupId,
  userId,
  role,
  members,
  highlighted,
  onMove,
  onSave,
}: {
  task: BoardTask;
  startupId: string;
  userId: string;
  role: StartupRole;
  members: TeamMemberOption[];
  highlighted: boolean;
  onMove: (status: TaskStatus) => void;
  onSave: (work: () => Promise<{ error: string | null }>) => void;
}) {
  const canEdit = canChangeOwnWork(role, userId, task.ownerId);
  const canAssign = canAssignToOthers(role);
  const index = TASK_STATUSES.indexOf(task.status);

  return (
    <li
      className={
        highlighted
          ? "rounded-xl border border-[var(--vairo)]/50 bg-[var(--surface-2)] p-3"
          : "rounded-xl border border-white/10 bg-[var(--surface-2)] p-3"
      }
    >
      <p
        draggable={canEdit}
        tabIndex={canEdit ? 0 : undefined}
        aria-label={`${task.title}. ${TASK_STATUS_LABELS[task.status]}. Strzałki w lewo i w prawo zmieniają kolumnę.`}
        onDragStart={(event) => {
          event.dataTransfer.setData("text/plain", task.id);
          event.dataTransfer.effectAllowed = "move";
        }}
        onKeyDown={(event) => {
          if (!canEdit) return;
          if (event.key === "ArrowRight" && index < TASK_STATUSES.length - 1) {
            event.preventDefault();
            onMove(TASK_STATUSES[index + 1]);
          }
          if (event.key === "ArrowLeft" && index > 0) {
            event.preventDefault();
            onMove(TASK_STATUSES[index - 1]);
          }
        }}
        className={
          canEdit
            ? "cursor-grab text-[14px] font-medium text-white outline-none focus-visible:ring-2 focus-visible:ring-[var(--vairo)] active:cursor-grabbing"
            : "text-[14px] font-medium text-white"
        }
      >
        {task.title}
      </p>
      <p className="mt-1 text-[12px] text-[var(--text-subtle)]">{task.goalTitle}</p>
      <div className="mt-2" data-no-drag onPointerDown={(event) => event.stopPropagation()}>
        {canAssign ? (
          <MenuSelect
            size="sm"
            ariaLabel={`Właściciel: ${task.title}`}
            value={task.ownerId ?? ""}
            onChange={(next) =>
              onSave(() => updateTask({ startupId, taskId: task.id, ownerId: next }))
            }
            options={members.map((member) => ({ value: member.id, label: member.name }))}
          />
        ) : (
          <p className="text-[12.5px] text-[var(--text-muted)]">{task.ownerName}</p>
        )}
      </div>
      <label className="mt-2 block text-[11.5px] text-[var(--text-subtle)]" data-no-drag>
        Termin, jeśli jest potrzebny
        <input
          type="date"
          disabled={!canEdit}
          value={task.dueDate ?? ""}
          onChange={(event) =>
            onSave(() =>
              updateTask({
                startupId,
                taskId: task.id,
                dueDate: event.target.value || null,
              })
            )
          }
          className="mt-1 h-8 w-full min-w-0 max-w-full rounded-lg border border-white/10 bg-[var(--surface)] px-2 text-[12.5px] text-white disabled:opacity-50"
        />
      </label>
      {task.needsReassign ? (
        <div className="mt-2">
          <Badge tone="danger">Do przypisania</Badge>
        </div>
      ) : null}
      {!canEdit ? (
        <p className="mt-2 text-[11.5px] text-[var(--text-subtle)]">
          To zadanie prowadzi ktoś inny.
        </p>
      ) : null}
    </li>
  );
}
