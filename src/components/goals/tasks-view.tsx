"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flag, Lock, Plus, Search, Trash2 } from "lucide-react";
import { createTask, deleteTask, loadTaskEvents, updateTask } from "@/app/app/goals/actions";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { EmptyNote } from "@/components/ui/empty-state";
import { Input, Textarea } from "@/components/ui/input";
import { Menu, MenuItem, MenuSeparator } from "@/components/ui/menu";
import { MenuSelect } from "@/components/ui/menu-select";
import { Modal } from "@/components/ui/modal";
import { ModuleHeader } from "@/components/ui/module-header";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { canAssignToOthers, canChangeOwnWork, type StartupRole } from "@/types/startup";
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type GoalItem,
  type TaskEvent,
  type TaskStatus,
  type TeamMemberOption,
} from "@/types/goals";
import { formatDay, formatMoment, plural } from "./goal-format";
import { StatusIcon } from "./status";
import { TaskCard, isTaskOverdue, type BoardTask } from "./task-card";

type Result = { error: string | null; id?: string };

function todayIso() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

/**
 * Taski — tablica bez szumu.
 *
 * Cztery spokojne kolumny tego samego koloru; status mówi kółko przy nazwie.
 * Na górze nie ma akcji głównej ani akapitu instrukcji: tablica jest
 * narzędziem, nie miejscem do prowadzenia za rękę. To, co pilne, mówi jedno
 * zdanie pod nagłówkiem. Wyjaśnienie trzech zasad stoi w pustym stanie,
 * a „zrobione zadanie nie kończy celu" — w kolumnie Zrobione, czyli tam,
 * gdzie ta wątpliwość się pojawia.
 *
 * Kliknięcie karty otwiera panel zadania z prawej (`?task=`). Na telefonie
 * widać jedną kolumnę naraz — bez przewijania w bok.
 */
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
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [mine, setMine] = useState(true);
  const [goalFilter, setGoalFilter] = useState("all");
  const [query, setQuery] = useState("");
  // Każde kliknięcie „Nowe zadanie" otwiera wiersz dodawania od nowa.
  const [addSignal, setAddSignal] = useState(0);
  const [openId, setOpenId] = useState<string | null>(initialTaskId);
  const [mobileColumn, setMobileColumn] = useState<TaskStatus>("todo");
  const [statusOverride, setStatusOverride] = useState<Record<string, TaskStatus>>({});
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<TaskStatus | null>(null);
  const [deleting, setDeleting] = useState<BoardTask | null>(null);
  const today = todayIso();
  const canAssign = canAssignToOthers(role);

  // Optymistyczne statusy (przeciąganie) obowiązują, dopóki serwer nie odeśle
  // świeżych `goals`. Korekta w trakcie renderu, nie w efekcie — efekt
  // pokazałby klatkę ze starym nadpisaniem na nowych danych.
  const [seenGoals, setSeenGoals] = useState(goals);
  if (seenGoals !== goals) {
    setSeenGoals(goals);
    setStatusOverride({});
  }

  const openGoals = useMemo(
    () => goals.filter((goal) => !goal.archivedAt && goal.status !== "completed"),
    [goals]
  );
  const liveGoals = useMemo(() => goals.filter((goal) => !goal.archivedAt), [goals]);

  const all = useMemo<BoardTask[]>(
    () =>
      liveGoals.flatMap((goal) =>
        goal.tasks.map((task) => ({
          ...task,
          status: statusOverride[task.id] ?? task.status,
          goalTitle: goal.title,
          goalId: goal.id,
        }))
      ),
    [liveGoals, statusOverride]
  );

  const needle = query.trim().toLowerCase();
  const rows = all.filter(
    (task) =>
      (!mine || task.ownerId === userId) &&
      (goalFilter === "all" || task.goalId === goalFilter) &&
      (!needle || task.title.toLowerCase().includes(needle) || task.goalTitle.toLowerCase().includes(needle))
  );
  const openTask = all.find((task) => task.id === openId) ?? null;

  const canEditTask = (task: BoardTask) => canChangeOwnWork(role, userId, task.ownerId);
  const canDeleteTask = (task: BoardTask) =>
    canAssign || task.ownerId === userId || task.createdBy === userId;

  const setOpen = (id: string | null) => {
    setOpenId(id);
    window.history.replaceState(null, "", id ? `/app/tasks?task=${id}` : "/app/tasks");
  };

  const run = (work: () => Promise<Result>, success: string, after?: () => void) => {
    start(async () => {
      const result = await work();
      if (result.error) {
        toast({ tone: "error", title: "Nie udało się zapisać", description: result.error });
        return;
      }
      toast({ title: success });
      after?.();
    });
  };

  const move = (task: BoardTask, status: TaskStatus) => {
    if (task.status === status) return;
    if (!canEditTask(task)) {
      toast({
        tone: "error",
        title: "To zadanie prowadzi ktoś inny",
        description: `Zmienia je ${task.ownerName}, Founder albo Admin.`,
      });
      return;
    }
    setStatusOverride((current) => ({ ...current, [task.id]: status }));
    start(async () => {
      const result = await updateTask({ startupId, taskId: task.id, status });
      if (result.error) {
        // Nieudana zmiana cofa kartę tam, skąd przyszła — i mówi dlaczego.
        setStatusOverride((current) => {
          const next = { ...current };
          delete next[task.id];
          return next;
        });
        toast({ tone: "error", title: "Nie udało się przenieść zadania", description: result.error });
        return;
      }
      toast({ title: `${task.title}: ${TASK_STATUS_LABELS[status].toLowerCase()}` });
      // Zablokowane zadanie potrzebuje powodu — otwieramy panel z polem.
      if (status === "blocked" && task.note !== undefined) setOpen(task.id);
    });
  };

  if (liveGoals.length === 0) {
    return (
      <div className="page-wide">
        <ModuleHeader title="Taski" subtitle="Jeszcze nic do zrobienia." />
        <NoGoals />
      </div>
    );
  }

  const openCount = rows.filter((task) => task.status !== "done").length;
  const overdueCount = rows.filter((task) => isTaskOverdue(task, today)).length;
  const goalsWithTasks = new Set(rows.map((task) => task.goalId)).size;
  const subtitle = mine
    ? openCount === 0
      ? "Nie masz otwartych zadań."
      : `Masz ${openCount} ${plural(openCount, "otwarte zadanie", "otwarte zadania", "otwartych zadań")}.${
          overdueCount > 0
            ? ` ${overdueCount === 1 ? "Jedno jest" : `${overdueCount} są`} po terminie.`
            : ""
        }`
    : `Cały team · ${rows.length} ${plural(rows.length, "zadanie", "zadania", "zadań")} w ${goalsWithTasks} ${plural(goalsWithTasks, "celu", "celach", "celach")}.`;

  // „Zrobione w tym tygodniu" — tylko gdy baza zna datę ukończenia (029).
  const weekStart = (() => {
    const now = new Date();
    const day = (now.getDay() + 6) % 7;
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - day).toISOString();
  })();
  const doneThisWeek = rows.some((task) => task.completedAt !== undefined)
    ? rows.filter((task) => task.completedAt && task.completedAt >= weekStart).length
    : null;

  const menuFor = (task: BoardTask) => {
    const editable = canEditTask(task);
    return (
      <Menu label={`Akcje zadania: ${task.title}`}>
        {(close) => (
          <>
            {TASK_STATUSES.map((status) => (
              <MenuItem
                key={status}
                disabled={!editable || status === task.status}
                onClick={() => {
                  close();
                  move(task, status);
                }}
              >
                <span className="inline-flex items-center gap-2">
                  <StatusIcon status={status} task className="size-4" />
                  {TASK_STATUS_LABELS[status]}
                  {status === task.status ? (
                    <span className="text-[12px] text-[var(--text-subtle)]">· teraz</span>
                  ) : null}
                </span>
              </MenuItem>
            ))}
            <MenuSeparator />
            <MenuItem
              onClick={() => {
                close();
                setOpen(task.id);
              }}
              disabled={!editable}
              hint={editable ? undefined : `Zmienia je ${task.ownerName}, Founder albo Admin.`}
            >
              Zmień termin {task.dueDate ? `(${formatDay(task.dueDate)})` : ""}
            </MenuItem>
            <MenuItem
              onClick={() => {
                close();
                setOpen(task.id);
              }}
              disabled={!canAssign}
              hint={canAssign ? undefined : "Przypisać pracę innej osobie może Founder albo Admin."}
            >
              Przypisz komuś
            </MenuItem>
            <MenuItem
              onClick={() => {
                close();
                router.push(`/app/goals/${task.goalId}`);
              }}
            >
              Otwórz cel „{task.goalTitle.length > 28 ? `${task.goalTitle.slice(0, 28)}…` : task.goalTitle}”
            </MenuItem>
            {canDeleteTask(task) ? (
              <>
                <MenuSeparator />
                <MenuItem
                  icon={Trash2}
                  tone="danger"
                  onClick={() => {
                    close();
                    setDeleting(task);
                  }}
                >
                  Usuń zadanie
                </MenuItem>
              </>
            ) : null}
          </>
        )}
      </Menu>
    );
  };

  return (
    <div className="page-wide">
      <ModuleHeader
        title="Taski"
        subtitle={`${subtitle}${doneThisWeek ? ` W tym tygodniu zrobione: ${doneThisWeek}.` : ""}`}
        action={
          openGoals.length > 0 ? (
            <Button
              variant="secondary"
              onClick={() => {
                setMobileColumn("todo");
                setAddSignal((value) => value + 1);
              }}
            >
              <Plus className="size-4" />
              Nowe zadanie
            </Button>
          ) : null
        }
      />

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div
          role="tablist"
          aria-label="Czyje zadania"
          className="inline-flex rounded-xl border border-white/[0.08] bg-[var(--surface)] p-1"
        >
          {[
            [true, "Moje"],
            [false, "Cały team"],
          ].map(([value, label]) => (
            <button
              key={String(label)}
              type="button"
              role="tab"
              aria-selected={mine === value}
              onClick={() => setMine(value as boolean)}
              className={cn(
                "inline-flex h-11 items-center rounded-lg px-3.5 text-[13px] font-medium transition-colors sm:h-8",
                mine === value ? "bg-[var(--surface-3)] text-white" : "text-[var(--text-muted)] hover:text-white"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <MenuSelect
          size="sm"
          className="w-auto min-w-[170px] max-w-[260px]"
          ariaLabel="Cel"
          value={goalFilter}
          onChange={setGoalFilter}
          options={[
            { value: "all", label: "Każdy cel" },
            ...liveGoals.map((goal) => ({ value: goal.id, label: goal.title })),
          ]}
        />
        <label className="flex h-11 min-w-[180px] flex-1 items-center gap-2 rounded-xl border border-white/10 bg-[var(--surface)] px-3 text-[13px] text-[var(--text-muted)] focus-within:border-[var(--vairo)]/45 sm:h-9 sm:max-w-[260px] sm:flex-none">
          <Search className="size-3.5 shrink-0" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Szukaj zadania"
            aria-label="Szukaj zadania"
            className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-[var(--text-subtle)]"
          />
        </label>
      </div>

      {/* Telefon: jedna kolumna naraz. Przełącznik zamiast przewijania w bok. */}
      <div
        role="tablist"
        aria-label="Kolumna"
        className="mt-4 grid grid-cols-4 gap-1 rounded-xl border border-white/[0.08] bg-[var(--surface)] p-1 lg:hidden"
      >
        {TASK_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            role="tab"
            aria-selected={mobileColumn === status}
            onClick={() => setMobileColumn(status)}
            className={cn(
              "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg text-[11.5px] font-medium",
              mobileColumn === status ? "bg-[var(--surface-3)] text-white" : "text-[var(--text-muted)]"
            )}
          >
            <span className="inline-flex items-center gap-1">
              <StatusIcon status={status} task className="size-3.5" />
              <span className="tabular">{rows.filter((task) => task.status === status).length}</span>
            </span>
            <span className="truncate">{TASK_STATUS_LABELS[status]}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:mt-5 lg:grid-cols-4">
        {TASK_STATUSES.map((status) => {
          const cards = rows.filter((task) => task.status === status);
          const isOver = over === status;
          return (
            <section
              key={status}
              aria-label={TASK_STATUS_LABELS[status]}
              onDragOver={(event) => {
                if (!dragId) return;
                event.preventDefault();
                setOver(status);
              }}
              onDragLeave={() => setOver((current) => (current === status ? null : current))}
              onDrop={(event) => {
                event.preventDefault();
                setOver(null);
                const task = rows.find((item) => item.id === event.dataTransfer.getData("text/plain"));
                if (task) move(task, status);
              }}
              className={cn(
                "min-w-0 flex-col rounded-[22px] border p-2.5 transition-colors",
                status === mobileColumn ? "flex" : "hidden lg:flex",
                status === "done"
                  ? "border-[var(--success)]/[0.14] bg-[var(--success)]/[0.045]"
                  : "border-transparent bg-white/[0.02]",
                isOver && "border-[var(--vairo)]/45 bg-[var(--vairo)]/[0.05]"
              )}
            >
              <header className="flex items-center gap-2 px-1.5 pb-2.5 pt-1">
                <StatusIcon status={status} task className="size-4" />
                <h2 className="text-[13px] font-semibold text-white">{TASK_STATUS_LABELS[status]}</h2>
                <span className="tabular text-[12px] text-[var(--text-subtle)]">{cards.length}</span>
              </header>

              <ul className="flex min-h-16 flex-col gap-2">
                {cards.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    today={today}
                    canEdit={canEditTask(task)}
                    highlighted={task.id === openId}
                    dragging={dragId === task.id}
                    menu={menuFor(task)}
                    onOpen={() => setOpen(task.id)}
                    onKeyMove={(direction) => {
                      const index = TASK_STATUSES.indexOf(task.status) + direction;
                      const next = TASK_STATUSES[index];
                      if (next) move(task, next);
                    }}
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/plain", task.id);
                      event.dataTransfer.effectAllowed = "move";
                      setDragId(task.id);
                    }}
                    onDragEnd={() => {
                      setDragId(null);
                      setOver(null);
                    }}
                  />
                ))}
                {cards.length === 0 && status !== "todo" ? (
                  <li className="rounded-xl border border-dashed border-white/[0.08] px-3 py-4 text-center text-[12.5px] text-[var(--text-subtle)]">
                    {status === "blocked" ? "Nic nie stoi w miejscu." : "Pusto."}
                  </li>
                ) : null}
              </ul>

              {status === "todo" ? (
                <AddTask
                  key={addSignal}
                  startOpen={addSignal > 0}
                  goals={openGoals}
                  goalFilter={goalFilter}
                  pending={pending}
                  onAdd={(title, goalId) =>
                    run(
                      () => createTask({ startupId, goalId, title, ownerId: userId }),
                      "Zadanie dodane"
                    )
                  }
                />
              ) : null}

              {status === "done" ? (
                <p className="px-1.5 pt-3 text-[12px] leading-relaxed text-[var(--text-subtle)]">
                  {doneThisWeek !== null && doneThisWeek > 0
                    ? `${doneThisWeek} w tym tygodniu. `
                    : ""}
                  Zrobione zadania nie kończą celu — kończy go dowód.
                </p>
              ) : null}
            </section>
          );
        })}
      </div>

      {mine && rows.length === 0 ? (
        <EmptyNote className="mt-4">
          Nie masz jeszcze żadnego zadania. Dodaj pierwsze w kolumnie „Do zrobienia” albo
          zobacz, nad czym pracuje cały team.
        </EmptyNote>
      ) : null}

      {openTask ? (
        <TaskPanel
          key={openTask.id}
          task={openTask}
          members={members}
          editable={canEditTask(openTask)}
          canAssign={canAssign}
          canDelete={canDeleteTask(openTask)}
          pending={pending}
          onClose={() => setOpen(null)}
          onStatus={(status) => move(openTask, status)}
          onOwner={(ownerId) =>
            run(
              () => updateTask({ startupId, taskId: openTask.id, ownerId }),
              `Przypisane: ${members.find((member) => member.id === ownerId)?.name ?? ""}`
            )
          }
          onDue={(dueDate) =>
            run(
              () => updateTask({ startupId, taskId: openTask.id, dueDate }),
              dueDate ? `Termin: ${formatDay(dueDate)}` : "Termin usunięty"
            )
          }
          onTitle={(title) =>
            run(() => updateTask({ startupId, taskId: openTask.id, title }), "Zadanie zapisane")
          }
          onNote={(note) =>
            run(() => updateTask({ startupId, taskId: openTask.id, note }), "Notatka zapisana")
          }
          onBlocker={(blockerNote) =>
            run(
              () => updateTask({ startupId, taskId: openTask.id, blockerNote }),
              "Powód blokady zapisany"
            )
          }
          startupId={startupId}
          onDelete={() => setDeleting(openTask)}
        />
      ) : null}

      {deleting ? (
        <Modal
          title="Usunąć to zadanie?"
          description="Zniknie z tablicy i z celu. Tego nie da się cofnąć."
          onClose={() => setDeleting(null)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setDeleting(null)}>
                Zostaw
              </Button>
              <Button
                variant="danger"
                loading={pending}
                onClick={() =>
                  run(() => deleteTask(startupId, deleting.id), "Zadanie usunięte", () => {
                    if (openId === deleting.id) setOpen(null);
                    setDeleting(null);
                  })
                }
              >
                Usuń zadanie
              </Button>
            </>
          }
        >
          <p className="text-[14px] text-white">{deleting.title}</p>
        </Modal>
      ) : null}
    </div>
  );
}

