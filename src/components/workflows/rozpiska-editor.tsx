"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  History,
  Lock,
  MousePointerClick,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { completeGoal } from "@/app/app/goals/actions";
import {
  deleteWorkflow,
  saveWorkflow,
  type RozpiskaEdge,
  type RozpiskaNode,
} from "@/app/app/workflows/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Menu, MenuItem, MenuSeparator } from "@/components/ui/menu";
import { MenuSelect } from "@/components/ui/menu-select";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { formatMoment } from "@/components/goals/goal-format";
import { cn } from "@/lib/utils";
import { orderedSteps, type RozpiskaRecord, type RozpiskaVersion } from "@/lib/workflows";
import type { GoalItem } from "@/types/goals";
import { RozpiskaBoard } from "./rozpiska-board";

type Draft = {
  title: string;
  goalId: string;
  nodes: RozpiskaNode[];
  edges: RozpiskaEdge[];
};

function snapshotOf(draft: Draft) {
  return JSON.stringify(draft);
}

/**
 * Płótno jednej Rozpiski — na całą szerokość, z cienkim paskiem na górze.
 *
 * Pasek czyta się od lewej: wróć → co to → dla jakiego celu → stan → zapisz.
 * Zapis jest jeden: „Zapisz wersję". Ciepła karta pojawia się tylko wtedy,
 * gdy podpięty cel oczekuje właśnie Rozpiski — wtedy „Użyj jako dowód" staje
 * się akcją główną ekranu. W innym wypadku ta akcja mieszka w menu wersji,
 * wyłączona i z powodem napisanym wprost.
 */
