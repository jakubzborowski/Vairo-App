"use client";

import { Portal } from "@/components/ui/portal";
import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Check, FileText, X } from "lucide-react";
import { Textarea } from "@/components/ui/input";
import { StepWizard, type WizardStep } from "@/components/ui/step-wizard";
import { cn } from "@/lib/utils";
import {
  STAGE_DECISIONS,
  STAGE_DECISION_COPY,
  type StageDecision,
  type StageTree,
} from "@/types/stage";
import { MentorPanel } from "@/components/ai/ai-assist";
import { useT } from "@/i18n/client";

type Props = {
  tree: StageTree;
  /**
   * Archiwum to decyzja Foundera — Admin widzi ją wyłączoną z powodem.
   * Domyślnie włączone: rozstrzyga i tak serwer (`closeStage`).
   */
  canArchive?: boolean;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: (input: {
    decision: StageDecision;
    note: string;
    reopenSubpointIds: string[];
  }) => void;
};

/**
 * Decyzja kończąca Idea Stage (guidelines 10.5).
 *
 * To najpoważniejszy moment w całym etapie, więc nie wciskamy go w stopkę
 * jako czwarty przycisk. Pełny ekran, jedno pytanie na krok i żadnej oceny
 * pomysłu ze strony systemu — zapisujemy wyłącznie to, co zdecydował człowiek.
 */
