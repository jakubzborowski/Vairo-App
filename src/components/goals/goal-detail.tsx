"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Archive,
  ArrowLeft,
  ChevronDown,
  CircleCheck,
  Copy,
  History,
  Link2,
  Lock,
  OctagonAlert,
  Paperclip,
  Pencil,
  Plus,
  RotateCcw,
  StickyNote,
  X,
} from "lucide-react";
import {
  addGoalMaterial,
  archiveGoal,
  completeGoal,
  createTask,
  linkGoal,
  removeGoalMaterial,
  reopenGoal,
  unarchiveGoal,
  unlinkGoal,
  updateGoal,
  updateTask,
} from "@/app/app/goals/actions";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Menu, MenuItem, MenuSeparator } from "@/components/ui/menu";
import { MenuSelect } from "@/components/ui/menu-select";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { canAssignToOthers, canChangeOwnWork, type StartupRole } from "@/types/startup";
import {
  GOAL_STATUS_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type GoalItem,
  type GoalStatus,
  type GoalTypeOption,
  type LibraryPick,
  type MilestoneCondition,
  type ProofDraft,
  type TaskStatus,
  type TeamMemberOption,
  type WorkflowPick,
} from "@/types/goals";
import { GoalEditForm } from "./goal-edit-form";
import {
  allTasksDone,
  formatDay,
  formatDayLong,
  formatMoment,
  plural,
  proofKindWord,
} from "./goal-format";
import { ProofModal } from "./proof-modal";
import { StatusBadge, StatusIcon, StatusTriggerContent } from "./status";

type Result = { error: string | null; id?: string };

/** Statusy, które da się ustawić ręcznie. „Ukończony" daje tylko dowód. */
const MANUAL_STATUSES: GoalStatus[] = ["todo", "in_progress", "blocked", "awaiting_proof"];

/**
 * Szczegół celu — strona, nie okno.
 *
 * Da się go podlinkować, czyta się go jak dokument i na telefonie nie ma
 * okna w oknie. Domyślnie wszystko jest tekstem; formularz pojawia się
 * dopiero po „Edytuj". Poza trybem edycji każdy klik jest zamkniętą akcją
 * (status, zadanie, materiał): wykonuje się od razu i kończy toastem. Nie ma
 * pól, które po cichu czekają na zapis.
 */
