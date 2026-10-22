"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, ChevronRight, Flag, PartyPopper, Plus } from "lucide-react";
import { linkGoal } from "@/app/app/goals/actions";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyNote, EmptyState } from "@/components/ui/empty-state";
import { MenuSelect } from "@/components/ui/menu-select";
import { ModuleHeader, SectionLabel } from "@/components/ui/module-header";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { StartupRole } from "@/types/startup";
import {
  GOAL_STATUSES,
  GOAL_STATUS_LABELS,
  type GoalItem,
  type MilestoneCondition,
  type TeamMemberOption,
} from "@/types/goals";
import {
  formatDay,
  goalHint,
  plural,
  tasksLine,
  teamState,
  urgency,
} from "./goal-format";
import { GoalList, GoalRow } from "./goal-row";
import { LinkGoalModal } from "./link-goal-modal";
import { StatusChip } from "./status";

export type GoalsView = "now" | "all" | "stage";

/**
 * Lista celów — trzy widoki jednej strony.
 *
 * **Teraz** czyta się z góry na dół jak lista rzeczy do zrobienia: najpierw
 * jedna rzecz z etapu, potem moje sprawy, na końcu zespół i to, co już za
 * nami. **Wszystkie cele** to pełna lista z filtrami. **Etap** to mapa
 * warunków — wcześniej czternaście jednakowych wierszy nad listą celów
 * spychało cele pod zgięcie ekranu.
 *
 * Widok siedzi w adresie (`?view=`), żeby dało się wysłać komuś link, ale
 * przełączamy go bez wizyty na serwerze — dane są te same.
 */