export function RozpiskaEditor({
  startupId,
  record,
  versions,
  goals,
  canDelete = false,
}: {
  startupId: string;
  record: RozpiskaRecord | null;
  versions: RozpiskaVersion[];
  goals: GoalItem[];
  /** Autor, Founder albo Admin. */
  canDelete?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const isNew = !record;

  const initial: Draft = useMemo(
    () =>
      record
        ? { title: record.title, goalId: record.goalId ?? "", nodes: record.nodes, edges: record.edges }
        : {
            title: "Nowa rozpiska",
            goalId: "",
            nodes: [{ id: crypto.randomUUID(), x: 48, y: 48, label: "" }],
            edges: [],
          },
    [record]
  );
  const [draft, setDraft] = useState<Draft>(initial);
  const [baseline, setBaseline] = useState(() => snapshotOf(initial));
  const [viewingVersion, setViewingVersion] = useState<number | null>(null);
  const [showCanvasOnPhone, setShowCanvasOnPhone] = useState(false);
  const [starterClosed, setStarterClosed] = useState(!isNew);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Po zapisie serwer odsyła nowy `record` — wtedy to jest nowy punkt odniesienia.
  const [seenRecord, setSeenRecord] = useState(record);
  if (seenRecord !== record) {
    setSeenRecord(record);
    setDraft(initial);
    setBaseline(snapshotOf(initial));
    setViewingVersion(null);
  }

  const dirty = snapshotOf(draft) !== baseline;
  const changes = dirty ? countChanges(JSON.parse(baseline) as Draft, draft) : 0;
  const goal = goals.find((item) => item.id === draft.goalId) ?? null;
  const goalAwaits = Boolean(
    goal &&
      goal.proofRequirement.kind === "module_result" &&
      goal.status !== "completed" &&
      !goal.archivedAt
  );
  const proofBlockedReason = !goal
    ? "Wybierz cel, który oczekuje Rozpiski jako dowodu."
    : goal.status === "completed"
      ? "Ten cel jest już ukończony."
      : goal.proofRequirement.kind !== "module_result"
        ? "Ten cel oczekuje innego dowodu. Zmienisz to w szczególe celu."
        : null;

  const set = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }));

  const persist = (then?: (id: string) => Promise<string | null> | void) => {
    setError(null);
    start(async () => {
      const result = await saveWorkflow({
        startupId,
        id: record?.id ?? null,
        title: draft.title,
        goalId: draft.goalId || null,
        nodes: draft.nodes,
        edges: draft.edges,
      });
      if (result.error || !result.id) {
        setError(result.error ?? "Nie udało się zapisać.");
        toast({ tone: "error", title: "Nie udało się zapisać wersji", description: result.error ?? undefined });
        return;
      }
      setBaseline(snapshotOf(draft));
      const id = result.id;
      if (then) {
        const followError = await then(id);
        if (followError) {
          toast({ tone: "error", title: "Wersja zapisana, ale dowód nie przeszedł", description: followError });
        }
      } else {
        toast({
          title: isNew ? "Rozpiska zapisana" : "Nowa wersja zapisana",
          action: goalAwaits && goal ? { label: "Użyj jako dowód", onClick: () => applyAsProof(id) } : undefined,
        });
      }
      if (isNew) router.replace(`/app/workflows/${id}`);
    });
  };

  const applyAsProof = (savedId?: string) => {
    if (!goal) return;
    const finish = async (id: string) => {
      const result = await completeGoal({
        startupId,
        goalId: goal.id,
        proof: { kind: "module_result", workflowId: id },
      });
      if (result.error) return result.error;
      toast({ title: "Cel ukończony", description: `Rozpiska jest dowodem celu „${goal.title}”.` });
      return null;
    };
    if (dirty || !savedId) {
      persist(finish);
      return;
    }
    start(async () => {
      const problem = await finish(savedId);
      if (problem) toast({ tone: "error", title: "Dowód nie przeszedł", description: problem });
    });
  };

  const removeNode = (nodeId: string) => {
    const node = draft.nodes.find((item) => item.id === nodeId);
    const lostEdges = draft.edges.filter((edge) => edge.from === nodeId || edge.to === nodeId);
    set({
      nodes: draft.nodes.filter((item) => item.id !== nodeId),
      edges: draft.edges.filter((edge) => edge.from !== nodeId && edge.to !== nodeId),
    });
    if (node) {
      toast({
        tone: "info",
        title: "Bloczek usunięty",
        description: node.label || undefined,
        action: {
          label: "Cofnij",
          onClick: () =>
            setDraft((current) => ({
              ...current,
              nodes: [...current.nodes, node],
              edges: [...current.edges, ...lostEdges],
            })),
        },
      });
    }
  };

  const addNode = () => {
    const count = draft.nodes.length;
    set({
      nodes: [
        ...draft.nodes,
        {
          id: crypto.randomUUID(),
          x: 48 + ((count * 176) % 704),
          y: 48 + Math.floor(count / 4) * 88,
          label: "Krok",
        },
      ],
    });
  };

  const connect = (from: string, to: string) =>
    setDraft((current) =>
      current.edges.some((edge) => edge.from === from && edge.to === to)
        ? current
        : { ...current, edges: [...current.edges, { id: crypto.randomUUID(), from, to }] }
    );

  const openVersion = (snapshot: RozpiskaVersion) => {
    setDraft((current) => ({
      ...current,
      title: snapshot.title,
      nodes: snapshot.nodes,
      edges: snapshot.edges,
    }));
    setViewingVersion(snapshot.version === record?.version ? null : snapshot.version);
  };

  const starter = [
    { done: draft.nodes.some((node) => node.label.trim().length > 0), label: "Nazwij pierwszy krok" },
    { done: draft.nodes.length >= 2, label: "Dodaj kolejny bloczek" },
    { done: draft.edges.length >= 1, label: "Pociągnij kropkę z prawej strony bloczka na następny" },
  ];
  const showStarter = !starterClosed && draft.edges.length < 2;

  const state = pending
    ? "Zapisuję…"
    : dirty
      ? isNew
        ? "Jeszcze niezapisana"
        : `${changes} ${changes === 1 ? "zmiana" : changes % 10 >= 2 && changes % 10 <= 4 && (changes % 100 < 12 || changes % 100 > 14) ? "zmiany" : "zmian"} od wersji ${record?.version ?? 1}`
      : record
        ? `Zapisano · wersja ${record.version}`
        : "";

  return (
    <div className="flex w-full flex-col">
      {/* Pasek */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Link
          href="/app/workflows"
          aria-label="Wróć do listy rozpisek"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-[var(--text-subtle)] transition-colors hover:border-white/22 hover:text-white"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <input
          value={draft.title}
          onChange={(event) => set({ title: event.target.value })}
          aria-label="Nazwa rozpiski"
          maxLength={140}
          className="min-w-0 flex-1 rounded-lg bg-transparent px-1.5 py-1 font-heading text-[1.35rem] font-semibold text-white outline-none hover:bg-white/[0.04] focus:bg-white/[0.06]"
        />
        <span
          className={cn(
            "text-[12.5px]",
            dirty ? "text-[var(--warning)]" : "text-[var(--text-subtle)]"
          )}
          aria-live="polite"
        >
          {state}
        </span>
        <Menu
          label="Wersje i dowód"
          trigger={
            <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 px-2.5 text-[13px] text-[var(--text-muted)] hover:text-white sm:h-8">
              <History className="size-3.5" />
              Wersje
            </span>
          }
        >
          {(close) => (
            <>
              {versions.length === 0 ? (
                <p className="px-3.5 py-2.5 text-[12.5px] text-[var(--text-subtle)]">
                  Pierwsza wersja powstanie po zapisaniu.
                </p>
              ) : (
                versions.map((snapshot) => (
                  <MenuItem
                    key={snapshot.version}
                    onClick={() => {
                      close();
                      openVersion(snapshot);
                    }}
                    hint={formatMoment(snapshot.createdAt)}
                  >
                    Wersja {snapshot.version}
                    {snapshot.version === record?.version ? " · aktualna" : ""}
                  </MenuItem>
                ))
              )}
              <MenuSeparator />
              <MenuItem
                icon={ShieldCheck}
                disabled={!goalAwaits || pending}
                hint={proofBlockedReason ?? `Zapisze wersję i ukończy cel „${goal?.title ?? ""}”.`}
                onClick={() => {
                  close();
                  applyAsProof(record?.id);
                }}
              >
                Użyj jako dowód
              </MenuItem>
              {goal && !goalAwaits && goal.status !== "completed" ? (
                <MenuItem
                  hint="Cel oczekuje dziś innego dowodu. Zmienisz to w jego edycji."
                  onClick={() => {
                    close();
                    router.push(`/app/goals/${goal.id}`);
                  }}
                >
                  Zmień oczekiwany dowód w celu
                </MenuItem>
              ) : null}
              {record && canDelete ? (
                <>
                  <MenuSeparator />
                  <MenuItem
                    icon={Trash2}
                    tone="danger"
                    onClick={() => {
                      close();
                      setDeleting(true);
                    }}
                  >
                    Usuń rozpiskę
                  </MenuItem>
                </>
              ) : null}
            </>
          )}
        </Menu>
        <Button
          variant={goalAwaits ? "secondary" : "primary"}
          size="sm"
          loading={pending}
          disabled={!dirty}
          title={dirty ? undefined : "Nie ma zmian od ostatniej wersji."}
          onClick={() => persist()}
        >
          {dirty ? <Check className="size-3.5" /> : <Lock className="size-3.5" />}
          Zapisz wersję
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 pl-0 sm:pl-12">
        <span className="text-[13px] text-[var(--text-subtle)]">Dla celu</span>
        <MenuSelect
          size="sm"
          className="w-auto min-w-[200px] max-w-[320px]"
          ariaLabel="Dla celu"
          value={draft.goalId}
          onChange={(goalId) => set({ goalId })}
          options={[
            { value: "", label: "Bez celu" },
            ...goals
              .filter((item) => !item.archivedAt)
              .map((item) => ({ value: item.id, label: item.title })),
          ]}
        />
        <span className="text-[12.5px] text-[var(--text-subtle)]">
          Zapisana wersja może być dowodem, jeśli cel jej oczekuje.
        </span>
      </div>

      {viewingVersion !== null ? (
        <p className="mt-3 rounded-xl border border-white/[0.08] bg-[var(--surface)] px-4 py-2.5 text-[13px] text-[var(--text-muted)]">
          Oglądasz wersję {viewingVersion}. Zapisanie zrobi z niej nową, aktualną wersję.{" "}
          <button
            type="button"
            className="font-medium text-white underline decoration-white/30 underline-offset-4"
            onClick={() => {
              setDraft(initial);
              setViewingVersion(null);
            }}
          >
            Wróć do aktualnej
          </button>
        </p>
      ) : null}

      {goalAwaits && goal ? (
        <section className="edge-accent mt-3 flex flex-wrap items-center gap-3 rounded-[18px] border border-[var(--vairo)]/25 bg-[var(--vairo)]/[0.06] px-4 py-3">
          <p className="min-w-0 flex-1 text-[13.5px] text-[var(--text-muted)]">
            <span className="font-medium text-white">Ta rozpiska może zamknąć cel „{goal.title}”.</span>{" "}
            Cel oczekuje zapisanej wersji Rozpiski jako dowodu.
          </p>
          <Button size="sm" loading={pending} onClick={() => applyAsProof(record?.id)}>
            <ShieldCheck className="size-3.5" />
            Użyj jako dowód
          </Button>
        </section>
      ) : null}

      {error ? (
        <p role="alert" className="mt-3 text-[13px] text-[var(--danger)]">
          {error}
        </p>
      ) : null}

      {/* Telefon: plan jako lista kroków w kolejności strzałek. */}
      <div className={cn("mt-4 md:hidden", showCanvasOnPhone && "hidden")}>
        <StepList
          nodes={draft.nodes}
          edges={draft.edges}
          onRename={(id, label) =>
            set({ nodes: draft.nodes.map((node) => (node.id === id ? { ...node, label } : node)) })
          }
          onToggleEdge={(from, to) =>
            setDraft((current) =>
              current.edges.some((edge) => edge.from === from && edge.to === to)
                ? { ...current, edges: current.edges.filter((edge) => !(edge.from === from && edge.to === to)) }
                : { ...current, edges: [...current.edges, { id: crypto.randomUUID(), from, to }] }
            )
          }
          onRemove={removeNode}
          onAdd={addNode}
        />
        <Button variant="ghost" size="sm" className="mt-3" onClick={() => setShowCanvasOnPhone(true)}>
          Pokaż płótno
        </Button>
      </div>

      <div className={cn("mt-4", showCanvasOnPhone ? "block" : "hidden md:block")}>
        <RozpiskaBoard
          className="h-[calc(100svh-260px)] min-h-[440px]"
          nodes={draft.nodes}
          edges={draft.edges}
          onMove={(id, x, y) =>
            setDraft((current) => ({
              ...current,
              nodes: current.nodes.map((node) => (node.id === id ? { ...node, x, y } : node)),
            }))
          }
          onRename={(id, label) =>
            setDraft((current) => ({
              ...current,
              nodes: current.nodes.map((node) => (node.id === id ? { ...node, label } : node)),
            }))
          }
          onConnect={connect}
          onRemoveEdge={(edgeId) =>
            setDraft((current) => ({ ...current, edges: current.edges.filter((edge) => edge.id !== edgeId) }))
          }
          onRemoveNode={removeNode}
        >
          <div className="absolute bottom-3 left-3 z-10 flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" onClick={addNode}>
              <Plus className="size-3.5" />
              Dodaj bloczek
            </Button>
            <span className="hidden items-center gap-1.5 rounded-lg bg-[var(--bg)]/70 px-2.5 py-1.5 text-[12px] text-[var(--text-subtle)] backdrop-blur sm:inline-flex">
              <MousePointerClick className="size-3.5" aria-hidden="true" />
              Kropka z prawej łączy bloczki · klik w strzałkę ją usuwa · strzałki nie zmieniają celów ani zadań
            </span>
          </div>

          {showStarter ? (
            <div className="absolute right-3 top-3 z-10 w-[260px] rounded-2xl border border-white/10 bg-[var(--surface-2)]/95 p-4 backdrop-blur lift-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13.5px] font-medium text-white">Jak zacząć</p>
                <button
                  type="button"
                  onClick={() => setStarterClosed(true)}
                  className="text-[12px] text-[var(--text-subtle)] hover:text-white"
                >
                  Ukryj
                </button>
              </div>
              <ol className="mt-2.5 flex flex-col gap-2">
                {starter.map((step, index) => (
                  <li key={step.label} className="flex items-start gap-2 text-[12.5px] leading-snug">
                    <span
                      className={cn(
                        "tabular mt-px inline-flex size-[18px] shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                        step.done
                          ? "bg-[var(--success)]/20 text-[var(--success)]"
                          : "bg-white/10 text-[var(--text-muted)]"
                      )}
                    >
                      {step.done ? <Check className="size-3" /> : index + 1}
                    </span>
                    <span className={step.done ? "text-[var(--text-subtle)] line-through" : "text-[var(--text-muted)]"}>
                      {step.label}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </RozpiskaBoard>
      </div>
      {deleting && record ? (
        <Modal
          title="Usunąć tę rozpiskę?"
          description="Zniknie razem ze wszystkimi wersjami. Cele, które użyły jej jako dowodu, zachowują swoją kopię."
          onClose={() => setDeleting(false)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setDeleting(false)}>
                Zostaw
              </Button>
              <Button
                variant="danger"
                loading={pending}
                onClick={() =>
                  start(async () => {
                    const result = await deleteWorkflow(startupId, record.id);
                    if (result.error) {
                      toast({ tone: "error", title: "Nie udało się usunąć", description: result.error });
                      return;
                    }
                    toast({ title: "Rozpiska usunięta", description: record.title });
                    router.push("/app/workflows");
                  })
                }
              >
                Usuń rozpiskę
              </Button>
            </>
          }
        >
          <p className="text-[14px] text-white">{record.title}</p>
        </Modal>
      ) : null}
    </div>
  );
}

/** Ile rzeczy różni szkic od zapisanej wersji — bloczki, strzałki, nazwa. */
function countChanges(before: Draft, after: Draft) {
  let count = before.title !== after.title ? 1 : 0;
  if (before.goalId !== after.goalId) count += 1;
  const oldNodes = new Map(before.nodes.map((node) => [node.id, node]));
  for (const node of after.nodes) {
    const old = oldNodes.get(node.id);
    if (!old) count += 1;
    else if (old.label !== node.label || old.x !== node.x || old.y !== node.y) count += 1;
    oldNodes.delete(node.id);
  }
  count += oldNodes.size;
  const key = (edge: RozpiskaEdge) => `${edge.from}>${edge.to}`;
  const oldEdges = new Set(before.edges.map(key));
  const newEdges = new Set(after.edges.map(key));
  for (const edge of newEdges) if (!oldEdges.has(edge)) count += 1;
  for (const edge of oldEdges) if (!newEdges.has(edge)) count += 1;
  return Math.max(count, 1);
}

/**
 * Plan jako lista kroków — na telefonie przeciąganie strzałek palcem na 390 px
 * jest zawodne. Połączenia ustawia się w menu bloczka („Prowadzi do…");
 * funkcja zostaje, zmienia się tylko gest.
 */
function StepList({
  nodes,
  edges,
  onRename,
  onToggleEdge,
  onRemove,
  onAdd,
}: {
  nodes: RozpiskaNode[];
  edges: RozpiskaEdge[];
  onRename: (id: string, label: string) => void;
  onToggleEdge: (from: string, to: string) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}) {
  const steps = orderedSteps(nodes, edges);
  return (
    <div>
      <ol className="flex flex-col gap-2">
        {steps.map((node, index) => {
          const targets = edges
            .filter((edge) => edge.from === node.id)
            .map((edge) => nodes.find((item) => item.id === edge.to)?.label || "bez nazwy");
          return (
            <li key={node.id} className="rounded-2xl bg-[var(--surface)] p-3 lift-1">
              <div className="flex items-center gap-2">
                <span className="tabular inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--surface-3)] text-[12px] font-semibold text-white">
                  {index + 1}
                </span>
                <Input
                  aria-label="Nazwa kroku"
                  value={node.label}
                  placeholder="Nazwij krok"
                  onChange={(event) => onRename(node.id, event.target.value)}
                  className="h-10"
                />
                <Menu label={`Akcje kroku ${node.label}`}>
                  {(close) => (
                    <>
                      <p className="px-3.5 pb-1 pt-2 text-[12px] text-[var(--text-subtle)]">Prowadzi do…</p>
                      {nodes
                        .filter((item) => item.id !== node.id)
                        .map((item) => {
                          const on = edges.some((edge) => edge.from === node.id && edge.to === item.id);
                          return (
                            <MenuItem
                              key={item.id}
                              icon={on ? Check : Plus}
                              onClick={() => {
                                close();
                                onToggleEdge(node.id, item.id);
                              }}
                            >
                              {item.label || "bez nazwy"}
                            </MenuItem>
                          );
                        })}
                      <MenuSeparator />
                      <MenuItem
                        tone="danger"
                        onClick={() => {
                          close();
                          onRemove(node.id);
                        }}
                      >
                        Usuń krok
                      </MenuItem>
                    </>
                  )}
                </Menu>
              </div>
              {targets.length > 0 ? (
                <p className="mt-1.5 pl-8 text-[12.5px] text-[var(--text-subtle)]">
                  → {targets.join(", ")}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>
      <Button variant="secondary" size="sm" className="mt-3" onClick={onAdd}>
        <Plus className="size-3.5" />
        Dodaj krok
      </Button>
    </div>
  );
}
