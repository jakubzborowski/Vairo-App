"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { MenuSelect } from "@/components/ui/menu-select";
import { Modal } from "@/components/ui/modal";
import { plainPreview } from "@/lib/markdown";
import { proofGap, proofMatches } from "@/lib/proof";
import { cn } from "@/lib/utils";
import type {
  GoalItem,
  LibraryPick,
  ProofDraft,
  ProofSnapshot,
  WorkflowPick,
} from "@/types/goals";


import { useT } from "@/i18n/client";
import { useGoalFormat } from "@/components/goals/goal-format-hook";
/**
 * Dodanie dowodu — krótka decyzja, więc okno. Oczekiwanie stoi nad polem,
 * żeby było wiadomo, na co się odpowiada. Przycisk nazywa skutek.
 *
 * Braki pokazujemy dopiero po kliknięciu, przy polu — wyszarzony przycisk
 * bez słowa wyjaśnienia czytał się jak „coś jest zepsute".
 */
export function ProofModal({
  goal,
  goals,
  files,
  workflows,
  documents = [],
  pending,
  error,
  onSubmit,
  onClose,
}: {
  goal: GoalItem;
  goals: GoalItem[];
  files: LibraryPick[];
  workflows: WorkflowPick[];
  /** Dokumenty zespołu — tekst dowodu można wstawić z jednego z nich. */
  documents?: { id: string; title: string; body: string }[];
  pending: boolean;
  error: string | null;
  onSubmit: (proof: ProofDraft) => void;
  onClose: () => void;
}) {
  const { proofKindWord } = useGoalFormat();
  const t = useT("goals");
  const requirement = goal.proofRequirement;
  const kind = requirement.kind;
  const [text, setText] = useState("");
  const [docId, setDocId] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [option, setOption] = useState(requirement.options?.[0]?.value ?? "");
  const [scale, setScale] = useState(requirement.min ?? 1);
  const [fileId, setFileId] = useState(files[0]?.id ?? "");
  const [flowId, setFlowId] = useState(workflows[0]?.id ?? "");
  const [goalIds, setGoalIds] = useState<string[]>([]);
  const [tried, setTried] = useState(false);

  const preview = previewSnapshot();
  const ready = proofMatches(requirement, preview);
  const missing = tried && !ready ? proofGap(t, requirement) : null;
  const blocked =
    (kind === "file" && files.length === 0) ||
    (kind === "module_result" && workflows.length === 0);

  function previewSnapshot(): ProofSnapshot | null {
    if (kind === "sentence" || kind === "long_text") return { kind, text };
    if (kind === "select") return { kind, option };
    if (kind === "scale") return { kind, scale };
    if (kind === "link") return { kind, url, note };
    if (kind === "file") {
      const file = files.find((item) => item.id === fileId);
      return file ? { kind, file: { path: file.path, name: file.name } } : null;
    }
    if (kind === "module_result") {
      const flow = workflows.find((item) => item.id === flowId);
      return flow ? { kind, module: "workflow", workflow_id: flow.id, version: flow.version } : null;
    }
    if (kind === "goal_set") return { kind, goal_ids: goalIds };
    return null;
  }

  function draft(): ProofDraft {
    switch (kind) {
      case "sentence":
      case "long_text":
        return { kind, text, ...(docId ? { docId } : {}) };
      case "select":
        return { kind, option };
      case "scale":
        return { kind, scale };
      case "link":
        return { kind, url, note };
      case "file":
        return { kind, fileId };
      case "module_result":
        return { kind, workflowId: flowId };
      case "goal_set":
        return { kind, goalIds };
    }
  }

  const submit = () => {
    setTried(true);
    if (!ready) return;
    onSubmit(draft());
  };

  const doneGoals = goals.filter(
    (item) => item.id !== goal.id && item.status === "completed" && !item.archivedAt
  );

  return (
    <Modal
      title={t("proofModal.dodajDowod")}
      description={t("proofModal.celTitle", { title: goal.title })}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("proofModal.anuluj")}
          </Button>
          <Button loading={pending} disabled={blocked} onClick={submit}>
            {t("proofModal.zatwierdzIUkonczCel")}
          </Button>
        </>
      }
    >
      <div className="rounded-xl border border-white/[0.08] bg-[var(--surface-2)] px-4 py-3">
        <p className="text-[12px] text-[var(--text-subtle)]">{t("proofModal.czegoOczekujemy")}</p>
        <p className="mt-0.5 text-[14px] text-white">{requirement.label}</p>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-[13px] font-medium text-[var(--text-muted)]">
          {t("proofModal.waszDowodKind", { kind: proofKindWord(kind) })}
        </p>

        {(kind === "sentence" || kind === "long_text") && documents.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12.5px] text-[var(--text-subtle)]">{t("proofModal.maszToJuzW")}</span>
            <MenuSelect
              size="sm"
              className="w-auto min-w-[220px] max-w-full"
              ariaLabel={t("proofModal.wstawZDokumentow")}
              value={docId ?? ""}
              onChange={(id) => {
                const doc = documents.find((item) => item.id === id);
                if (!doc) {
                  setDocId(null);
                  return;
                }
                setDocId(doc.id);
                setText(
                  kind === "sentence"
                    ? (plainPreview(doc.body, 1)[0] ?? doc.title).replace(/^• /, "")
                    : plainPreview(doc.body, 400).join("\n")
                );
              }}
              options={[
                { value: "", label: t("proofModal.wstawZDokumentow2") },
                ...documents.map((doc) => ({ value: doc.id, label: doc.title })),
              ]}
            />
          </div>
        ) : null}
        {kind === "sentence" || kind === "long_text" ? (
          <Field error={missing}>
            {({ id, invalid }) =>
              kind === "sentence" ? (
                <Input
                  id={id}
                  aria-invalid={invalid}
                  aria-label={t("proofModal.dowod")}
                  autoFocus
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                />
              ) : (
                <Textarea
                  id={id}
                  aria-invalid={invalid}
                  aria-label={t("proofModal.dowod")}
                  autoFocus
                  rows={6}
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                />
              )
            }
          </Field>
        ) : null}

        {kind === "link" ? (
          <>
            <Field error={missing}>
              {({ id, invalid }) => (
                <Input
                  id={id}
                  aria-invalid={invalid}
                  aria-label={t("proofModal.address")}
                  autoFocus
                  inputMode="url"
                  placeholder="https://"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                />
              )}
            </Field>
            <Field label={t("proofModal.coTamJestOpcjonalnie")}>
              {({ id }) => (
                <Input id={id} value={note} onChange={(event) => setNote(event.target.value)} />
              )}
            </Field>
          </>
        ) : null}

        {kind === "select" ? (
          <MenuSelect
            ariaLabel={t("proofModal.odpowiedz")}
            value={option}
            onChange={setOption}
            options={(requirement.options ?? []).map((item) => ({
              value: item.value,
              label: item.label,
            }))}
          />
        ) : null}

        {kind === "scale" ? (
          <div role="radiogroup" aria-label={t("proofModal.rating")} className="flex gap-2">
            {Array.from(
              { length: (requirement.max ?? 5) - (requirement.min ?? 1) + 1 },
              (_, index) => (requirement.min ?? 1) + index
            ).map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={scale === value}
                onClick={() => setScale(value)}
                className={cn(
                  "tabular inline-flex size-11 items-center justify-center rounded-xl text-[15px] font-medium transition-colors",
                  scale === value
                    ? "bg-[var(--vairo)]/15 text-white ring-1 ring-inset ring-[var(--vairo)]/60"
                    : "bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-white"
                )}
              >
                {value}
              </button>
            ))}
          </div>
        ) : null}

        {kind === "file" ? (
          files.length > 0 ? (
            <MenuSelect
              ariaLabel={t("proofModal.plikZBiblioteki")}
              value={fileId}
              onChange={setFileId}
              options={files.map((file) => ({ value: file.id, label: file.name }))}
            />
          ) : (
            <p className="text-[13px] leading-relaxed text-[var(--text-subtle)]">
              {t("proofModal.bibliotekaPlikowJestPusta")}
              <Link href="/app/files" className="text-white underline underline-offset-4">
                {t("proofModal.inFiles")}
              </Link>
              {t("proofModal.aPotemWrocTutaj")}
            </p>
          )
        ) : null}

        {kind === "module_result" ? (
          workflows.length > 0 ? (
            <MenuSelect
              ariaLabel={t("proofModal.wersjaRozpiski")}
              value={flowId}
              onChange={setFlowId}
              options={workflows.map((flow) => ({
                value: flow.id,
                label: t("proofModal.titleWersjaVersion", { title: flow.title, version: flow.version }),
              }))}
            />
          ) : (
            <p className="text-[13px] leading-relaxed text-[var(--text-subtle)]">
              {t("proofModal.nieMaJeszczeZapisanej")}
              <Link href="/app/workflows" className="text-white underline underline-offset-4">
                {t("proofModal.inWorkflow")}
              </Link>
              {t("proofModal.aPotemWrocTutaj2")}
            </p>
          )
        ) : null}

        {kind === "goal_set" ? (
          doneGoals.length > 0 ? (
            <ul className="flex flex-col gap-1.5">
              {doneGoals.map((item) => (
                <li key={item.id}>
                  <label className="flex min-h-11 items-center gap-2.5 text-[14px] text-white">
                    <input
                      type="checkbox"
                      className="size-4 accent-[var(--vairo)]"
                      checked={goalIds.includes(item.id)}
                      onChange={(event) =>
                        setGoalIds(
                          event.target.checked
                            ? [...goalIds, item.id]
                            : goalIds.filter((id) => id !== item.id)
                        )
                      }
                    />
                    {item.title}
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-[var(--text-subtle)]">
              {t("proofModal.zespolNieMaJeszcze")}
            </p>
          )
        ) : null}

        {missing && kind !== "sentence" && kind !== "long_text" && kind !== "link" ? (
          <p role="alert" className="text-[12.5px] text-[var(--danger)]">
            {missing}
          </p>
        ) : null}
      </div>

      <p className="text-[12.5px] leading-relaxed text-[var(--text-subtle)]">
        {t("proofModal.zapiszemyKopieTegoDowodu")}
      </p>

      {error ? (
        <p role="alert" className="text-[13px] text-[var(--danger)]">
          {error}
        </p>
      ) : null}
    </Modal>
  );
}