export function GoalsScreen({
  startupId,
  userId,
  role,
  members,
  goals,
  conditions,
  initialView,
  initialLinkConditionId,
}: {
  startupId: string;
  userId: string;
  role: StartupRole;
  members: TeamMemberOption[];
  goals: GoalItem[];
  conditions: MilestoneCondition[];
  initialView: GoalsView;
  initialLinkConditionId: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [view, setView] = useState<GoalsView>(initialView);
  const [linkConditionId, setLinkConditionId] = useState<string | null>(initialLinkConditionId);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const active = useMemo(() => goals.filter((goal) => !goal.archivedAt), [goals]);
  const stage = useMemo(() => currentStage(conditions), [conditions]);
  const linkTarget = conditions.find((condition) => condition.id === linkConditionId) ?? null;

  const switchView = (next: GoalsView) => {
    setView(next);
    const url = next === "now" ? "/app/goals" : `/app/goals?view=${next}`;
    window.history.replaceState(null, "", url);
  };

  const openLink = (conditionId: string) => {
    setLinkError(null);
    setLinkConditionId(conditionId);
  };

  const createFor = (conditionId: string | null) =>
    router.push(conditionId ? `/app/goals/new?condition=${conditionId}` : "/app/goals/new");

  const mineOpen = active
    .filter((goal) => goal.status !== "completed" && goal.ownerId === userId)
    .sort((a, b) => urgency(a) - urgency(b));

  return (
    <div className="page-wide">
      <ModuleHeader
        title="Cele"
        subtitle={subtitleFor(view, stage, mineOpen.length, active.length)}
        action={
          <Button variant="secondary" href="/app/goals/new">
            <Plus className="size-4" />
            Nowy cel
          </Button>
        }
      >
        <Tabs
          view={view}
          onChange={switchView}
          allCount={active.length}
          stage={stage}
        />
      </ModuleHeader>

      <div className="mt-6">
        {view === "now" ? (
          <NowView
            userId={userId}
            goals={active}
            mineOpen={mineOpen}
            stage={stage}
            onLink={openLink}
            onCreate={createFor}
            onShowAll={() => switchView("all")}
          />
        ) : view === "all" ? (
          <AllView goals={goals} members={members} userId={userId} />
        ) : (
          <StageView stage={stage} goals={active} onLink={openLink} onCreate={createFor} />
        )}
      </div>

      {linkTarget ? (
        <LinkGoalModal
          condition={linkTarget}
          goals={goals}
          userId={userId}
          role={role}
          pending={pending}
          error={linkError}
          onClose={() => setLinkConditionId(null)}
          onCreate={() => createFor(linkTarget.id)}
          onPick={(goalId) => {
            setLinkError(null);
            start(async () => {
              const result = await linkGoal(startupId, goalId, linkTarget.id);
              if (result.error) {
                setLinkError(result.error);
                return;
              }
              setLinkConditionId(null);
              toast({
                title: "Cel podpięty",
                description: `Liczy się teraz do warunku „${linkTarget.subpointTitle}”.`,
              });
            });
          }}
        />
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */

type StageSummary = {
  title: string;
  conditions: MilestoneCondition[];
  done: number;
  /** Następny warunek bez żadnego celu — jedyna akcja główna ekranu. */
  next: MilestoneCondition | null;
} | null;

/**
 * Bieżący etap = etap z najwcześniejszym niedomkniętym warunkiem. Gdy
 * wszystkie są domknięte, pokazujemy ostatni — z samymi zielonymi kreskami.
 */
function currentStage(conditions: MilestoneCondition[]): StageSummary {
  if (conditions.length === 0) return null;
  const firstOpen = conditions.find((condition) => condition.done < condition.minCount);
  const title = (firstOpen ?? conditions[conditions.length - 1]!).stageTitle;
  const list = conditions.filter((condition) => condition.stageTitle === title);
  return {
    title,
    conditions: list,
    done: list.filter(isMet).length,
    next:
      list.find((condition) => !isMet(condition) && condition.linkedGoalIds.length === 0) ?? null,
  };
}

function isMet(condition: MilestoneCondition) {
  return condition.done >= condition.minCount;
}

function subtitleFor(view: GoalsView, stage: StageSummary, mine: number, all: number) {
  if (view === "stage") {
    return stage
      ? "Cel liczy się do etapu, gdy jest ukończony i podpięty do warunku."
      : "Ten etap nie ma warunków opartych na celach.";
  }
  if (view === "all") {
    return all === 0
      ? "Zespół nie ma jeszcze żadnego celu."
      : `${all} ${plural(all, "cel", "cele", "celów")} zespołu, od najbliższego terminu.`;
  }
  const parts: string[] = [];
  if (stage?.next) parts.push("Jedna rzecz na teraz");
  if (mine > 0) {
    parts.push(`${mine} ${plural(mine, "cel czeka", "cele czekają", "celów czeka")} na Ciebie`);
  }
  if (parts.length === 0) return "Nic nie czeka na Ciebie. Zobacz, co robi zespół.";
  return `${parts.join(" i ")}.`;
}

/* ------------------------------------------------------------------ */

function Tabs({
  view,
  onChange,
  allCount,
  stage,
}: {
  view: GoalsView;
  onChange: (view: GoalsView) => void;
  allCount: number;
  stage: StageSummary;
}) {
  const tabs: { id: GoalsView; label: string; count?: string }[] = [
    { id: "now", label: "Teraz" },
    { id: "all", label: "Wszystkie cele", count: String(allCount) },
    ...(stage
      ? [{ id: "stage" as const, label: "Etap", count: `${stage.done}/${stage.conditions.length}` }]
      : []),
  ];
  return (
    <div
      role="tablist"
      aria-label="Widok celów"
      className="inline-flex rounded-xl border border-white/[0.08] bg-[var(--surface)] p-1"
    >
      {tabs.map((tab) => {
        const on = tab.id === view;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(tab.id)}
            className={cn(
              "inline-flex h-11 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-colors sm:h-8",
              on
                ? "bg-[var(--surface-3)] text-white"
                : "text-[var(--text-muted)] hover:text-white"
            )}
          >
            {tab.label}
            {tab.count ? (
              <span className="tabular text-[12px] font-normal text-[var(--text-subtle)]">
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function NowView({
  userId,
  goals,
  mineOpen,
  stage,
  onLink,
  onCreate,
  onShowAll,
}: {
  userId: string;
  goals: GoalItem[];
  mineOpen: GoalItem[];
  stage: StageSummary;
  onLink: (conditionId: string) => void;
  onCreate: (conditionId: string | null) => void;
  onShowAll: () => void;
}) {
  const teamOpen = goals
    .filter((goal) => goal.status !== "completed" && goal.ownerId !== userId)
    .sort((a, b) => urgency(a) - urgency(b));
  const done = goals
    .filter((goal) => goal.status === "completed")
    .sort((a, b) => ((a.completedAt ?? "") < (b.completedAt ?? "") ? 1 : -1));

  if (goals.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        {stage ? <NextStepCard stage={stage} onLink={onLink} onCreate={onCreate} /> : null}
        <FirstVisit hasStage={Boolean(stage?.next)} onCreate={() => onCreate(null)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {stage ? <NextStepCard stage={stage} onLink={onLink} onCreate={onCreate} /> : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <section>
          <SectionLabel count={mineOpen.length}>Twoje cele</SectionLabel>
          {mineOpen.length === 0 ? (
            <EmptyNote className="mt-2">
              Żaden otwarty cel nie jest teraz na Tobie. Nowy założysz przyciskiem
              „Nowy cel” albo z karty wyżej.
            </EmptyNote>
          ) : (
            <ul className="mt-2 flex flex-col gap-2">
              {mineOpen.map((goal) => (
                <MineRow key={goal.id} goal={goal} />
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={onShowAll}
            className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-[13px] font-medium text-[var(--text-muted)] transition-colors hover:text-white sm:min-h-0"
          >
            Zobacz wszystkie cele zespołu ({goals.length})
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </button>
        </section>

        <div className="flex flex-col gap-6">
          <section>
            <SectionLabel count={teamOpen.length}>Co robi zespół</SectionLabel>
            {teamOpen.length === 0 ? (
              <EmptyNote className="mt-2">
                Reszta zespołu nie ma teraz otwartych celów.
              </EmptyNote>
            ) : (
              <ul className="mt-2 overflow-hidden rounded-[18px] border border-white/[0.07] bg-[var(--surface)] divide-y divide-white/[0.06]">
                {teamOpen.slice(0, 6).map((goal) => {
                  const state = teamState(goal);
                  return (
                    <li key={goal.id}>
                      <Link
                        href={`/app/goals/${goal.id}`}
                        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03]"
                      >
                        <Avatar name={goal.ownerName} size="xs" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-medium text-white">
                            {goal.title}
                          </span>
                          <span className="block truncate text-[12px] text-[var(--text-subtle)]">
                            {goal.ownerName} ·{" "}
                            <span className={cn(state.warning && "text-[var(--warning)]")}>
                              {state.text}
                            </span>
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {done.length > 0 ? (
            <section className="rounded-[18px] border border-[var(--success)]/20 bg-[var(--success)]/[0.06] px-4 py-3.5">
              <h2 className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-[var(--success)]">
                <PartyPopper className="size-3.5" aria-hidden="true" />
                Za Wami · {done.length} {plural(done.length, "cel", "cele", "celów")} z dowodem
              </h2>
              <ul className="mt-2 flex flex-col">
                {done.slice(0, 5).map((goal) => (
                  <li key={goal.id}>
                    <Link
                      href={`/app/goals/${goal.id}`}
                      className="flex min-h-11 items-center gap-2 text-[13.5px] text-[var(--text-muted)] transition-colors hover:text-white sm:min-h-9"
                    >
                      <Check className="size-3.5 shrink-0 text-[var(--success)]" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">{goal.title}</span>
                      <span className="tabular shrink-0 text-[12px] text-[var(--text-subtle)]">
                        {formatDay(goal.completedAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Wiersz „Twoje cele": jedno zdanie o tym, czego cel potrzebuje. */
function MineRow({ goal }: { goal: GoalItem }) {
  const hint = goalHint(goal);
  return (
    <li>
      <Link
        href={`/app/goals/${goal.id}`}
        className="group flex items-start gap-3.5 rounded-[18px] border border-white/[0.07] bg-[var(--surface)] p-4 lift-1 transition-colors hover:border-white/15"
      >
        <StatusChip status={goal.status} overdue={goal.overdue} />
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-medium leading-snug text-white">{goal.title}</span>
          <span
            className={cn(
              "mt-1 block text-[14px] leading-relaxed",
              hint.tone === "warning" && "text-[var(--warning)]",
              hint.tone === "danger" && "text-[var(--danger-text)]",
              hint.tone === "muted" && "text-[var(--text-muted)]",
              hint.tone === "success" && "text-[var(--success)]"
            )}
          >
            {hint.text}
          </span>
          <span className="mt-1.5 block text-[12.5px] text-[var(--text-subtle)]">
            {tasksLine(goal)} · {goal.goalTypeLabel}
          </span>
        </span>
        <ChevronRight
          className="mt-2.5 size-4 shrink-0 text-[var(--text-subtle)] transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </Link>
    </li>
  );
}

/**
 * Karta „Następny krok" — jedyna ciepła powierzchnia i jedyny pomarańczowy
 * przycisk na ekranie. Po prawej postęp etapu kreskami: zielona = warunek
 * spełniony, niebieska = ma cel w drodze, szara = jeszcze nic.
 */
function NextStepCard({
  stage,
  onLink,
  onCreate,
}: {
  stage: NonNullable<StageSummary>;
  onLink: (conditionId: string) => void;
  onCreate: (conditionId: string | null) => void;
}) {
  const next = stage.next;
  const total = stage.conditions.length;
  const allMet = stage.done === total;

  return (
    <section
      className={cn(
        "edge-accent topo overflow-hidden rounded-[22px] border p-5 sm:p-6",
        next
          ? "border-[var(--vairo)]/25 bg-[var(--vairo)]/[0.06]"
          : "border-white/[0.08] bg-[var(--surface)]"
      )}
    >
      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,17rem)] md:items-center">
        <div>
          {next ? (
            <>
              <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[var(--vairo)]">
                Następny krok
              </p>
              <h2 className="mt-1.5 font-heading text-[1.3rem] font-semibold leading-snug text-white sm:text-[1.45rem]">
                {next.subpointTitle}
              </h2>
              <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[var(--text-muted)]">
                To następny warunek etapu {stage.title}. Potrzebny jest{" "}
                {next.minCount === 1 ? "jeden" : next.minCount}{" "}
                {next.countsWhen === "defined" ? "ustawiony" : "ukończony"}{" "}
                {plural(next.minCount, "cel", "cele", "celów")}
                {next.matchAnyType ? "" : ` typu ${next.goalTypeLabel}`} — kreator
                przeprowadzi przez pięć krótkich pytań.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                <Button onClick={() => onCreate(next.id)}>
                  Załóż cel do tego warunku
                  <ArrowRight className="size-4" />
                </Button>
                <button
                  type="button"
                  onClick={() => onLink(next.id)}
                  className="min-h-11 text-[13.5px] font-medium text-[var(--text-muted)] underline decoration-white/25 underline-offset-4 transition-colors hover:text-white sm:min-h-0"
                >
                  albo podepnij istniejący
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="font-heading text-[1.2rem] font-semibold text-white">
                {allMet
                  ? `Wszystkie warunki etapu ${stage.title} są spełnione`
                  : "Każdy warunek ma już swój cel"}
              </h2>
              <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[var(--text-muted)]">
                {allMet
                  ? "Cele zrobiły swoje. Zamknięcie etapu czeka na ekranie etapu."
                  : "Zostało doprowadzić je do końca — cel liczy się, gdy ma zatwierdzony dowód."}
              </p>
              {allMet ? (
                <Button className="mt-4" variant="secondary" href="/app/stage">
                  Przejdź do etapu
                </Button>
              ) : null}
            </>
          )}
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-[var(--bg)]/60 p-4">
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.05em] text-[var(--text-subtle)]">
            Postęp etapu {stage.title}
          </p>
          <p className="mt-1.5 flex items-baseline gap-2">
            <span className="tabular font-heading text-[1.6rem] font-semibold text-white">
              {stage.done} z {total}
            </span>
            <span className="text-[13px] text-[var(--text-subtle)]">
              {plural(total, "warunku", "warunków", "warunków")} gotowych
            </span>
          </p>
          <ConditionTicks conditions={stage.conditions} />
          <p className="mt-2.5 text-[12px] leading-relaxed text-[var(--text-subtle)]">
            Każdy ukończony i podpięty cel zapala jedną kreskę.
          </p>
        </div>
      </div>
    </section>
  );
}

function ConditionTicks({ conditions }: { conditions: MilestoneCondition[] }) {
  return (
    <div className="mt-3 flex gap-1" aria-hidden="true">
      {conditions.map((condition) => (
        <span
          key={condition.id}
          className={cn(
            "h-2 flex-1 rounded-[3px]",
            isMet(condition)
              ? "bg-[var(--success)]"
              : condition.linkedGoalIds.length > 0
                ? "bg-[var(--info)]/55"
                : "bg-white/10"
          )}
        />
      ))}
    </div>
  );
}

/** Pierwsze wejście: całe wyjaśnienie, które dawniej wisiało nad każdą listą. */
function FirstVisit({ hasStage, onCreate }: { hasStage: boolean; onCreate: () => void }) {
  return (
    <section className="rounded-[25px] border border-dashed border-white/10 px-6 py-8 sm:px-8">
      <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-[var(--text-subtle)]">
        <Flag className="size-6" strokeWidth={1.5} />
      </span>
      <h2 className="mt-4 font-heading text-[17px] font-semibold text-white">
        Jak działają cele
      </h2>
      <ol className="mt-3 flex max-w-2xl flex-col gap-2.5 text-[14px] leading-relaxed text-[var(--text-muted)]">
        <li>
          <span className="font-medium text-white">Cel to wynik</span>, który da się komuś
          pokazać — działająca wersja, raport z rozmów, podpisana umowa.
        </li>
        <li>
          <span className="font-medium text-white">Kończy go dowód</span>, nie odhaczenie
          zadań. Zadania pod celem pomagają do niego dojść.
        </li>
        <li>
          <span className="font-medium text-white">Do etapu liczą się cele podpięte pod warunek.</span>{" "}
          Inne cele są Wasze — nie poszerzają programu.
        </li>
      </ol>
      {hasStage ? null : (
        <Button className="mt-6" onClick={onCreate}>
          <Plus className="size-4" />
          Załóż pierwszy cel
        </Button>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */

function AllView({
  goals,
  members,
  userId,
}: {
  goals: GoalItem[];
  members: TeamMemberOption[];
  userId: string;
}) {
  const [owner, setOwner] = useState("all");
  const [status, setStatus] = useState("all");
  const [archived, setArchived] = useState(false);

  const visible = goals.filter((goal) => {
    if (archived !== Boolean(goal.archivedAt)) return false;
    if (owner === "me" && goal.ownerId !== userId) return false;
    if (owner !== "all" && owner !== "me" && goal.ownerId !== owner) return false;
    if (status !== "all" && goal.status !== status) return false;
    return true;
  });
  const filtered = owner !== "all" || status !== "all";

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <MenuSelect
          size="sm"
          className="w-auto min-w-[150px]"
          ariaLabel="Czyje cele"
          value={owner}
          onChange={setOwner}
          options={[
            { value: "all", label: "Wszyscy" },
            { value: "me", label: "Moje" },
            ...members
              .filter((member) => member.id !== userId)
              .map((member) => ({ value: member.id, label: member.name })),
          ]}
        />
        <MenuSelect
          size="sm"
          className="w-auto min-w-[150px]"
          ariaLabel="Status"
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "Każdy status" },
            ...GOAL_STATUSES.map((value) => ({ value, label: GOAL_STATUS_LABELS[value] })),
          ]}
        />
        <button
          type="button"
          onClick={() => setArchived((value) => !value)}
          aria-pressed={archived}
          className="ml-auto inline-flex min-h-11 items-center rounded-lg px-2 text-[13px] text-[var(--text-muted)] transition-colors hover:text-white sm:min-h-9"
        >
          {archived ? "Pokaż aktywne" : "Pokaż zarchiwizowane"}
        </button>
      </div>

      {visible.length === 0 ? (
        archived ? (
          <EmptyNote className="mt-4">Nie ma zarchiwizowanych celów.</EmptyNote>
        ) : filtered ? (
          <EmptyNote className="mt-4">
            Żaden cel nie pasuje do tych filtrów. Zmień osobę albo status.
          </EmptyNote>
        ) : (
          <EmptyState
            className="mt-4"
            icon={Flag}
            title="Nie ma jeszcze celów"
            description="Cel to wynik, który da się pokazać. Kończy go dowód, nie odhaczenie zadań."
            action={
              <Button href="/app/goals/new">
                <Plus className="size-4" />
                Załóż pierwszy cel
              </Button>
            }
          />
        )
      ) : (
        <GoalList className="mt-4">
          {visible.map((goal) => (
            <GoalRow key={goal.id} goal={goal} />
          ))}
        </GoalList>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Mapa warunków bieżącego etapu, w kolumnach według typu celu. Następny
 * warunek jest podświetlony i jako jedyny ma przycisk; kliknięcie w inny
 * niespełniony otwiera podpinanie, które zawsze kończy się akcją.
 */
function StageView({
  stage,
  goals,
  onLink,
  onCreate,
}: {
  stage: StageSummary;
  goals: GoalItem[];
  onLink: (conditionId: string) => void;
  onCreate: (conditionId: string | null) => void;
}) {
  if (!stage) {
    return (
      <EmptyState
        icon={Flag}
        title="Bieżący etap nie ma warunków z celami"
        description="Warunki oparte na celach pojawiają się od etapu Execution. Do tego czasu cele są Wasze — możecie je zakładać i kończyć bez wpływu na etap."
      />
    );
  }

  const inFlight = stage.conditions.filter(
    (condition) => !isMet(condition) && condition.linkedGoalIds.length > 0
  ).length;

  const byType = new Map<string, MilestoneCondition[]>();
  for (const condition of stage.conditions) {
    const list = byType.get(condition.goalTypeLabel) ?? [];
    list.push(condition);
    byType.set(condition.goalTypeLabel, list);
  }
  const goalTitle = (id: string) => goals.find((goal) => goal.id === id);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-white/[0.07] bg-[var(--surface)] px-5 py-4">
        <p className="flex items-baseline gap-2">
          <span className="tabular font-heading text-[1.5rem] font-semibold text-white">
            {stage.done} z {stage.conditions.length}
          </span>
          <span className="text-[13px] text-[var(--text-subtle)]">gotowe w etapie {stage.title}</span>
        </p>
        {inFlight > 0 ? (
          <p className="inline-flex items-center gap-1.5 text-[13px] text-[var(--text-muted)]">
            <span className="size-2 rounded-full bg-[var(--info)]" aria-hidden="true" />
            {inFlight} w drodze
          </p>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...byType.entries()].map(([type, list]) => (
          <section
            key={type}
            className="rounded-[18px] border border-white/[0.07] bg-[var(--surface)] p-4"
          >
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-[14px] font-semibold text-white">{type}</h2>
              <span className="tabular text-[12px] text-[var(--text-subtle)]">
                {list.filter(isMet).length} z {list.length}
              </span>
            </div>
            <ul className="mt-3 flex flex-col gap-1.5">
              {list.map((condition) => {
                const met = isMet(condition);
                const isNext = stage.next?.id === condition.id;
                const linked = condition.linkedGoalIds
                  .map(goalTitle)
                  .filter((goal): goal is GoalItem => Boolean(goal));
                return (
                  <li
                    key={condition.id}
                    className={cn(
                      "rounded-xl px-3 py-2.5",
                      isNext && "bg-[var(--vairo)]/[0.08] ring-1 ring-inset ring-[var(--vairo)]/35"
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className={cn(
                          "mt-1.5 size-2 shrink-0 rounded-full",
                          met
                            ? "bg-[var(--success)]"
                            : linked.length > 0
                              ? "bg-[var(--info)]"
                              : "border-[1.5px] border-white/35"
                        )}
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        {met || isNext ? (
                          <p className="text-[13.5px] leading-snug text-white">
                            {condition.subpointTitle}
                          </p>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onLink(condition.id)}
                            className="text-left text-[13.5px] leading-snug text-white underline decoration-transparent underline-offset-4 transition-colors hover:decoration-white/40"
                          >
                            {condition.subpointTitle}
                          </button>
                        )}
                        <p
                          className={cn(
                            "mt-0.5 text-[12px] leading-snug",
                            met
                              ? "text-[var(--success)]"
                              : linked.length > 0
                                ? "text-[var(--text-muted)]"
                                : "text-[var(--text-subtle)]"
                          )}
                        >
                          {met
                            ? "Spełniony"
                            : linked.length > 0
                              ? linked.map((goal) => goal.title).join(", ")
                              : "Nie ma jeszcze celu"}
                          {condition.minCount > 1
                            ? ` · ${condition.done} z ${condition.minCount}`
                            : ""}
                        </p>
                        {isNext ? (
                          <Button size="sm" className="mt-2.5" onClick={() => onCreate(condition.id)}>
                            Załóż cel
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