export function GoalDetail({
  goal,
  goals,
  conditions,
  files,
  workflows,
  documents = [],
  members,
  goalTypes,
  startupId,
  userId,
  role,
}: {
  goal: GoalItem;
  goals: GoalItem[];
  conditions: MilestoneCondition[];
  files: LibraryPick[];
  workflows: WorkflowPick[];
  documents?: { id: string; title: string; body: string }[];
  members: TeamMemberOption[];
  goalTypes: GoalTypeOption[];
  startupId: string;
  userId: string;
  role: StartupRole;
}) {
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const [proofOpen, setProofOpen] = useState(false);
  const [proofError, setProofError] = useState<string | null>(null);
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockError, setBlockError] = useState<string | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const archived = Boolean(goal.archivedAt);
  const completed = goal.status === "completed";
  const owns = canChangeOwnWork(role, userId, goal.ownerId);
  const editable = owns && !archived;
  const canAssign = canAssignToOthers(role);

  const linkable = conditions.filter(
    (condition) =>
      (condition.matchAnyType || condition.goalTypeId === goal.goalTypeId) &&
      !condition.linkedGoalIds.includes(goal.id) &&
      condition.done < condition.minCount
  );

  /** Akcja z toastem. Błąd zostaje w toaście, który nie znika sam. */
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

  const setStatus = (status: GoalStatus) => {
    if (status === goal.status) return;
    if (status === "blocked") {
      setBlockError(null);
      setBlockOpen(true);
      return;
    }
    run(
      () => updateGoal({ startupId, goalId: goal.id, status }),
      `Status: ${GOAL_STATUS_LABELS[status]}`
    );
  };

  const blockedEvent = goal.events.find(
    (event) => event.kind === "status" && event.payload.to === "blocked"
  );

  return (
    <div className="page">
      <Link
        href="/app/goals"
        className="inline-flex min-h-11 items-center gap-1.5 text-[13px] text-[var(--text-subtle)] transition-colors hover:text-white sm:min-h-0"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Cele
      </Link>

      {!editable && !archived ? (
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-white/[0.08] bg-[var(--surface)] px-4 py-3 text-[13px] leading-relaxed text-[var(--text-muted)]">
          <Lock className="mt-0.5 size-3.5 shrink-0 text-[var(--text-subtle)]" aria-hidden="true" />
          Tylko do odczytu. Ten cel zmienia {goal.ownerName}, Founder albo Admin. Własne
          zadania możesz prowadzić normalnie.
        </p>
      ) : null}

      {archived ? (
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-white/[0.08] bg-[var(--surface)] px-4 py-3 text-[13px] leading-relaxed text-[var(--text-muted)]">
          <Archive className="mt-0.5 size-3.5 shrink-0 text-[var(--text-subtle)]" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            Zarchiwizowany {formatDay(goal.archivedAt)}. Nie liczy się do etapu, dopóki go
            nie przywrócisz.
          </span>
          {owns ? (
            <Button
              size="sm"
              variant="secondary"
              loading={pending}
              onClick={() => run(() => unarchiveGoal(startupId, goal.id), "Cel przywrócony")}
            >
              Przywróć
            </Button>
          ) : null}
        </p>
      ) : null}

      <header className="mt-3 flex items-start justify-between gap-3">
        <h1 className="min-w-0 font-heading text-[1.65rem] font-semibold leading-tight text-white">
          {goal.title}
        </h1>
        {!editing ? (
          <div className="flex shrink-0 items-center gap-1">
            {!completed && !archived ? (
              <Button
                variant="secondary"
                size="sm"
                disabled={!editable}
                title={editable ? undefined : "Edytować cudzy cel może Founder albo Admin."}
                onClick={() => setEditing(true)}
              >
                {editable ? <Pencil className="size-3.5" /> : <Lock className="size-3.5" />}
                Edytuj
              </Button>
            ) : null}
            <Menu label="Więcej akcji">
              {(close) => (
                <>
                  {editable && linkable.length > 0 ? (
                    <MenuItem
                      icon={Link2}
                      onClick={() => {
                        close();
                        setLinkOpen(true);
                      }}
                    >
                      Podepnij do warunku etapu
                    </MenuItem>
                  ) : null}
                  <MenuItem
                    icon={Copy}
                    onClick={() => {
                      close();
                      void navigator.clipboard
                        ?.writeText(window.location.href)
                        .then(() => toast({ title: "Link do celu skopiowany" }))
                        .catch(() =>
                          toast({
                            tone: "error",
                            title: "Nie udało się skopiować linku",
                            description: "Skopiuj adres z paska przeglądarki.",
                          })
                        );
                    }}
                  >
                    Kopiuj link do celu
                  </MenuItem>
                  {completed && editable ? (
                    <MenuItem
                      icon={RotateCcw}
                      hint="Wraca do pracy. Dowód zostaje, ale cel przestaje się liczyć, dopóki znów go nie ukończycie."
                      onClick={() => {
                        close();
                        run(() => reopenGoal(startupId, goal.id), "Cel otwarty ponownie");
                      }}
                    >
                      Otwórz ponownie
                    </MenuItem>
                  ) : null}
                  {editable ? (
                    <>
                      <MenuSeparator />
                      <MenuItem
                        icon={Archive}
                        tone="danger"
                        hint="Zniknie z listy i przestanie liczyć się do etapu."
                        onClick={() => {
                          close();
                          setArchiveOpen(true);
                        }}
                      >
                        Archiwizuj
                      </MenuItem>
                    </>
                  ) : null}
                </>
              )}
            </Menu>
          </div>
        ) : null}
      </header>

      {!editing ? (
        <Facts
          goal={goal}
          editable={editable}
          canLink={editable && linkable.length > 0}
          conditions={conditions}
          pending={pending}
          onStatus={setStatus}
          onLink={() => setLinkOpen(true)}
          onUnlink={(conditionId) =>
            run(() => unlinkGoal(startupId, goal.id, conditionId), "Cel odpięty od warunku")
          }
        />
      ) : null}

      {editing ? (
        <GoalEditForm
          goal={goal}
          members={members}
          goalTypes={goalTypes}
          conditions={conditions}
          canAssign={canAssign}
          startupId={startupId}
          onDone={() => setEditing(false)}
        />
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {goal.needsReassign ? (
            <Notice tone="danger">
              Poprzednia osoba odeszła z teamu. {canAssign
                ? "Wskaż nowego właściciela w „Edytuj”."
                : "Nowego właściciela wskaże Founder albo Admin."}
            </Notice>
          ) : null}

          {goal.status === "blocked" && !archived ? (
            <section className="rounded-[18px] border border-[var(--danger)]/25 bg-[var(--danger)]/[0.07] p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <OctagonAlert className="mt-0.5 size-5 shrink-0 text-[var(--danger)]" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium text-white">
                    {goal.blockerNote || "Nie opisano, co blokuje pracę."}
                  </p>
                  {blockedEvent ? (
                    <p className="mt-1 text-[12.5px] text-[var(--text-subtle)]">
                      Zablokowane {formatDay(blockedEvent.createdAt)}
                      {blockedEvent.actorName ? ` · ${blockedEvent.actorName}` : ""}
                    </p>
                  ) : null}
                </div>
                {editable ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={pending}
                    onClick={() =>
                      run(
                        () =>
                          updateGoal({
                            startupId,
                            goalId: goal.id,
                            status: "in_progress",
                            blockerNote: null,
                          }),
                        "Praca wznowiona"
                      )
                    }
                  >
                    Wznów pracę
                  </Button>
                ) : null}
              </div>
            </section>
          ) : null}

          {completed ? (
            <Achieved goal={goal} />
          ) : archived ? null : (
            <NextMove
              goal={goal}
              editable={editable}
              onProof={() => {
                setProofError(null);
                setProofOpen(true);
              }}
            />
          )}

          <Tasks
            goal={goal}
            startupId={startupId}
            userId={userId}
            role={role}
            archived={archived}
            run={run}
            pending={pending}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Materials
              goal={goal}
              files={files}
              editable={editable}
              startupId={startupId}
              run={run}
              pending={pending}
            />
            <Timeline goal={goal} />
          </div>
        </div>
      )}

      {proofOpen ? (
        <ProofModal
          goal={goal}
          goals={goals}
          files={files}
          workflows={workflows}
          documents={documents}
          pending={pending}
          error={proofError}
          onClose={() => setProofOpen(false)}
          onSubmit={(proof: ProofDraft) => {
            setProofError(null);
            start(async () => {
              const result = await completeGoal({ startupId, goalId: goal.id, proof });
              if (result.error) {
                setProofError(result.error);
                return;
              }
              setProofOpen(false);
              toast({
                title: "Cel ukończony",
                description:
                  goal.conditions.length > 0
                    ? "Dowód zapisany. Cel liczy się teraz do etapu."
                    : "Dowód zapisany jako kopia.",
              });
            });
          }}
        />
      ) : null}

      {blockOpen ? (
        <BlockModal
          initial={goal.blockerNote ?? ""}
          pending={pending}
          error={blockError}
          onClose={() => setBlockOpen(false)}
          onSubmit={(note) => {
            setBlockError(null);
            start(async () => {
              const result = await updateGoal({
                startupId,
                goalId: goal.id,
                status: "blocked",
                blockerNote: note,
              });
              if (result.error) {
                setBlockError(result.error);
                return;
              }
              setBlockOpen(false);
              toast({ title: "Status: Zablokowany", description: note });
            });
          }}
        />
      ) : null}

      {linkOpen ? (
        <Modal
          title="Podepnij do warunku etapu"
          description={`Cel typu ${goal.goalTypeLabel} pasuje do tych warunków.`}
          onClose={() => setLinkOpen(false)}
        >
          <ul className="flex flex-col gap-2">
            {linkable.map((condition) => (
              <li key={condition.id}>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    run(
                      () => linkGoal(startupId, goal.id, condition.id),
                      "Cel podpięty",
                      () => setLinkOpen(false)
                    )
                  }
                  className="flex w-full flex-col rounded-2xl border border-white/[0.08] bg-[var(--surface)] px-4 py-3 text-left transition-colors hover:border-white/20 disabled:opacity-60"
                >
                  <span className="text-[14px] font-medium text-white">{condition.subpointTitle}</span>
                  <span className="mt-0.5 text-[12.5px] text-[var(--text-subtle)]">
                    {condition.stageTitle} · {condition.done} z {condition.minCount}{" "}
                    {plural(condition.minCount, "celu", "celów", "celów")} gotowe
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="text-[12.5px] leading-relaxed text-[var(--text-subtle)]">
            Podpięty cel zacznie się liczyć do etapu, gdy będzie ukończony z dowodem.
          </p>
        </Modal>
      ) : null}

      {archiveOpen ? (
        <Modal
          title="Zarchiwizować ten cel?"
          description="Zniknie z list i przestanie liczyć się do etapu. Znajdziesz go pod „Pokaż zarchiwizowane” i stamtąd przywrócisz."
          onClose={() => setArchiveOpen(false)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setArchiveOpen(false)}>
                Zostaw
              </Button>
              <Button
                variant="danger"
                loading={pending}
                onClick={() =>
                  run(
                    () => archiveGoal(startupId, goal.id),
                    "Cel zarchiwizowany",
                    () => setArchiveOpen(false)
                  )
                }
              >
                Archiwizuj
              </Button>
            </>
          }
        >
          <p className="text-[14px] text-white">{goal.title}</p>
        </Modal>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */

/** Jedno zdanie faktów zamiast czterech kafelków. */
function Facts({
  goal,
  editable,
  canLink,
  conditions,
  pending,
  onStatus,
  onLink,
  onUnlink,
}: {
  goal: GoalItem;
  editable: boolean;
  canLink: boolean;
  conditions: MilestoneCondition[];
  pending: boolean;
  onStatus: (status: GoalStatus) => void;
  onLink: () => void;
  onUnlink: (conditionId: string) => void;
}) {
  const completed = goal.status === "completed";
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13.5px] text-[var(--text-muted)]">
      <span className="inline-flex items-center gap-2">
        <Avatar name={goal.ownerName} size="xs" />
        {goal.ownerName} odpowiada
      </span>

      {editable && !completed ? (
        <Menu
          label={`Status: ${GOAL_STATUS_LABELS[goal.status]}. Zmień`}
          align="left"
          disabled={pending}
          trigger={<StatusTriggerContent status={goal.status} />}
        >
          {(close) => (
            <>
              {MANUAL_STATUSES.map((status) => (
                <MenuItem
                  key={status}
                  onClick={() => {
                    close();
                    onStatus(status);
                  }}
                >
                  <span className="inline-flex items-center gap-2">
                    <StatusIcon status={status} className="size-4" />
                    {GOAL_STATUS_LABELS[status]}
                    {status === goal.status ? (
                      <span className="text-[12px] text-[var(--text-subtle)]">· teraz</span>
                    ) : null}
                  </span>
                </MenuItem>
              ))}
              <MenuSeparator />
              <p className="px-3.5 py-2 text-[12px] leading-snug text-[var(--text-subtle)]">
                „Ukończony” ustawia dowód, nie lista.
              </p>
            </>
          )}
        </Menu>
      ) : (
        <StatusBadge status={goal.status} />
      )}

      <span className={cn(goal.overdue && "font-medium text-[var(--warning)]")}>
        {completed
          ? `Ukończony ${formatDay(goal.completedAt)}${
              goal.completedAt && goal.completedAt.slice(0, 10) <= goal.dueDate ? ", w terminie" : ""
            }`
          : goal.overdue
            ? `Termin minął ${formatDay(goal.dueDate)}`
            : `do ${formatDayLong(goal.dueDate)}`}
      </span>

      <span>{goal.goalTypeLabel}</span>

      {goal.conditions.length > 0 ? (
        goal.conditions.map((condition) => (
          <span key={condition.id} className="inline-flex items-center gap-1.5">
            <span className={cn(condition.counts ? "text-[var(--success)]" : "text-[var(--text-muted)]")}>
              {condition.counts ? "Liczy się do:" : "Podpięty do:"}{" "}
              {(() => {
                // Z karty celu da się wrócić do podpunktu, któremu służy.
                const source = conditions.find((item) => item.id === condition.id);
                return source ? (
                  <Link
                    href={`/app/stage?${source.stageKey ? `stage=${source.stageKey}&` : ""}subpoint=${source.subpointId}`}
                    className="underline decoration-white/30 underline-offset-4 hover:decoration-white"
                  >
                    {condition.subpointTitle}
                  </Link>
                ) : (
                  condition.subpointTitle
                );
              })()}
            </span>
            {editable && !completed ? (
              <button
                type="button"
                onClick={() => onUnlink(condition.id)}
                disabled={pending}
                aria-label={`Odepnij od: ${condition.subpointTitle}`}
                title="Odepnij od warunku"
                className="inline-flex size-6 items-center justify-center rounded-md text-[var(--text-subtle)] hover:bg-white/[0.06] hover:text-white"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </span>
        ))
      ) : (
        <span>
          Nie liczy się jeszcze do etapu
          {canLink ? (
            <>
              {" · "}
              <button
                type="button"
                onClick={onLink}
                className="font-medium text-white underline decoration-white/30 underline-offset-4 hover:decoration-white"
              >
                Podepnij
              </button>
            </>
          ) : null}
        </span>
      )}
    </div>
  );
}

function Notice({ tone, children }: { tone: "danger"; children: React.ReactNode }) {
  return (
    <p
      className={cn(
        "rounded-xl px-4 py-3 text-[13.5px] leading-relaxed",
        tone === "danger" && "border border-[var(--danger)]/25 bg-[var(--danger)]/[0.07] text-[var(--danger-text)]"
      )}
    >
      {children}
    </p>
  );
}

/** Karta „Co dalej" — jedyna ciepła powierzchnia i jedyny pomarańcz strony. */
function NextMove({
  goal,
  editable,
  onProof,
}: {
  goal: GoalItem;
  editable: boolean;
  onProof: () => void;
}) {
  return (
    <section className="edge-accent topo overflow-hidden rounded-[22px] border border-[var(--vairo)]/25 bg-[var(--vairo)]/[0.06] p-5 sm:p-6">
      <h2 className="font-heading text-[1.3rem] font-semibold leading-snug text-white">
        Dodaj dowód, żeby ukończyć cel
      </h2>
      <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[var(--text-muted)]">
        {goal.overdue ? "Termin minął, ale dowód dodany teraz nadal się liczy. " : ""}
        {allTasksDone(goal)
          ? "Zadania są zrobione — brakuje już tylko dowodu."
          : "Zadania nie muszą być skończone — cel kończy wynik."}
      </p>
      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-white/[0.07] bg-[var(--bg)]/60 p-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <p className="text-[12px] text-[var(--text-subtle)]">
            Czego oczekujecie · {proofKindWord(goal.proofRequirement.kind)}
          </p>
          <p className="mt-0.5 text-[14.5px] text-white">{goal.proofRequirement.label}</p>
        </div>
        {editable ? (
          <Button onClick={onProof} className="w-full sm:w-auto">
            <Plus className="size-4" />
            Dodaj dowód
          </Button>
        ) : (
          <div className="flex flex-col gap-1 sm:items-end">
            <Button disabled variant="secondary" className="w-full sm:w-auto">
              <Lock className="size-4" />
              Dodaj dowód
            </Button>
            <span className="text-[12px] text-[var(--text-subtle)]">
              Dowód dodaje {goal.ownerName}, Founder albo Admin.
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

/** Ukończenie to chwila, którą widać: zielona karta i dowód jako cytat. */
function Achieved({ goal }: { goal: GoalItem }) {
  const snap = goal.proofSnapshot;
  return (
    <section className="rounded-[22px] border border-[var(--success)]/25 bg-[var(--success)]/[0.07] p-5 sm:p-6">
      <p className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--success)]">
        <CircleCheck className="size-4" aria-hidden="true" />
        Cel osiągnięty
      </p>
      <p className="mt-3 text-[12px] text-[var(--text-subtle)]">Wasz dowód</p>
      <ProofValue goal={goal} />
      {snap?.captured_at ? (
        <p className="mt-2 text-[12.5px] text-[var(--text-subtle)]">
          Zatwierdzona kopia · {formatMoment(snap.captured_at)}
        </p>
      ) : null}
      <p className="mt-3 text-[13px] leading-relaxed text-[var(--text-muted)]">
        Oczekiwanie było: {goal.proofRequirement.label}
      </p>
      {goal.conditions.some((condition) => condition.counts) ? (
        <div className="mt-4 border-t border-white/[0.07] pt-3">
          {goal.conditions
            .filter((condition) => condition.counts)
            .map((condition) => (
              <p key={condition.id} className="text-[13.5px] text-white">
                Liczy się do etapu: {condition.subpointTitle}
                <span className="text-[var(--text-subtle)]">
                  {" "}
                  · {condition.done} z {condition.minCount}
                </span>
              </p>
            ))}
        </div>
      ) : null}
    </section>
  );
}

function ProofValue({ goal }: { goal: GoalItem }) {
  const snap = goal.proofSnapshot;
  if (!snap) {
    return <p className="mt-1 text-[14px] text-[var(--text-muted)]">Brak zapisanego dowodu.</p>;
  }
  if (snap.url) {
    return (
      <p className="mt-1 text-[15px] text-white">
        <a
          href={snap.url}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all underline decoration-white/30 underline-offset-4 hover:decoration-white"
        >
          {snap.url}
        </a>
        {snap.note ? <span className="text-[var(--text-muted)]"> — {snap.note}</span> : null}
      </p>
    );
  }
  const text = snap.text
    ? `„${snap.text}”`
    : snap.file
      ? snap.file.name
      : snap.title
        ? `${snap.title}, wersja ${snap.version ?? ""}`
        : snap.option
          ? (goal.proofRequirement.options?.find((item) => item.value === snap.option)?.label ?? snap.option)
          : typeof snap.scale === "number"
            ? `${snap.scale} z ${goal.proofRequirement.max ?? 5}`
            : snap.goal_ids
              ? `${snap.goal_ids.length} ${plural(snap.goal_ids.length, "ukończony cel", "ukończone cele", "ukończonych celów")}`
              : "Dowód zapisany.";
  return <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed text-white">{text}</p>;
}

/* ------------------------------------------------------------------ */

function Tasks({
  goal,
  startupId,
  userId,
  role,
  archived,
  run,
  pending,
}: {
  goal: GoalItem;
  startupId: string;
  userId: string;
  role: StartupRole;
  archived: boolean;
  run: (work: () => Promise<Result>, success: string, after?: () => void) => void;
  pending: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);
  const canAssign = canAssignToOthers(role);
  const ownGoal = canChangeOwnWork(role, userId, goal.ownerId);
  const done = goal.tasks.filter((task) => task.status === "done").length;
  const total = goal.tasks.length;

  const add = () => {
    if (title.trim().length < 2) {
      setTitleError("Napisz, co jest do zrobienia.");
      return;
    }
    const value = title.trim();
    run(
      () =>
        createTask({
          startupId,
          goalId: goal.id,
          title: value,
          ownerId: canAssign ? goal.ownerId || userId : userId,
        }),
      "Zadanie dodane",
      () => {
        setTitle("");
        setTitleError(null);
      }
    );
  };

  return (
    <section
      id="zadania"
      className="scroll-mt-6 rounded-[18px] border border-white/[0.07] bg-[var(--surface)] p-4 lift-1 sm:p-5"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h2 className="font-heading text-[15px] font-semibold text-white">Zadania</h2>
        {total > 0 ? (
          <>
            <span className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
              <span
                className="block h-full rounded-full bg-[var(--success)]"
                style={{ width: `${Math.round((done / total) * 100)}%` }}
              />
            </span>
            <span className="tabular text-[12.5px] text-[var(--text-subtle)]">
              {done} z {total} zrobione
            </span>
          </>
        ) : null}
      </div>

      {total === 0 ? (
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-subtle)]">
          Rozpisz, co trzeba zrobić, żeby dojść do wyniku. Zadania pomagają — cel i tak
          kończy dowód.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col">
          {goal.tasks.map((task) => {
            const canChange = !archived && canChangeOwnWork(role, userId, task.ownerId);
            const taskDone = task.status === "done";
            return (
              <li
                key={task.id}
                className="flex min-h-12 items-center gap-3 border-t border-white/[0.06] py-2 first:border-t-0"
              >
                {canChange ? (
                  <Menu
                    label={`Status zadania: ${TASK_STATUS_LABELS[task.status]}. Zmień`}
                    align="left"
                    disabled={pending}
                    triggerClassName="size-9 justify-center sm:size-8"
                    trigger={<StatusIcon status={task.status} task />}
                  >
                    {(close) =>
                      TASK_STATUSES.map((status) => (
                        <MenuItem
                          key={status}
                          onClick={() => {
                            close();
                            if (status === task.status) return;
                            run(
                              () =>
                                updateTask({
                                  startupId,
                                  taskId: task.id,
                                  status: status as TaskStatus,
                                }),
                              `Zadanie: ${TASK_STATUS_LABELS[status].toLowerCase()}`
                            );
                          }}
                        >
                          <span className="inline-flex items-center gap-2">
                            <StatusIcon status={status} task className="size-4" />
                            {TASK_STATUS_LABELS[status]}
                          </span>
                        </MenuItem>
                      ))
                    }
                  </Menu>
                ) : (
                  <span className="inline-flex size-9 items-center justify-center sm:size-8" title={TASK_STATUS_LABELS[task.status]}>
                    <StatusIcon status={task.status} task />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block text-[14px]",
                      taskDone ? "text-[var(--text-subtle)] line-through" : "text-white"
                    )}
                  >
                    {task.title}
                  </span>
                  {task.needsReassign ? (
                    <span className="block text-[12px] text-[var(--danger-text)]">
                      Osoba odeszła z teamu — zadanie czeka na przypisanie.
                    </span>
                  ) : null}
                </span>
                <span className="hidden shrink-0 text-[12.5px] text-[var(--text-subtle)] sm:inline">
                  {task.dueDate ? `do ${formatDay(task.dueDate)}` : ""}
                </span>
                <Avatar name={task.ownerName} size="xs" />
              </li>
            );
          })}
        </ul>
      )}

      {total > 0 && done === total && goal.status !== "completed" ? (
        <p className="mt-2 text-[12.5px] text-[var(--text-subtle)]">
          Zadania są zrobione. Cel i tak czeka na dowód.
        </p>
      ) : null}

      {archived ? null : adding ? (
        <form
          className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start"
          onSubmit={(event) => {
            event.preventDefault();
            add();
          }}
        >
          <Field error={titleError} className="flex-1">
            {({ id, invalid }) => (
              <Input
                id={id}
                aria-invalid={invalid}
                aria-label="Nowe zadanie"
                autoFocus
                value={title}
                maxLength={200}
                onChange={(event) => setTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setAdding(false);
                }}
                placeholder="Co jest do zrobienia?"
              />
            )}
          </Field>
          <div className="flex gap-2">
            <Button type="submit" variant="secondary" loading={pending}>
              Dodaj
            </Button>
            <Button type="button" variant="ghost" onClick={() => setAdding(false)}>
              Anuluj
            </Button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-lg text-[13.5px] text-[var(--text-muted)] transition-colors hover:text-white"
        >
          <span className="inline-flex size-5 items-center justify-center rounded-full border border-dashed border-white/25">
            <Plus className="size-3" aria-hidden="true" />
          </span>
          {ownGoal || canAssign ? "Dodaj zadanie" : "Dodaj sobie zadanie"}
        </button>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */

type MaterialKind = "note" | "link" | "file";

function Materials({
  goal,
  files,
  editable,
  startupId,
  run,
  pending,
}: {
  goal: GoalItem;
  files: LibraryPick[];
  editable: boolean;
  startupId: string;
  run: (work: () => Promise<Result>, success: string, after?: () => void) => void;
  pending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<MaterialKind>("note");
  const [value, setValue] = useState("");
  const [fileId, setFileId] = useState(files[0]?.id ?? "");
  const count = goal.materials.length;

  const add = () => {
    const body = value.trim();
    run(
      () =>
        kind === "file"
          ? addGoalMaterial({ startupId, goalId: goal.id, kind, fileId })
          : kind === "link"
            ? addGoalMaterial({ startupId, goalId: goal.id, kind, url: body })
            : addGoalMaterial({ startupId, goalId: goal.id, kind, body }),
      "Materiał dodany",
      () => setValue("")
    );
  };

  return (
    <Collapsible
      icon={Paperclip}
      title="Materiały robocze"
      summary={
        count > 0
          ? `${count} ${plural(count, "materiał", "materiały", "materiałów")}`
          : "Notatki, linki i pliki po drodze"
      }
      open={open}
      onToggle={() => setOpen((value) => !value)}
    >
      <p className="text-[12.5px] leading-relaxed text-[var(--text-subtle)]">
        Wszystko, co powstaje po drodze. To jeszcze nie dowód — dowód zatwierdza się
        wyżej i zostaje jako osobna kopia.
      </p>
      {count > 0 ? (
        <ul className="mt-3 flex flex-col gap-1.5">
          {goal.materials.map((item) => {
            const Icon = item.kind === "link" ? Link2 : item.kind === "file" ? Paperclip : StickyNote;
            return (
              <li key={item.id} className="flex items-start gap-2 text-[13.5px] text-[var(--text-muted)]">
                <Icon className="mt-0.5 size-3.5 shrink-0 text-[var(--text-subtle)]" aria-hidden="true" />
                <span className="min-w-0 flex-1 break-words">
                  {item.kind === "link" && item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white underline decoration-white/25 underline-offset-4 hover:decoration-white"
                    >
                      {item.url}
                    </a>
                  ) : item.kind === "file" ? (
                    item.fileName
                  ) : (
                    item.body
                  )}
                </span>
                {editable ? (
                  <button
                    type="button"
                    disabled={pending}
                    aria-label="Usuń materiał"
                    onClick={() =>
                      run(() => removeGoalMaterial(startupId, item.id), "Materiał usunięty")
                    }
                    className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-[var(--text-subtle)] hover:bg-white/[0.06] hover:text-white"
                  >
                    <X className="size-3.5" />
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      {editable ? (
        <div className="mt-3 flex flex-col gap-2">
          <div role="radiogroup" aria-label="Rodzaj materiału" className="inline-flex w-fit rounded-lg bg-[var(--surface-2)] p-0.5">
            {(
              [
                ["note", "Notatka"],
                ["link", "Link"],
                ["file", "Plik"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={kind === id}
                onClick={() => setKind(id)}
                className={cn(
                  "h-8 rounded-md px-2.5 text-[12.5px] font-medium transition-colors",
                  kind === id ? "bg-[var(--surface-3)] text-white" : "text-[var(--text-muted)] hover:text-white"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {kind === "file" ? (
            files.length > 0 ? (
              <MenuSelect
                ariaLabel="Plik z biblioteki"
                value={fileId}
                onChange={setFileId}
                options={files.map((file) => ({ value: file.id, label: file.name }))}
              />
            ) : (
              <p className="text-[12.5px] text-[var(--text-subtle)]">
                Biblioteka jest pusta. Pliki dodasz w{" "}
                <Link href="/app/files" className="text-white underline underline-offset-4">
                  Plikach
                </Link>
                .
              </p>
            )
          ) : (
            <Input
              aria-label={kind === "link" ? "Adres" : "Notatka"}
              value={value}
              inputMode={kind === "link" ? "url" : undefined}
              placeholder={kind === "link" ? "https://" : "Krótka notatka"}
              onChange={(event) => setValue(event.target.value)}
            />
          )}
          <Button
            size="sm"
            variant="secondary"
            className="w-fit"
            loading={pending}
            disabled={kind === "file" && files.length === 0}
            onClick={add}
          >
            Dodaj materiał
          </Button>
        </div>
      ) : null}
    </Collapsible>
  );
}

function Timeline({ goal }: { goal: GoalItem }) {
  const [open, setOpen] = useState(false);
  const last = goal.events[0];
  return (
    <Collapsible
      icon={History}
      title={`Historia · ${goal.events.length} ${plural(goal.events.length, "wpis", "wpisy", "wpisów")}`}
      summary={last ? `Ostatnio: ${eventLabel(last.kind, last.payload).toLowerCase()}, ${formatDay(last.createdAt)}` : "Nic się jeszcze nie wydarzyło"}
      open={open}
      onToggle={() => setOpen((value) => !value)}
    >
      {goal.events.length === 0 ? (
        <p className="text-[13px] text-[var(--text-subtle)]">Brak wpisów.</p>
      ) : (
        <ol className="flex flex-col gap-3 border-l border-white/10 pl-4">
          {goal.events.map((event) => (
            <li key={event.id} className="relative">
              <span
                className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-white/30"
                aria-hidden="true"
              />
              <p className="text-[13.5px] text-white">{eventLabel(event.kind, event.payload)}</p>
              <p className="text-[12px] text-[var(--text-subtle)]">
                {formatMoment(event.createdAt)}
                {event.actorName ? ` · ${event.actorName}` : ""}
              </p>
            </li>
          ))}
        </ol>
      )}
    </Collapsible>
  );
}

function Collapsible({
  icon: Icon,
  title,
  summary,
  open,
  onToggle,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  summary: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="self-start rounded-[18px] border border-white/[0.07] bg-[var(--surface)]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-[18px] p-4 text-left transition-colors hover:bg-white/[0.02]"
      >
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-muted)]">
          <Icon className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-medium text-white">{title}</span>
          <span className="block truncate text-[12.5px] text-[var(--text-subtle)]">{summary}</span>
        </span>
        <ChevronDown
          className={cn("size-4 shrink-0 text-[var(--text-subtle)] transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      {open ? <div className="px-4 pb-4">{children}</div> : null}
    </section>
  );
}

function BlockModal({
  initial,
  pending,
  error,
  onSubmit,
  onClose,
}: {
  initial: string;
  pending: boolean;
  error: string | null;
  onSubmit: (note: string) => void;
  onClose: () => void;
}) {
  const [note, setNote] = useState(initial);
  const [missing, setMissing] = useState(false);
  return (
    <Modal
      title="Co blokuje pracę?"
      description="Jedno zdanie wystarczy. Zobaczy je cały zespół nad tym celem."
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Anuluj
          </Button>
          <Button
            loading={pending}
            onClick={() => {
              if (!note.trim()) {
                setMissing(true);
                return;
              }
              onSubmit(note.trim());
            }}
          >
            Oznacz jako zablokowany
          </Button>
        </>
      }
    >
      <Field error={missing && !note.trim() ? "Napisz, co blokuje pracę." : error}>
        {({ id, invalid }) => (
          <Textarea
            id={id}
            aria-invalid={invalid}
            aria-label="Co blokuje pracę"
            autoFocus
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Na przykład: czekamy na podpis po stronie firmy"
          />
        )}
      </Field>
    </Modal>
  );
}

function eventLabel(kind: string, payload: Record<string, unknown>) {
  if (kind === "created") return "Cel założony";
  if (kind === "reopened") return "Otwarty ponownie";
  if (kind === "archived") return "Zarchiwizowany";
  if (kind === "proof") return "Zatwierdzony dowód";
  if (kind === "deadline") {
    return typeof payload.due_date === "string"
      ? `Termin przesunięty na ${formatDayLong(payload.due_date)}`
      : "Zmiana terminu";
  }
  if (kind === "owner") return "Zmiana właściciela";
  if (kind === "status") {
    const to = payload.to;
    return typeof to === "string" && to in GOAL_STATUS_LABELS
      ? `Status: ${GOAL_STATUS_LABELS[to as GoalStatus]}`
      : "Zmiana statusu";
  }
  return "Zmiana";
}