/**
 * Wiersz dodawania w kolumnie: pyta tylko o tytuł. Cel bierze z filtra albo
 * z ostatnio użytego — i pokazuje go skrótem, zamiast całego długiego tytułu
 * w polu wyboru.
 */
function AddTask({
  goals,
  goalFilter,
  pending,
  onAdd,
  startOpen = false,
}: {
  startOpen?: boolean;
  goals: GoalItem[];
  goalFilter: string;
  pending: boolean;
  onAdd: (title: string, goalId: string) => void;
}) {
  const [open, setOpen] = useState(startOpen);
  const [title, setTitle] = useState("");
  const [lastGoal, setLastGoal] = useState(goals[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const goalId = goalFilter !== "all" && goals.some((goal) => goal.id === goalFilter) ? goalFilter : lastGoal;

  if (goals.length === 0) {
    return (
      <p className="px-1.5 pt-2 text-[12.5px] leading-relaxed text-[var(--text-subtle)]">
        Wszystkie cele są ukończone. Nowe zadanie dodasz pod nowym celem.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-[13px] text-[var(--text-muted)] transition-colors hover:bg-white/[0.03] hover:text-white"
      >
        <span className="inline-flex size-5 items-center justify-center rounded-full border border-dashed border-white/25">
          <Plus className="size-3" aria-hidden="true" />
        </span>
        Dodaj zadanie
      </button>
    );
  }

  const submit = () => {
    if (title.trim().length < 2) {
      setError("Napisz, co jest do zrobienia.");
      return;
    }
    onAdd(title.trim(), goalId);
    setTitle("");
    setError(null);
  };

  return (
    <div className="mt-2 rounded-2xl bg-[var(--surface)] p-3 lift-1">
      <Input
        autoFocus
        aria-label="Nowe zadanie"
        aria-invalid={Boolean(error)}
        value={title}
        maxLength={180}
        placeholder="Co jest do zrobienia?"
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            submit();
          }
          if (event.key === "Escape") setOpen(false);
        }}
      />
      {error ? <p className="mt-1.5 text-[12px] text-[var(--danger)]">{error}</p> : null}
      <div className="mt-2.5 flex items-center gap-2">
        <Flag className="size-3 shrink-0 text-[var(--text-subtle)]" aria-hidden="true" />
        <MenuSelect
          size="sm"
          className="min-w-0 flex-1"
          ariaLabel="Cel zadania"
          value={goalId}
          disabled={goalFilter !== "all"}
          onChange={setLastGoal}
          options={goals.map((goal) => ({ value: goal.id, label: goal.title }))}
        />
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className="hidden text-[11.5px] text-[var(--text-subtle)] sm:inline">
          Enter dodaje · Esc anuluje
        </span>
        <div className="ml-auto flex gap-1.5">
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
            Anuluj
          </Button>
          <Button size="sm" variant="secondary" loading={pending} onClick={submit}>
            Dodaj
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Panel zadania: każda zmiana zapisuje się od razu i kończy toastem. */
function TaskPanel({
  task,
  members,
  editable,
  canAssign,
  canDelete,
  pending,
  onClose,
  onStatus,
  onOwner,
  onDue,
  onTitle,
  onNote,
  onBlocker,
  startupId,
  onDelete,
}: {
  task: BoardTask;
  members: TeamMemberOption[];
  editable: boolean;
  canAssign: boolean;
  canDelete: boolean;
  pending: boolean;
  onClose: () => void;
  onStatus: (status: TaskStatus) => void;
  onOwner: (ownerId: string) => void;
  onDue: (dueDate: string | null) => void;
  onTitle: (title: string) => void;
  onNote: (note: string) => void;
  onBlocker: (note: string) => void;
  startupId: string;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [note, setNote] = useState(task.note ?? "");
  const [blocker, setBlocker] = useState(task.blockerNote ?? "");
  // `undefined` = baza nie ma kolumn z 029. Wtedy nie pokazujemy pól, których
  // nie da się zapisać — przycisk, który nic nie robi, to fake UI.
  const detailsAvailable = task.note !== undefined;
  const [history, setHistory] = useState<{ available: boolean; events: TaskEvent[] } | null>(null);

  useEffect(() => {
    let alive = true;
    void loadTaskEvents(startupId, task.id).then((result) => {
      if (alive) setHistory(result);
    });
    return () => {
      alive = false;
    };
  }, [startupId, task.id, task.status, task.ownerId, task.dueDate]);

  return (
    <Drawer
      title={task.title}
      eyebrow={
        <Link
          href={`/app/goals/${task.goalId}`}
          className="inline-flex items-center gap-1.5 hover:text-white"
        >
          <Flag className="size-3" aria-hidden="true" />
          Cel „{task.goalTitle}”
        </Link>
      }
      onClose={onClose}
      footer={
        canDelete ? (
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-[var(--danger)]">
            <Trash2 className="size-3.5" />
            Usuń zadanie
          </Button>
        ) : null
      }
    >
      {!editable ? (
        <p className="mb-5 flex items-start gap-2 rounded-xl border border-white/[0.08] bg-[var(--surface-2)] px-3.5 py-2.5 text-[13px] text-[var(--text-muted)]">
          <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          Zmienia je {task.ownerName}, Founder albo Admin.
        </p>
      ) : null}

      <div className="flex flex-col gap-6">
        {editable ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--text-muted)]">Zadanie</span>
            <Input
              value={title}
              maxLength={180}
              onChange={(event) => setTitle(event.target.value)}
              onBlur={() => {
                if (title.trim() && title.trim() !== task.title) onTitle(title.trim());
              }}
            />
          </div>
        ) : null}

        <div>
          <span className="text-[13px] font-medium text-[var(--text-muted)]">Status</span>
          <div role="radiogroup" aria-label="Status" className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TASK_STATUSES.map((status) => {
              const on = status === task.status;
              return (
                <button
                  key={status}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  disabled={!editable || pending}
                  onClick={() => onStatus(status)}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl border px-1 text-[12px] font-medium transition-colors",
                    on
                      ? "border-white/30 bg-[var(--surface-3)] text-white"
                      : "border-transparent bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-white",
                    !editable && "cursor-not-allowed opacity-60"
                  )}
                >
                  <StatusIcon status={status} task className="size-4" />
                  {TASK_STATUS_LABELS[status]}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className="text-[13px] font-medium text-[var(--text-muted)]">Osoba</span>
          {canAssign ? (
            <MenuSelect
              className="mt-2"
              ariaLabel="Osoba"
              value={task.ownerId ?? ""}
              onChange={onOwner}
              options={members.map((member) => ({ value: member.id, label: member.name }))}
            />
          ) : (
            <div className="mt-2">
              <p className="flex items-center gap-2 text-[14px] text-white">
                <Avatar name={task.ownerName} size="xs" />
                {task.ownerName}
              </p>
              <p className="mt-1 text-[12px] text-[var(--text-subtle)]">
                Przypisać pracę innej osobie może Founder albo Admin.
              </p>
            </div>
          )}
        </div>

        <div>
          <span className="text-[13px] font-medium text-[var(--text-muted)]">Termin</span>
          <div className="mt-2 flex items-center gap-2">
            <Input
              type="date"
              aria-label="Termin"
              disabled={!editable}
              defaultValue={task.dueDate ?? ""}
              onBlur={(event) => {
                const value = event.target.value || null;
                if (value !== task.dueDate) onDue(value);
              }}
              className="[color-scheme:dark]"
            />
            {editable && task.dueDate ? (
              <Button size="sm" variant="ghost" onClick={() => onDue(null)}>
                Bez terminu
              </Button>
            ) : null}
          </div>
        </div>

        {detailsAvailable && task.status === "blocked" ? (
          <div>
            <label htmlFor="powod-blokady" className="text-[13px] font-medium text-[var(--text-muted)]">
              Co blokuje
            </label>
            <Input
              id="powod-blokady"
              className="mt-2"
              disabled={!editable}
              value={blocker}
              maxLength={300}
              placeholder="Na przykład: czeka na podpis po stronie firmy"
              onChange={(event) => setBlocker(event.target.value)}
              onBlur={() => {
                if (blocker.trim() !== (task.blockerNote ?? "")) onBlocker(blocker);
              }}
            />
            <p className="mt-1 text-[12px] text-[var(--text-subtle)]">
              Widać to na karcie, żeby zespół wiedział, na co czekacie.
            </p>
          </div>
        ) : null}

        {detailsAvailable ? (
          <div>
            <label htmlFor="notatka-zadania" className="text-[13px] font-medium text-[var(--text-muted)]">
              Notatka
            </label>
            <Textarea
              id="notatka-zadania"
              className="mt-2"
              rows={3}
              disabled={!editable}
              value={note}
              maxLength={2000}
              placeholder="Szczegóły, linki, gdzie co leży"
              onChange={(event) => setNote(event.target.value)}
              onBlur={() => {
                if (note.trim() !== (task.note ?? "")) onNote(note);
              }}
            />
          </div>
        ) : null}

        {history?.available ? (
          <div>
            <p className="text-[13px] font-medium text-[var(--text-muted)]">Historia</p>
            <ol className="mt-2 flex flex-col gap-2.5 border-l border-white/10 pl-4">
              {history.events.map((event) => (
                <li key={event.id} className="relative">
                  <span className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-white/30" aria-hidden="true" />
                  <p className="text-[13px] text-white">{taskEventLabel(event, members)}</p>
                  <p className="text-[12px] text-[var(--text-subtle)]">
                    {formatMoment(event.createdAt)}
                    {event.actorName ? ` · ${event.actorName}` : ""}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <p className="text-[12.5px] text-[var(--text-subtle)]">
            Dodane {formatDay(task.createdAt)}
          </p>
        )}
      </div>
    </Drawer>
  );
}

/** Pusty stan bez celów: zadanie zawsze należy do celu, więc prowadzimy do Celów. */
function NoGoals() {
  return (
    <section className="mt-6 rounded-[25px] border border-dashed border-white/10 px-6 py-8 sm:px-8">
      <h2 className="font-heading text-[17px] font-semibold text-white">
        Zadania to małe kroki do celu
      </h2>
      <ol className="mt-4 flex max-w-xl flex-col gap-3 text-[14px] leading-relaxed text-[var(--text-muted)]">
        {[
          "Każde zadanie należy do jednego celu — najpierw załóż cel.",
          "Przesuwasz je między kolumnami, gdy zmienia się stan.",
          "Zrobione zadania nie kończą celu — kończy go dowód.",
        ].map((line, index) => (
          <li key={line} className="flex gap-3">
            <span className="tabular inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-[12px] font-semibold text-white">
              {index + 1}
            </span>
            {line}
          </li>
        ))}
      </ol>
      <Button className="mt-6" href="/app/goals/new">
        Załóż pierwszy cel
      </Button>
    </section>
  );
}

function taskEventLabel(event: TaskEvent, members: TeamMemberOption[]) {
  const name = (id: unknown) =>
    typeof id === "string" ? (members.find((member) => member.id === id)?.name ?? "osoba spoza teamu") : "nikt";
  if (event.kind === "created") return "Zadanie dodane";
  if (event.kind === "owner") return `Przypisane: ${name(event.payload.to)}`;
  if (event.kind === "deadline") {
    return typeof event.payload.due_date === "string"
      ? `Termin: ${formatDay(event.payload.due_date)}`
      : "Termin usunięty";
  }
  const to = event.payload.to;
  const label =
    typeof to === "string" && to in TASK_STATUS_LABELS ? TASK_STATUS_LABELS[to as TaskStatus] : "zmiana";
  return `Status: ${label.toLowerCase()}`;
}
