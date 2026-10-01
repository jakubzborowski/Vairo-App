"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Flag, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import {
  addGoalMaterial,
  archiveGoal,
  completeGoal,
  createGoal,
  createTask,
  linkGoal,
  reopenGoal,
  unlinkGoal,
  updateGoal,
  updateTask,
} from "@/app/app/goals/actions";
import { proofGap, proofMatches } from "@/lib/proof";
import { canAssignToOthers, canChangeOwnWork, type StartupRole } from "@/types/startup";
import {
  GOAL_STATUSES,
  GOAL_STATUS_LABELS,
  PROOF_KINDS,
  PROOF_KIND_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type GoalItem,
  type GoalStatus,
  type LibraryPick,
  type MilestoneCondition,
  type ProofKind,
  type ProofRequirement,
  type GoalTypeOption,
  type TaskStatus,
  type TeamMemberOption,
  type WorkflowPick,
} from "@/types/goals";

const fieldClass =
  "h-11 w-full rounded-xl border border-white/10 bg-[var(--surface-2)] px-3.5 text-[14px] text-white outline-none focus:border-[var(--vairo)]/70";

type Mode = "create" | "link" | null;

export function GoalsTracker({
  startupId,
  userId,
  role,
  members,
  goals,
  conditions,
  files,
  workflows,
  goalTypes,
  initialGoalId,
  initialConditionId,
  initialMode,
}: {
  startupId: string;
  userId: string;
  role: StartupRole;
  members: TeamMemberOption[];
  goals: GoalItem[];
  conditions: MilestoneCondition[];
  files: LibraryPick[];
  workflows: WorkflowPick[];
  goalTypes: GoalTypeOption[];
  initialGoalId: string | null;
  initialConditionId: string | null;
  initialMode: Mode;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showArchived, setShowArchived] = useState(false);
  const [openId, setOpenId] = useState<string | null>(initialGoalId);
  const [creating, setCreating] = useState(initialMode === "create");
  const [draftConditionId, setDraftConditionId] = useState<string | null>(
    initialMode === "create" ? initialConditionId : null
  );
  const [linkConditionId, setLinkConditionId] = useState<string | null>(
    initialMode === "link" ? initialConditionId : null
  );

  const canAssign = canAssignToOthers(role);
  const open = goals.find((goal) => goal.id === openId) ?? null;
  const preset = conditions.find((condition) => condition.id === draftConditionId) ?? null;
  const linkTarget = conditions.find((condition) => condition.id === linkConditionId) ?? null;

  const visible = useMemo(() => {
    return goals.filter((goal) => {
      if (!showArchived && goal.archivedAt) return false;
      if (showArchived && !goal.archivedAt) return false;
      if (ownerFilter === "me" && goal.ownerId !== userId) return false;
      if (ownerFilter !== "all" && ownerFilter !== "me" && goal.ownerId !== ownerFilter) {
        return false;
      }
      if (statusFilter !== "all" && goal.status !== statusFilter) return false;
      return true;
    });
  }, [goals, showArchived, ownerFilter, statusFilter, userId]);

  const run = (work: () => Promise<{ error: string | null; id?: string }>, close = false) => {
    setError(null);
    start(async () => {
      const result = await work();
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.id) setOpenId(result.id);
      if (close) {
        setCreating(false);
        setLinkConditionId(null);
      }
      router.refresh();
    });
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-[1.6rem] font-semibold text-white">Cele</h1>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[var(--text-muted)]">
            Cel opisuje wynik, który chcecie osiągnąć. Kończy go dowód, nie
            odhaczenie zadań. Dodatkowe cele nie poszerzają programu — do etapu
            liczą się tylko te podpięte pod warunek.
          </p>
        </div>
        <Button
          onClick={() => {
            setError(null);
            setDraftConditionId(null);
            setCreating(true);
          }}
        >
          <Plus className="size-4" />
          Dodaj cel
        </Button>
      </header>

      {conditions.length > 0 ? (
        <ul className="mt-5 flex flex-col gap-2">
          {conditions.map((condition) => (
            <li
              key={condition.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[var(--surface)] px-4 py-3"
            >
              <div>
                <p className="text-[13px] text-[var(--text-subtle)]">{condition.subpointTitle}</p>
                <p className="text-[14px] font-medium text-white">
                  {condition.goalTypeLabel}{" "}
                  <span className="tabular text-[var(--text-muted)]">
                    {condition.done}/{condition.minCount}
                  </span>
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setLinkConditionId(condition.id);
                    setCreating(false);
                  }}
                >
                  Podepnij istniejący
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setDraftConditionId(condition.id);
                    setLinkConditionId(null);
                    setCreating(true);
                  }}
                >
                  Dodaj cel
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        <select
          className={fieldClass + " h-9 w-auto"}
          value={ownerFilter}
          onChange={(event) => setOwnerFilter(event.target.value)}
          aria-label="Filtr właściciela"
        >
          <option value="all">Wszyscy</option>
          <option value="me">Moje</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
        <select
          className={fieldClass + " h-9 w-auto"}
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filtr statusu"
        >
          <option value="all">Każdy status</option>
          {GOAL_STATUSES.map((status) => (
            <option key={status} value={status}>
              {GOAL_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setShowArchived((value) => !value)}
          className="h-9 rounded-xl px-3 text-[13px] text-[var(--text-subtle)] hover:text-white"
        >
          {showArchived ? "Pokaż aktywne" : "Pokaż zarchiwizowane"}
        </button>
      </div>

      {error && !open && !creating ? (
        <p className="mt-3 text-[13px] text-[var(--danger)]">{error}</p>
      ) : null}

      {visible.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Flag}
            title={showArchived ? "Nie ma zarchiwizowanych celów" : "Nie ma jeszcze celów"}
            description="Cel to wynik, na przykład pierwsza działająca wersja albo sprawdzony prototyp. Zadania pod nim są tylko pomocą."
            action={
              <Button onClick={() => setCreating(true)}>
                <Plus className="size-4" />
                Dodaj pierwszy cel
              </Button>
            }
          />
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {visible.map((goal) => {
            const tasksDone = goal.tasks.filter((task) => task.status === "done").length;
            const proofOk = proofMatches(goal.proofRequirement, goal.proofSnapshot);
            return (
              <li key={goal.id}>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setOpenId(goal.id);
                  }}
                  className="flex w-full flex-col gap-2 rounded-2xl border border-white/10 bg-[var(--surface)] px-4 py-3 text-left transition-colors hover:border-white/20"
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-white">{goal.title}</span>
                    <Badge tone={toneFor(goal.status)}>{GOAL_STATUS_LABELS[goal.status]}</Badge>
                    {goal.overdue ? <Badge tone="warning">Po terminie</Badge> : null}
                    {goal.needsReassign ? <Badge tone="danger">Do przypisania</Badge> : null}
                    {goal.status !== "completed" && !proofOk ? (
                      <Badge tone="neutral">Brak proof</Badge>
                    ) : null}
                  </span>
                  <span className="flex flex-wrap gap-x-3 gap-y-1 text-[12.5px] text-[var(--text-subtle)]">
                    <span>{goal.goalTypeLabel}</span>
                    <span>{goal.ownerName}</span>
                    <span>{formatDay(goal.dueDate)}</span>
                    {goal.tasks.length > 0 ? (
                      <span>
                        {tasksDone}/{goal.tasks.length} zadań
                      </span>
                    ) : null}
                    {goal.conditions[0] ? (
                      <span>
                        {goal.conditions[0].label} {goal.conditions[0].done}/{goal.conditions[0].minCount}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {creating ? (
        <GoalDraft
          pending={pending}
          error={error}
          members={members}
          goalTypes={goalTypes}
          canAssign={canAssign}
          userId={userId}
          preset={preset}
          onClose={() => setCreating(false)}
          onSubmit={(values) =>
            run(
              () =>
                createGoal({
                  startupId,
                  title: values.title,
                  description: values.description,
                  goalTypeId: values.goalTypeId,
                  ownerId: values.ownerId,
                  dueDate: values.dueDate,
                  proofRequirement: values.proofRequirement,
                  note: values.note,
                  conditionId: preset?.id ?? null,
                  addAnother: values.addAnother,
                }),
              true
            )
          }
        />
      ) : null}

      {linkTarget ? (
        <Modal
          title="Podepnij istniejący cel"
          description={linkTarget.subpointTitle}
          onClose={() => setLinkConditionId(null)}
        >
          <LinkList
            goals={goals.filter(
              (goal) =>
                !goal.archivedAt &&
                goal.goalTypeId === linkTarget.goalTypeId &&
                !goal.conditions.some((condition) => condition.id === linkTarget.id)
            )}
            pending={pending}
            onPick={(goalId) => run(() => linkGoal(startupId, goalId, linkTarget.id), true)}
          />
          {error ? <p className="mt-3 text-[13px] text-[var(--danger)]">{error}</p> : null}
        </Modal>
      ) : null}

      {open ? (
        <GoalCard
          goal={open}
          startupId={startupId}
          userId={userId}
          role={role}
          members={members}
          goalTypes={goalTypes}
          files={files}
          workflows={workflows}
          goals={goals}
          pending={pending}
          error={error}
          canAssign={canAssign}
          onClose={() => setOpenId(null)}
          run={run}
        />
      ) : null}
    </div>
  );
}

function GoalDraft({
  pending,
  error,
  members,
  goalTypes,
  canAssign,
  userId,
  preset,
  onClose,
  onSubmit,
}: {
  pending: boolean;
  error: string | null;
  members: TeamMemberOption[];
  goalTypes: GoalTypeOption[];
  canAssign: boolean;
  userId: string;
  preset: MilestoneCondition | null;
  onClose: () => void;
  onSubmit: (values: {
    title: string;
    description: string;
    goalTypeId: string;
    ownerId: string;
    dueDate: string;
    proofRequirement: ProofRequirement;
    note: string;
    addAnother: boolean;
  }) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goalTypeId, setGoalTypeId] = useState(preset?.goalTypeId ?? "custom");
  const [ownerId, setOwnerId] = useState(userId);
  const [dueDate, setDueDate] = useState("");
  const [kind, setKind] = useState<ProofKind>(preset?.proofKind ?? "long_text");
  const [proofLabel, setProofLabel] = useState("Krótki wynik");
  const [optionsText, setOptionsText] = useState("Tak\nNie");
  const [note, setNote] = useState("");
  const [addAnother, setAddAnother] = useState(false);

  const requirement = buildRequirement(kind, proofLabel, optionsText);

  return (
    <Modal
      title="Nowy cel"
      description="Jedna osoba odpowiada za wynik. Inni mogą dostać zadania."
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Anuluj
          </Button>
          <Button
            loading={pending}
            onClick={() =>
              onSubmit({
                title,
                description,
                goalTypeId,
                ownerId: canAssign ? ownerId : userId,
                dueDate,
                proofRequirement: requirement,
                note,
                addAnother,
              })
            }
          >
            Zapisz cel
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <label className="text-[13px] text-[var(--text-muted)]">
          Rezultat
          <input className={fieldClass + " mt-1.5"} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Na przykład: pierwsza działająca wersja logowania" />
        </label>
        <label className="text-[13px] text-[var(--text-muted)]">
          Opis, jeśli potrzebny
          <textarea className={fieldClass + " mt-1.5 h-20 py-2"} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-[13px] text-[var(--text-muted)]">
            Typ
            <select
              className={fieldClass + " mt-1.5"}
              value={goalTypeId}
              disabled={Boolean(preset)}
              onChange={(e) => setGoalTypeId(e.target.value)}
            >
              {goalTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[13px] text-[var(--text-muted)]">
            Termin
            <input type="date" className={fieldClass + " mt-1.5"} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </label>
        </div>
        <label className="text-[13px] text-[var(--text-muted)]">
          Właściciel
          <select
            className={fieldClass + " mt-1.5"}
            value={canAssign ? ownerId : userId}
            disabled={!canAssign}
            onChange={(e) => setOwnerId(e.target.value)}
          >
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[13px] text-[var(--text-muted)]">
          Czym pokażecie, że jest gotowe
          <input className={fieldClass + " mt-1.5"} value={proofLabel} onChange={(e) => setProofLabel(e.target.value)} />
        </label>
        <label className="text-[13px] text-[var(--text-muted)]">
          Format dowodu
          <select
            className={fieldClass + " mt-1.5"}
            value={kind}
            disabled={Boolean(preset?.proofKind)}
            onChange={(e) => setKind(e.target.value as ProofKind)}
          >
            {PROOF_KINDS.map((item) => (
              <option key={item} value={item}>
                {PROOF_KIND_LABELS[item]}
              </option>
            ))}
          </select>
        </label>
        {kind === "select" ? (
          <label className="text-[13px] text-[var(--text-muted)]">
            Opcje, jedna na linię
            <textarea className={fieldClass + " mt-1.5 h-20 py-2"} value={optionsText} onChange={(e) => setOptionsText(e.target.value)} />
          </label>
        ) : null}
        <label className="text-[13px] text-[var(--text-muted)]">
          Notatka
          <textarea className={fieldClass + " mt-1.5 h-16 py-2"} value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        {preset ? (
          <label className="flex items-center gap-2 text-[13px] text-[var(--text-muted)]">
            <input
              type="checkbox"
              checked={addAnother}
              onChange={(event) => setAddAnother(event.target.checked)}
            />
            To kolejny cel tego warunku, nie ten sam co poprzednio
          </label>
        ) : null}
        {error ? <p className="text-[13px] text-[var(--danger)]">{error}</p> : null}
      </div>
    </Modal>
  );
}

function GoalCard({
  goal,
  startupId,
  userId,
  role,
  members,
  goalTypes,
  files,
  workflows,
  goals,
  pending,
  error,
  canAssign,
  onClose,
  run,
}: {
  goal: GoalItem;
  startupId: string;
  userId: string;
  role: StartupRole;
  members: TeamMemberOption[];
  goalTypes: GoalTypeOption[];
  files: LibraryPick[];
  workflows: WorkflowPick[];
  goals: GoalItem[];
  pending: boolean;
  error: string | null;
  canAssign: boolean;
  onClose: () => void;
  run: (work: () => Promise<{ error: string | null; id?: string }>) => void;
}) {
  const editable = canChangeOwnWork(role, userId, goal.ownerId) && !goal.archivedAt;
  const locked = goal.status === "completed";
  const [taskTitle, setTaskTitle] = useState("");
  const [note, setNote] = useState("");
  const [materialUrl, setMaterialUrl] = useState("");
  const [fileId, setFileId] = useState(files[0]?.id ?? "");
  const [proofText, setProofText] = useState("");
  const [proofNote, setProofNote] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [proofOption, setProofOption] = useState(goal.proofRequirement.options?.[0]?.value ?? "");
  const [proofScale, setProofScale] = useState(goal.proofRequirement.min ?? 1);
  const [proofFile, setProofFile] = useState(files[0]?.id ?? "");
  const [proofFlow, setProofFlow] = useState(workflows[0]?.id ?? "");
  const [proofGoals, setProofGoals] = useState<string[]>([]);
  const [blocker, setBlocker] = useState(goal.blockerNote ?? "");

  const tasksDone = goal.tasks.filter((task) => task.status === "done").length;

  return (
    <Modal
      title={goal.title}
      description="Zadania pomagają dojść do wyniku. Same go nie zaliczają."
      className="max-w-[680px]"
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        {goal.needsReassign ? (
          <p className="rounded-xl bg-[var(--danger)]/10 px-3 py-2 text-[13px] text-[var(--danger)]">
            Poprzednia osoba odeszła z teamu. Wskaż nowego właściciela.
          </p>
        ) : null}
        {goal.overdue ? (
          <p className="text-[13px] text-[var(--warning)]">Termin minął. Wynik dodany później nadal się liczy.</p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-[13px] text-[var(--text-muted)]">
            Status
            <select
              className={fieldClass + " mt-1.5"}
              disabled={!editable}
              value={goal.status === "completed" ? "completed" : goal.status}
              onChange={(event) => {
                const status = event.target.value as GoalStatus;
                if (status === "completed") return;
                run(() =>
                  updateGoal({
                    startupId,
                    goalId: goal.id,
                    status,
                    blockerNote: status === "blocked" ? blocker : undefined,
                  })
                );
              }}
            >
              {GOAL_STATUSES.filter((status) => status !== "completed").map((status) => (
                <option key={status} value={status}>
                  {GOAL_STATUS_LABELS[status]}
                </option>
              ))}
              {locked ? <option value="completed">Ukończony</option> : null}
            </select>
          </label>
          <label className="text-[13px] text-[var(--text-muted)]">
            Termin
            <input
              type="date"
              className={fieldClass + " mt-1.5"}
              disabled={!editable}
              defaultValue={goal.dueDate}
              onBlur={(event) => {
                if (event.target.value && event.target.value !== goal.dueDate) {
                  run(() => updateGoal({ startupId, goalId: goal.id, dueDate: event.target.value }));
                }
              }}
            />
          </label>
          <label className="text-[13px] text-[var(--text-muted)]">
            Właściciel
            <select
              className={fieldClass + " mt-1.5"}
              disabled={!editable || !canAssign}
              value={goal.ownerId ?? ""}
              onChange={(event) =>
                run(() => updateGoal({ startupId, goalId: goal.id, ownerId: event.target.value }))
              }
            >
              {goal.ownerId && !members.some((member) => member.id === goal.ownerId) ? (
                <option value={goal.ownerId}>{goal.ownerName}</option>
              ) : null}
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[13px] text-[var(--text-muted)]">
            Typ
            <select
              className={fieldClass + " mt-1.5"}
              disabled={!editable || locked}
              value={goal.goalTypeId}
              onChange={(event) =>
                run(() => updateGoal({ startupId, goalId: goal.id, goalTypeId: event.target.value }))
              }
            >
              {goalTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {goal.status === "blocked" || blocker ? (
          <label className="text-[13px] text-[var(--text-muted)]">
            Co stoi na przeszkodzie
            <input
              className={fieldClass + " mt-1.5"}
              value={blocker}
              disabled={!editable}
              onChange={(event) => setBlocker(event.target.value)}
              onBlur={() => {
                if (blocker.trim() && blocker.trim() !== (goal.blockerNote ?? "")) {
                  run(() =>
                    updateGoal({
                      startupId,
                      goalId: goal.id,
                      status: "blocked",
                      blockerNote: blocker,
                    })
                  );
                }
              }}
            />
          </label>
        ) : null}

        <section>
          <p className="text-[13px] font-medium text-white">
            Zadania{goal.tasks.length > 0 ? ` · ${tasksDone}/${goal.tasks.length}` : ""}
          </p>
          <ul className="mt-2 flex flex-col gap-2">
            {goal.tasks.map((task) => (
              <li key={task.id} className="flex flex-wrap items-center gap-2">
                <span className="min-w-0 flex-1 text-[14px] text-white">{task.title}</span>
                <span className="text-[12px] text-[var(--text-subtle)]">{task.ownerName}</span>
                {task.needsReassign ? <Badge tone="danger">Do przypisania</Badge> : null}
                <select
                  className={fieldClass + " h-8 w-auto"}
                  disabled={!canChangeOwnWork(role, userId, task.ownerId) && !canAssign}
                  value={task.status}
                  onChange={(event) =>
                    run(() =>
                      updateTask({
                        startupId,
                        taskId: task.id,
                        status: event.target.value as TaskStatus,
                      })
                    )
                  }
                >
                  {TASK_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {TASK_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
          {editable ? (
            <div className="mt-2 flex gap-2">
              <input
                className={fieldClass}
                value={taskTitle}
                placeholder="Nowe zadanie"
                onChange={(event) => setTaskTitle(event.target.value)}
              />
              <Button
                variant="secondary"
                disabled={taskTitle.trim().length < 2}
                title={taskTitle.trim().length < 2 ? "Wpisz, co jest do zrobienia" : undefined}
                onClick={() => {
                  const title = taskTitle;
                  setTaskTitle("");
                  run(() =>
                    createTask({
                      startupId,
                      goalId: goal.id,
                      title,
                      ownerId: canAssign ? goal.ownerId || userId : userId,
                    })
                  );
                }}
              >
                Dodaj
              </Button>
            </div>
          ) : null}
          {tasksDone === goal.tasks.length && goal.tasks.length > 0 && goal.status !== "completed" ? (
            <p className="mt-2 text-[12.5px] text-[var(--text-subtle)]">
              Zadania są zrobione. Cel i tak czeka na dowód.
            </p>
          ) : null}
        </section>

        <section>
          <p className="text-[13px] font-medium text-white">Materiały robocze</p>
          <p className="mt-1 text-[12.5px] text-[var(--text-subtle)]">
            To nie jest jeszcze dowód. Dowód zatwierdzasz na dole karty.
          </p>
          <ul className="mt-2 flex flex-col gap-1 text-[13px] text-[var(--text-muted)]">
            {goal.materials.map((item) => (
              <li key={item.id}>
                {item.kind === "note" ? item.body : null}
                {item.kind === "link" ? item.url : null}
                {item.kind === "file" ? item.fileName : null}
              </li>
            ))}
          </ul>
          {editable ? (
            <div className="mt-2 flex flex-col gap-2">
              <div className="flex gap-2">
                <input className={fieldClass} value={note} placeholder="Krótka notatka" onChange={(e) => setNote(e.target.value)} />
                <Button
                  variant="secondary"
                  onClick={() => {
                    const body = note;
                    setNote("");
                    run(() => addGoalMaterial({ startupId, goalId: goal.id, kind: "note", body }));
                  }}
                >
                  Zapisz
                </Button>
              </div>
              <div className="flex gap-2">
                <input className={fieldClass} value={materialUrl} placeholder="https://" onChange={(e) => setMaterialUrl(e.target.value)} />
                <Button
                  variant="secondary"
                  onClick={() =>
                    run(() => addGoalMaterial({ startupId, goalId: goal.id, kind: "link", url: materialUrl }))
                  }
                >
                  Link
                </Button>
              </div>
              {files.length > 0 ? (
                <div className="flex gap-2">
                  <select className={fieldClass} value={fileId} onChange={(e) => setFileId(e.target.value)}>
                    {files.map((file) => (
                      <option key={file.id} value={file.id}>
                        {file.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      run(() => addGoalMaterial({ startupId, goalId: goal.id, kind: "file", fileId }))
                    }
                  >
                    Plik
                  </Button>
                </div>
              ) : (
                <p className="text-[12.5px] text-[var(--text-subtle)]">
                  Pliki dodasz w bibliotece, a potem wybierzesz je tutaj.
                </p>
              )}
            </div>
          ) : null}
        </section>

        {goal.conditions.length > 0 ? (
          <section>
            <p className="text-[13px] font-medium text-white">Warunki programu</p>
            <ul className="mt-2 flex flex-col gap-2">
              {goal.conditions.map((condition) => (
                <li key={condition.id} className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
                  <span className="text-[var(--text-muted)]">
                    {condition.subpointTitle} · {condition.label} {condition.done}/{condition.minCount}
                    {condition.counts ? " · ten cel się liczy" : " · ten cel jeszcze się nie liczy"}
                  </span>
                  {editable ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => run(() => unlinkGoal(startupId, goal.id, condition.id))}
                    >
                      Odepnij
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="rounded-xl border border-white/10 p-3">
          <p className="text-[13px] font-medium text-white">
            Dowód · {PROOF_KIND_LABELS[goal.proofRequirement.kind]}
          </p>
          <p className="mt-1 text-[12.5px] text-[var(--text-subtle)]">{goal.proofRequirement.label}</p>
          {locked && goal.proofSnapshot ? (
            <p className="mt-2 text-[14px] text-white">{describeProof(goal)}</p>
          ) : null}
          {editable && !locked ? (
            <ProofFields
              goal={goal}
              files={files}
              workflows={workflows}
              goals={goals}
              proofText={proofText}
              proofNote={proofNote}
              proofUrl={proofUrl}
              proofOption={proofOption}
              proofScale={proofScale}
              proofFile={proofFile}
              proofFlow={proofFlow}
              proofGoals={proofGoals}
              setProofText={setProofText}
              setProofNote={setProofNote}
              setProofUrl={setProofUrl}
              setProofOption={setProofOption}
              setProofScale={setProofScale}
              setProofFile={setProofFile}
              setProofFlow={setProofFlow}
              setProofGoals={setProofGoals}
              pending={pending}
              onComplete={() =>
                run(() =>
                  completeGoal({
                    startupId,
                    goalId: goal.id,
                    proof: draftFrom(goal, {
                      proofText,
                      proofNote,
                      proofUrl,
                      proofOption,
                      proofScale,
                      proofFile,
                      proofFlow,
                      proofGoals,
                    }),
                  })
                )
              }
            />
          ) : null}
          {editable && locked ? (
            <Button className="mt-3" variant="secondary" onClick={() => run(() => reopenGoal(startupId, goal.id))}>
              Otwórz ponownie
            </Button>
          ) : null}
        </section>

        {goal.events.length > 0 ? (
          <ul className="flex flex-col gap-1 text-[12.5px] text-[var(--text-subtle)]">
            {goal.events.map((event) => (
              <li key={event.id}>
                {eventLabel(event.kind, event.payload)}
                {event.actorName ? ` · ${event.actorName}` : ""}
              </li>
            ))}
          </ul>
        ) : null}

        {error ? <p className="text-[13px] text-[var(--danger)]">{error}</p> : null}

        {editable ? (
          <Button variant="danger" onClick={() => run(() => archiveGoal(startupId, goal.id))}>
            Archiwizuj
          </Button>
        ) : null}
      </div>
    </Modal>
  );
}

function ProofFields(props: {
  goal: GoalItem;
  files: LibraryPick[];
  workflows: WorkflowPick[];
  goals: GoalItem[];
  proofText: string;
  proofNote: string;
  proofUrl: string;
  proofOption: string;
  proofScale: number;
  proofFile: string;
  proofFlow: string;
  proofGoals: string[];
  setProofText: (value: string) => void;
  setProofNote: (value: string) => void;
  setProofUrl: (value: string) => void;
  setProofOption: (value: string) => void;
  setProofScale: (value: number) => void;
  setProofFile: (value: string) => void;
  setProofFlow: (value: string) => void;
  setProofGoals: (value: string[]) => void;
  pending: boolean;
  onComplete: () => void;
}) {
  const kind = props.goal.proofRequirement.kind;
  const ready = proofMatches(props.goal.proofRequirement, previewSnapshot(props.goal, props));
  const gap = proofGap(props.goal.proofRequirement);

  return (
    <div className="mt-3 flex flex-col gap-2">
      {kind === "sentence" || kind === "long_text" ? (
        <textarea
          className={fieldClass + " h-24 py-2"}
          value={props.proofText}
          onChange={(event) => props.setProofText(event.target.value)}
          placeholder={kind === "sentence" ? "Jedno zdanie" : "Opisz wynik"}
        />
      ) : null}
      {kind === "select" ? (
        <select className={fieldClass} value={props.proofOption} onChange={(e) => props.setProofOption(e.target.value)}>
          {(props.goal.proofRequirement.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : null}
      {kind === "scale" ? (
        <input
          type="number"
          className={fieldClass}
          min={props.goal.proofRequirement.min ?? 1}
          max={props.goal.proofRequirement.max ?? 5}
          value={props.proofScale}
          onChange={(event) => props.setProofScale(Number(event.target.value))}
        />
      ) : null}
      {kind === "link" ? (
        <>
          <input className={fieldClass} placeholder="https://" value={props.proofUrl} onChange={(e) => props.setProofUrl(e.target.value)} />
          <input className={fieldClass} placeholder="Co tam jest" value={props.proofNote} onChange={(e) => props.setProofNote(e.target.value)} />
        </>
      ) : null}
      {kind === "file" ? (
        props.files.length > 0 ? (
          <select className={fieldClass} value={props.proofFile} onChange={(e) => props.setProofFile(e.target.value)}>
            {props.files.map((file) => (
              <option key={file.id} value={file.id}>
                {file.name}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-[13px] text-[var(--text-subtle)]">Najpierw dodaj plik w bibliotece.</p>
        )
      ) : null}
      {kind === "module_result" ? (
        props.workflows.length > 0 ? (
          <select className={fieldClass} value={props.proofFlow} onChange={(e) => props.setProofFlow(e.target.value)}>
            {props.workflows.map((flow) => (
              <option key={flow.id} value={flow.id}>
                {flow.title} · wersja {flow.version}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-[13px] text-[var(--text-subtle)]">Najpierw zapisz Rozpiskę.</p>
        )
      ) : null}
      {kind === "goal_set" ? (
        <div className="flex flex-col gap-1">
          {props.goals
            .filter((item) => item.id !== props.goal.id && item.status === "completed" && !item.archivedAt)
            .map((item) => (
              <label key={item.id} className="flex items-center gap-2 text-[13px] text-white">
                <input
                  type="checkbox"
                  checked={props.proofGoals.includes(item.id)}
                  onChange={(event) => {
                    props.setProofGoals(
                      event.target.checked
                        ? [...props.proofGoals, item.id]
                        : props.proofGoals.filter((id) => id !== item.id)
                    );
                  }}
                />
                {item.title}
              </label>
            ))}
        </div>
      ) : null}
      <Button
        loading={props.pending}
        disabled={!ready}
        title={ready ? undefined : gap}
        onClick={props.onComplete}
      >
        Ukończ z dowodem
      </Button>
    </div>
  );
}

function LinkList({
  goals,
  pending,
  onPick,
}: {
  goals: GoalItem[];
  pending: boolean;
  onPick: (goalId: string) => void;
}) {
  if (goals.length === 0) {
    return <p className="text-[14px] text-[var(--text-muted)]">Nie ma celu tego typu, który dałoby się podpiąć.</p>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {goals.map((goal) => (
        <li key={goal.id}>
          <button
            type="button"
            disabled={pending}
            onClick={() => onPick(goal.id)}
            className="w-full rounded-xl border border-white/10 px-3 py-2 text-left text-[14px] text-white hover:border-white/20"
          >
            {goal.title}
            <span className="mt-0.5 block text-[12px] text-[var(--text-subtle)]">
              {GOAL_STATUS_LABELS[goal.status]}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function buildRequirement(kind: ProofKind, label: string, optionsText: string): ProofRequirement {
  if (kind === "select") {
    const options = optionsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => ({ value: line, label: line }));
    return { kind, label, options };
  }
  if (kind === "scale") return { kind, label, min: 1, max: 5 };
  if (kind === "goal_set") return { kind, label, min_count: 1 };
  if (kind === "module_result") return { kind, label, module: "workflow" };
  return { kind, label };
}

function draftFrom(
  goal: GoalItem,
  fields: {
    proofText: string;
    proofNote: string;
    proofUrl: string;
    proofOption: string;
    proofScale: number;
    proofFile: string;
    proofFlow: string;
    proofGoals: string[];
  }
) {
  const kind = goal.proofRequirement.kind;
  switch (kind) {
    case "sentence":
    case "long_text":
      return { kind, text: fields.proofText };
    case "select":
      return { kind, option: fields.proofOption };
    case "scale":
      return { kind, scale: fields.proofScale };
    case "link":
      return { kind, url: fields.proofUrl, note: fields.proofNote };
    case "file":
      return { kind, fileId: fields.proofFile };
    case "module_result":
      return { kind, workflowId: fields.proofFlow };
    case "goal_set":
      return { kind, goalIds: fields.proofGoals };
    default:
      return { kind: "long_text" as const, text: fields.proofText };
  }
}

function previewSnapshot(
  goal: GoalItem,
  fields: {
    proofText: string;
    proofNote: string;
    proofUrl: string;
    proofOption: string;
    proofScale: number;
    proofFile: string;
    proofFlow: string;
    proofGoals: string[];
    files: LibraryPick[];
    workflows: WorkflowPick[];
  }
) {
  const kind = goal.proofRequirement.kind;
  if (kind === "sentence" || kind === "long_text") return { kind, text: fields.proofText };
  if (kind === "select") return { kind, option: fields.proofOption };
  if (kind === "scale") return { kind, scale: fields.proofScale };
  if (kind === "link") return { kind, url: fields.proofUrl, note: fields.proofNote };
  if (kind === "file") {
    const file = fields.files.find((item) => item.id === fields.proofFile);
    return file ? { kind, file: { path: file.path, name: file.name } } : null;
  }
  if (kind === "module_result") {
    const flow = fields.workflows.find((item) => item.id === fields.proofFlow);
    return flow
      ? { kind, module: "workflow", workflow_id: flow.id, version: flow.version }
      : null;
  }
  if (kind === "goal_set") return { kind, goal_ids: fields.proofGoals };
  return null;
}

function describeProof(goal: GoalItem) {
  const snap = goal.proofSnapshot;
  if (!snap) return "Brak zapisanego dowodu.";
  if (snap.text) return snap.text;
  if (snap.url) return `${snap.url} — ${snap.note ?? ""}`;
  if (snap.file) return snap.file.name;
  if (snap.title) return `${snap.title}, wersja ${snap.version ?? ""}`;
  if (snap.option) return snap.option;
  if (typeof snap.scale === "number") return String(snap.scale);
  if (snap.goal_ids) return `${snap.goal_ids.length} celów`;
  return "Dowód zapisany.";
}

function eventLabel(kind: string, payload: Record<string, unknown>) {
  if (kind === "created") return "Cel zapisany";
  if (kind === "reopened") return "Otwarto ponownie";
  if (kind === "archived") return "Zarchiwizowano";
  if (kind === "proof") return "Zapisano dowód";
  if (kind === "deadline") return `Termin: ${String(payload.due_date ?? "")}`;
  if (kind === "owner") return "Zmieniono właściciela";
  if (kind === "status") {
    const to = payload.to;
    const label = typeof to === "string" && to in GOAL_STATUS_LABELS
      ? GOAL_STATUS_LABELS[to as GoalStatus]
      : String(to ?? "");
    return `Status: ${label}`;
  }
  return "Zmiana";
}

function toneFor(status: GoalStatus) {
  if (status === "completed") return "success" as const;
  if (status === "blocked") return "danger" as const;
  if (status === "awaiting_proof") return "warning" as const;
  if (status === "in_progress") return "info" as const;
  return "neutral" as const;
}

function formatDay(iso: string) {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}