export function StageCloseDialog({
  tree,
  canArchive = true,
  saving,
  error,
  onClose,
  onConfirm,
}: Props) {
  const t = useT("stage");
  const tc = useT("common");
  const [decision, setDecision] = useState<StageDecision | null>(null);
  const [note, setNote] = useState("");
  const [reopen, setReopen] = useState<string[]>([]);

  const toggleReopen = (id: string) =>
    setReopen((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  // Podpunkty opcjonalne, których nikt nie tknął. Nie blokują domknięcia, ale
  // to jedyne konkretne „luki", jakie da się wskazać bez oceniania odpowiedzi.
  const skippedOptional = tree.categories.flatMap((category) =>
    category.points.flatMap((point) =>
      point.subpoints
        .filter((subpoint) => subpoint.isOptional && !subpoint.isComplete)
        .map((subpoint) => ({ point: point.title, title: subpoint.title }))
    )
  );

  const completedPoints = tree.categories.reduce(
    (sum, category) => sum + category.points.filter((p) => p.isComplete).length,
    0
  );
  const allPoints = tree.categories.reduce(
    (sum, category) => sum + category.points.length,
    0
  );

  const steps: WizardStep[] = [
    {
      // Decyzja bez spojrzenia na własne wyniki to zgadywanie. Pierwszy krok
      // nie ocenia pomysłu — pokazuje, na czym ta decyzja ma się oprzeć.
      key: "review",
      title: t("close.reviewTitle"),
      description: t("close.reviewDescription"),
      render: () => (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Stat
              value={t("close.ofTotal", { done: tree.done, total: tree.total })}
              label={t("close.statSubpoints")}
            />
            <Stat
              value={t("close.ofTotal", { done: completedPoints, total: allPoints })}
              label={t("close.statPoints")}
            />
          </div>

          {skippedOptional.length > 0 ? (
            <div className="rounded-2xl border border-white/[0.07] bg-[var(--surface)] px-5 py-4">
              <p className="text-[13px] font-medium text-white">
                {t("close.skippedOptional", { count: skippedOptional.length })}
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--text-subtle)]">
                {t("close.skippedOptionalHint")}
              </p>
              <ul className="mt-2.5 flex max-h-[28vh] flex-col gap-1.5 overflow-y-auto pr-1">
                {skippedOptional.map((item, index) => (
                  <li
                    key={`${item.point}-${index}`}
                    className="text-[12.5px] text-[var(--text-muted)]"
                  >
                    {item.title}
                    <span className="text-[var(--text-subtle)]"> · {item.point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <Link
            href={`/app/stage/summary?stage=${tree.templateKey}`}
            className="inline-flex items-center gap-2 self-start rounded-lg border border-white/10 px-3.5 py-2 text-[13px] text-[var(--text-muted)] transition-colors hover:border-white/22 hover:text-white"
          >
            <FileText className="size-4" />
            {t("close.readAll")}
          </Link>

          <p className="text-[12.5px] leading-relaxed text-[var(--text-subtle)]">
            {t("close.noJudgement")}
          </p>
        </div>
      ),
    },
    {
      key: "decision",
      title: t("close.decisionTitle", { stage: tree.title }),
      description: t("close.decisionDescription"),
      canContinue: decision !== null,
      render: () => (
        <div className="flex flex-col gap-2.5">
          {/* Mentor doradza przed wyborem — decyzja zostaje przy zespole. */}
          <MentorPanel
            className="mb-1"
            startupStageId={tree.startupStageId}
            scope="stage"
            label={t("close.askMentor")}
          />
          {STAGE_DECISIONS.map((key) => {
            const copy = STAGE_DECISION_COPY[key];
            const selected = decision === key;
            const locked = key === "archive" && !canArchive;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setDecision(key)}
                disabled={locked}
                title={locked ? t("close.archiveFounderOnly") : undefined}
                aria-pressed={selected}
                className={cn(
                  "rounded-2xl border px-5 py-4 text-left transition-colors",
                  locked && "cursor-not-allowed opacity-50",
                  selected
                    ? "border-[var(--vairo)]/60 bg-[var(--vairo)]/8"
                    : "border-white/10 bg-[var(--surface)] hover:border-white/22"
                )}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex size-[18px] shrink-0 items-center justify-center rounded-full border",
                      selected
                        ? "border-[var(--vairo)] bg-[var(--vairo)] text-black"
                        : "border-white/25"
                    )}
                    aria-hidden="true"
                  >
                    {selected ? <Check className="size-3" strokeWidth={3} /> : null}
                  </span>
                  <span
                    className={cn(
                      "text-[15px] font-semibold",
                      copy.tone === "danger"
                        ? "text-[var(--danger)]"
                        : copy.tone === "warning"
                          ? "text-[var(--warning)]"
                          : "text-white"
                    )}
                  >
                    {t(`decision.${key}.label`)}
                  </span>
                </span>
                <span className="mt-1.5 block pl-[26px] text-[13.5px] leading-relaxed text-[var(--text-muted)]">
                  {locked ? t("close.founderDecides") : t(`decision.${key}.description`)}
                </span>
              </button>
            );
          })}
        </div>
      ),
    },
  ];

  if (decision === "pivot") {
    steps.push({
      key: "reopen",
      title: t("close.reopenTitle"),
      description: t("close.reopenDescription"),
      optional: true,
      help:
        reopen.length > 0
          ? t("close.reopenCount", { count: reopen.length })
          : t("close.reopenNone"),
      render: () => (
        <div className="flex max-h-[46vh] flex-col gap-4 overflow-y-auto pr-1">
          {tree.categories.map((category) => (
            <div key={category.id}>
              {tree.showCategories ? (
                <p className="mb-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-[var(--text-subtle)]">
                  {category.title}
                </p>
              ) : null}
              <ul className="flex flex-col gap-1">
                {category.points.flatMap((point) =>
                  point.subpoints.map((subpoint) => {
                    const checked = reopen.includes(subpoint.id);
                    return (
                      <li key={subpoint.id}>
                        <button
                          type="button"
                          onClick={() => toggleReopen(subpoint.id)}
                          aria-pressed={checked}
                          className={cn(
                            "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                            checked
                              ? "bg-[var(--warning)]/10"
                              : "hover:bg-white/[0.05]"
                          )}
                        >
                          <span
                            className={cn(
                              "mt-0.5 inline-flex size-[18px] shrink-0 items-center justify-center rounded-md border",
                              checked
                                ? "border-[var(--warning)] bg-[var(--warning)] text-black"
                                : "border-white/25"
                            )}
                            aria-hidden="true"
                          >
                            {checked ? (
                              <Check className="size-3" strokeWidth={3} />
                            ) : null}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[13.5px] leading-snug text-white">
                              {subpoint.title}
                            </span>
                            <span className="mt-0.5 block truncate text-[12px] text-[var(--text-subtle)]">
                              {point.title}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          ))}
        </div>
      ),
    });
  }

  steps.push({
    key: "note",
    title: t("close.noteTitle"),
    description: t("close.noteDescription"),
    optional: true,
    help:
      decision === "archive"
        ? t("close.archiveHelp")
        : decision === "pause"
          ? t("close.pauseHelp")
          : undefined,
    render: () => (
      <div>
        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={6}
          maxLength={2000}
          placeholder={t("close.notePlaceholder")}
        />
        {decision ? (
          <div
            className={cn(
              "mt-4 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-[13px] leading-relaxed",
              STAGE_DECISION_COPY[decision].tone === "danger"
                ? "border-[var(--danger)]/30 bg-[var(--danger)]/8 text-[var(--danger)]"
                : STAGE_DECISION_COPY[decision].tone === "warning"
                  ? "border-[var(--warning)]/30 bg-[var(--warning)]/8 text-[var(--warning)]"
                  : "border-[var(--vairo)]/30 bg-[var(--vairo)]/8 text-[var(--vairo)]"
            )}
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              {t("close.yourDecision")} <strong>{t(`decision.${decision}.label`)}</strong>.{" "}
              {t(`decision.${decision}.description`)}
            </span>
          </div>
        ) : null}
      </div>
    ),
  });

  return (
    <Portal>
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[var(--bg)]/97 backdrop-blur-sm">
      <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 py-10 sm:px-8">
        <div className="mb-6 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] text-[var(--text-subtle)] transition-colors hover:bg-white/6 hover:text-white"
          >
            <X className="size-4" />
            {t("close.notNow")}
          </button>
        </div>

        <StepWizard
          steps={steps}
          finishLabel={
            decision ? t("close.saveDecision", { decision: t(`decision.${decision}.label`) }) : tc("actions.save")
          }
          finishing={saving}
          error={error}
          onFinish={() =>
            decision &&
            onConfirm({ decision, note, reopenSubpointIds: reopen })
          }
        />
      </div>
    </div>
    </Portal>
  );
}

/** Jedna liczba z podpisem — bez wykresów i bez oceny. */
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[var(--surface)] px-5 py-4">
      <p className="tabular font-heading text-[22px] font-semibold text-white">
        {value}
      </p>
      <p className="mt-0.5 text-[12.5px] leading-snug text-[var(--text-subtle)]">
        {label}
      </p>
    </div>
  );
}
