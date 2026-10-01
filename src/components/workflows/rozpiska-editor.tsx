"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { completeGoal } from "@/app/app/goals/actions";
import {
  saveWorkflow,
  type RozpiskaEdge,
  type RozpiskaNode,
} from "@/app/app/workflows/actions";
import type { GoalItem } from "@/types/goals";

const fieldClass =
  "h-10 w-full rounded-xl border border-white/10 bg-[var(--surface-2)] px-3 text-[14px] text-white outline-none focus:border-[var(--vairo)]/70";

export type RozpiskaRecord = {
  id: string;
  title: string;
  goalId: string | null;
  version: number;
  nodes: RozpiskaNode[];
  edges: RozpiskaEdge[];
};

export function RozpiskaEditor({
  startupId,
  diagrams,
  goals,
  initialId,
}: {
  startupId: string;
  diagrams: RozpiskaRecord[];
  goals: GoalItem[];
  initialId: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const current = diagrams.find((item) => item.id === initialId) ?? diagrams[0] ?? null;
  const [id, setId] = useState<string | null>(current?.id ?? null);
  const [title, setTitle] = useState(current?.title ?? "Pierwsza rozpiska");
  const [goalId, setGoalId] = useState(current?.goalId ?? "");
  const [nodes, setNodes] = useState<RozpiskaNode[]>(current?.nodes ?? []);
  const [edges, setEdges] = useState<RozpiskaEdge[]>(current?.edges ?? []);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [version, setVersion] = useState(current?.version ?? 1);

  const open = (record: RozpiskaRecord) => {
    setId(record.id);
    setTitle(record.title);
    setGoalId(record.goalId ?? "");
    setNodes(record.nodes);
    setEdges(record.edges);
    setVersion(record.version);
    setError(null);
  };

  const fresh = () => {
    setId(null);
    setTitle("Nowa rozpiska");
    setGoalId("");
    setNodes([{ id: crypto.randomUUID(), x: 32, y: 32, label: "Start" }]);
    setEdges([]);
    setVersion(1);
  };

  const save = () => {
    setError(null);
    start(async () => {
      const result = await saveWorkflow({
        startupId,
        id,
        title,
        goalId: goalId || null,
        nodes,
        edges,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.id) setId(result.id);
      router.refresh();
    });
  };

  const useAsProof = () => {
    if (!id || !goalId) return;
    setError(null);
    start(async () => {
      const saved = await saveWorkflow({
        startupId,
        id,
        title,
        goalId,
        nodes,
        edges,
      });
      if (saved.error || !saved.id) {
        setError(saved.error ?? "Najpierw zapisz rysunek.");
        return;
      }
      const result = await completeGoal({
        startupId,
        goalId,
        proof: { kind: "module_result", workflowId: saved.id },
      });
      if (result.error) setError(result.error);
      else router.refresh();
    });
  };

  const goal = goals.find((item) => item.id === goalId) ?? null;
  const proofReady = Boolean(
    id && goal && goal.proofRequirement.kind === "module_result" && goal.status !== "completed" && !goal.archivedAt
  );

  return (
    <div className="mx-auto w-full max-w-5xl">
      <h1 className="font-heading text-[1.6rem] font-semibold text-white">Rozpiska</h1>
      <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[var(--text-muted)]">
        Bloczki i strzałki układają plan. Strzałka nie zmienia statusu celu,
        nie tworzy zadania i nie ustawia terminu. Zapisana wersja może być
        dowodem, jeśli cel właśnie tego oczekuje.
      </p>

      <div className="mt-5 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="flex flex-col gap-2">
          <Button variant="secondary" onClick={fresh}>
            Nowa
          </Button>
          {diagrams.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => open(item)}
              className={
                item.id === id
                  ? "rounded-xl bg-[var(--vairo)]/12 px-3 py-2 text-left text-[13px] text-[var(--vairo)]"
                  : "rounded-xl px-3 py-2 text-left text-[13px] text-[var(--text-muted)] hover:bg-white/5"
              }
            >
              {item.title}
              <span className="mt-0.5 block text-[11px] text-[var(--text-faint)]">
                wersja {item.version}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <input className={fieldClass} value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Nazwa rozpiski" />
            <select className={fieldClass} value={goalId} onChange={(e) => setGoalId(e.target.value)} aria-label="Powiązany cel">
              <option value="">Bez powiązanego celu</option>
              {goals
                .filter((item) => !item.archivedAt)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
            </select>
          </div>

          <div className="relative h-[440px] overflow-hidden rounded-2xl border border-white/10 bg-[var(--surface)]">
            <svg className="pointer-events-none absolute inset-0 h-full w-full">
              {edges.map((edge) => {
                const a = nodes.find((node) => node.id === edge.from);
                const b = nodes.find((node) => node.id === edge.to);
                if (!a || !b) return null;
                return (
                  <line
                    key={edge.id}
                    x1={a.x + 70}
                    y1={a.y + 28}
                    x2={b.x + 70}
                    y2={b.y + 28}
                    stroke="rgba(255,255,255,.35)"
                    strokeWidth="1.5"
                    markerEnd="url(#arrow)"
                  />
                );
              })}
              <defs>
                <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6" fill="rgba(255,255,255,.55)" />
                </marker>
              </defs>
            </svg>
            {nodes.map((node) => (
              <div
                key={node.id}
                className="absolute w-[140px] cursor-grab rounded-xl border border-white/15 bg-[var(--surface-2)] px-2 py-1.5"
                style={{ left: node.x, top: node.y }}
                onPointerDown={(event) => {
                  const startX = event.clientX;
                  const startY = event.clientY;
                  const originX = node.x;
                  const originY = node.y;
                  const move = (ev: PointerEvent) => {
                    setNodes((prev) =>
                      prev.map((item) =>
                        item.id === node.id
                          ? { ...item, x: originX + ev.clientX - startX, y: originY + ev.clientY - startY }
                          : item
                      )
                    );
                  };
                  const up = () => {
                    window.removeEventListener("pointermove", move);
                    window.removeEventListener("pointerup", up);
                  };
                  window.addEventListener("pointermove", move);
                  window.addEventListener("pointerup", up);
                }}
              >
                <input
                  className="w-full bg-transparent text-[13px] text-white outline-none"
                  value={node.label}
                  aria-label="Nazwa bloczka"
                  onPointerDown={(event) => event.stopPropagation()}
                  onChange={(event) =>
                    setNodes((prev) =>
                      prev.map((item) =>
                        item.id === node.id ? { ...item, label: event.target.value } : item
                      )
                    )
                  }
                />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              onClick={() =>
                setNodes((prev) => [
                  ...prev,
                  {
                    id: crypto.randomUUID(),
                    x: 24 + prev.length * 16,
                    y: 24 + prev.length * 12,
                    label: "Krok",
                  },
                ])
              }
            >
              Dodaj bloczek
            </Button>
            <select className={fieldClass + " w-auto"} value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Od bloczka">
              <option value="">Od</option>
              {nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.label || "Bloczek"}
                </option>
              ))}
            </select>
            <select className={fieldClass + " w-auto"} value={to} onChange={(e) => setTo(e.target.value)} aria-label="Do bloczka">
              <option value="">Do</option>
              {nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.label || "Bloczek"}
                </option>
              ))}
            </select>
            <Button
              variant="secondary"
              disabled={!from || !to || from === to}
              title={!from || !to ? "Wybierz dwa bloczki" : undefined}
              onClick={() => {
                setEdges((prev) => [...prev, { id: crypto.randomUUID(), from, to }]);
                setFrom("");
                setTo("");
              }}
            >
              Dodaj strzałkę
            </Button>
            <Button onClick={save} loading={pending}>
              Zapisz
            </Button>
            <Button
              variant="secondary"
              disabled={!proofReady}
              title={
                proofReady
                  ? `Użyje wersji ${version} jako dowodu`
                  : "Cel musi oczekiwać Rozpiski jako dowodu i nie może być już ukończony."
              }
              onClick={useAsProof}
            >
              Użyj tej wersji jako dowód
            </Button>
          </div>
          {error ? <p className="text-[13px] text-[var(--danger)]">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
