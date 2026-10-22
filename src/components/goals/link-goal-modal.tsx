"use client";

import { useState } from "react";
import { Lock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { canChangeOwnWork, type StartupRole } from "@/types/startup";
import type { GoalItem, MilestoneCondition } from "@/types/goals";
import { dueLine } from "./goal-format";
import { StatusBadge } from "./status";

/**
 * Podpięcie istniejącego celu do warunku etapu.
 *
 * Dawniej przy braku pasującego celu okno kończyło się zdaniem „nie ma celu,
 * który dałoby się podpiąć" — ślepa uliczka. Teraz wyjście „Załóż nowy cel
 * tego typu" jest ZAWSZE, także wtedy, gdy coś pasuje: ktoś mógł otworzyć to
 * okno tylko po to, żeby sprawdzić, czy nie zakłada drugiego takiego samego.
 */
export function LinkGoalModal({
  condition,
  goals,
  userId,
  role,
  pending,
  error,
  onPick,
  onCreate,
  onClose,
}: {
  condition: MilestoneCondition;
  goals: GoalItem[];
  userId: string;
  role: StartupRole;
  pending: boolean;
  error: string | null;
  onPick: (goalId: string) => void;
  onCreate: () => void;
  onClose: () => void;
}) {
  const matching = goals.filter(
    (goal) =>
      !goal.archivedAt &&
      (condition.matchAnyType || goal.goalTypeId === condition.goalTypeId) &&
      !condition.linkedGoalIds.includes(goal.id)
  );
  const pickable = (goal: GoalItem) => canChangeOwnWork(role, userId, goal.ownerId);
  const [picked, setPicked] = useState<string | null>(
    matching.find(pickable)?.id ?? null
  );

  return (
    <Modal
      title="Podepnij cel do warunku"
      description={condition.subpointTitle}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onCreate}>
            <Plus className="size-4" />
            Załóż nowy cel typu {condition.goalTypeLabel}
          </Button>
          {matching.length > 0 ? (
            <Button
              loading={pending}
              disabled={!picked}
              title={picked ? undefined : "Wybierz cel z listy"}
              onClick={() => picked && onPick(picked)}
            >
              Podepnij wybrany
            </Button>
          ) : null}
        </>
      }
    >
      {matching.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 px-4 py-4">
          <p className="text-[14px] font-medium text-white">
            Nie ma jeszcze celu typu {condition.goalTypeLabel}
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-[var(--text-subtle)]">
            Ten warunek przyjmuje tylko cele tego typu. Załóż nowy — kreator
            będzie miał już wpisany typ i warunek, do którego cel się podepnie.
          </p>
        </div>
      ) : (
        <>
          {condition.matchAnyType ? null : (
            <p className="text-[13px] text-[var(--text-subtle)]">
              Pokazujemy tylko cele typu {condition.goalTypeLabel}, bo tylko takie
              ten warunek przyjmie.
            </p>
          )}
          <ul role="radiogroup" aria-label="Cele do podpięcia" className="flex flex-col gap-2">
            {matching.map((goal) => {
              const allowed = pickable(goal);
              const on = picked === goal.id;
              return (
                <li key={goal.id}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={on}
                    disabled={!allowed || pending}
                    onClick={() => setPicked(goal.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition-colors",
                      on
                        ? "border-[var(--vairo)]/50 bg-[var(--vairo)]/[0.08]"
                        : "border-white/[0.08] bg-[var(--surface)] hover:border-white/16",
                      !allowed && "cursor-not-allowed opacity-60 hover:border-white/[0.08]"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border-[1.5px]",
                        on ? "border-[var(--vairo)]" : "border-white/25"
                      )}
                      aria-hidden="true"
                    >
                      {on ? <span className="size-2.5 rounded-full bg-[var(--vairo)]" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-[14px] font-medium text-white">{goal.title}</span>
                        <StatusBadge status={goal.status} />
                      </span>
                      <span className="mt-0.5 block text-[12.5px] text-[var(--text-subtle)]">
                        {goal.ownerName} · {dueLine(goal)}
                      </span>
                      {goal.conditions[0] ? (
                        <span className="mt-1 block text-[12.5px] text-[var(--text-muted)]">
                          Liczy się już do: {goal.conditions[0].subpointTitle}
                        </span>
                      ) : null}
                      {!allowed ? (
                        <span className="mt-1 inline-flex items-center gap-1 text-[12.5px] text-[var(--text-subtle)]">
                          <Lock className="size-3" aria-hidden="true" />
                          Podpinasz tylko własne cele. Ten podepnie {goal.ownerName}, Founder albo Admin.
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="text-[12.5px] leading-relaxed text-[var(--text-subtle)]">
            {condition.countsWhen === "defined"
              ? "Podpięty cel liczy się do etapu od razu — ten warunek wymaga ustawienia celu, nie ukończenia."
              : "Podpięty cel zacznie się liczyć do etapu, gdy będzie ukończony z dowodem."}
          </p>
        </>
      )}
      {error ? (
        <p role="alert" className="text-[13px] text-[var(--danger)]">
          {error}
        </p>
      ) : null}
    </Modal>
  );
}
