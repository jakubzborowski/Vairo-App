"use client";

import { useRef, useState } from "react";
import { Lightbulb, ListChecks, Loader2, MessageSquareText, Sparkles, Wand2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { VoiceButton, appendDictation } from "@/components/ui/voice-button";
import { cn } from "@/lib/utils";
import { fieldAnswered, type StageField } from "@/types/stage";
import { useAiEnabled } from "./ai-context";
import { useT } from "@/i18n/client";

type Mode = "hint" | "review" | "organize" | "mentor";

const TEXT_KINDS = new Set(["short_text", "long_text"]);
const LIST_KINDS = new Set(["list_short", "list_long"]);
const REVIEW_KINDS = new Set([...TEXT_KINDS, ...LIST_KINDS, "sentence_template", "records"]);

/** Strumień tekstu z /api/ai/assist; błąd z JSON-a zamienia na komunikat. */
async function streamAssist(
  body: Record<string, unknown>,
  onChunk: (text: string) => void,
  signal: AbortSignal,
  fallbackError: string
) {
  const response = await fetch("/api/ai/assist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok || !response.body) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? fallbackError);
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
}

function AiPanel({
  title,
  text,
  loading,
  error,
  onClose,
  children,
}: {
  title: string;
  text: string;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  children?: React.ReactNode;
}) {
  const t = useT("ai");
  const tc = useT("common");
  return (
    <div className="mt-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-[var(--text-subtle)]">
          <Sparkles className="size-3.5" aria-hidden="true" />
          {title}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label={tc("actions.close")}
          className="grid size-7 place-items-center rounded-md text-[var(--text-subtle)] hover:bg-white/[0.06] hover:text-white"
        >
          <X className="size-3.5" />
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-1.5 text-[13px] text-[var(--danger-text)]">{error}</p>
      ) : (
        <div aria-live="polite" className="mt-1.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-[var(--text-muted)]">
          {text}
          {loading ? (
            <span className="ml-1 inline-flex items-center gap-1 text-[var(--text-subtle)]">
              <Loader2 className="size-3 animate-spin" aria-hidden="true" />
              {text ? "" : t("thinking")}
            </span>
          ) : null}
        </div>
      )}
      {children}
      {!loading && !error && text ? (
        <p className="mt-2 text-[11.5px] text-[var(--text-faint)]">
          {t("disclaimer")}
        </p>
      ) : null}
    </div>
  );
}

function useStream() {
  const t = useT("ai");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  const run = async (body: Record<string, unknown>) => {
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setText("");
    setError(null);
    setLoading(true);
    try {
      await streamAssist(body, (chunk) => setText((prev) => prev + chunk), controller.signal, t("errors.noAnswer"));
    } catch (err) {
      if ((err as { name?: string })?.name !== "AbortError") {
        setError(err instanceof Error ? err.message : t("errors.noAnswer"));
      }
    } finally {
      setLoading(false);
    }
  };
  const reset = () => {
    abort.current?.abort();
    setText("");
    setError(null);
    setLoading(false);
  };
  return { text, loading, error, run, reset };
}

/**
 * Mentor przy pytaniu: „Podpowiedz”, „Oceń moją odpowiedź”, „Uporządkuj
 * notatki”. Nic nie trafia do pola bez kliknięcia „Wstaw” — i nawet wtedy
 * są to wyłącznie informacje z notatek zespołu.
 */
export function FieldAiAssist({
  field,
  value,
  startupStageId,
  onChange,
  disabled,
}: {
  field: StageField;
  value: unknown;
  startupStageId: string;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}) {
  const t = useT("ai");
  const tc = useT("common");
  const enabled = useAiEnabled();
  const [mode, setMode] = useState<Mode | null>(null);
  const stream = useStream();
  const [notes, setNotes] = useState("");
  const [draft, setDraft] = useState<{ items?: string[]; text?: string; missing?: string } | null>(null);
  const [organizing, setOrganizing] = useState(false);
  const [organizeError, setOrganizeError] = useState<string | null>(null);

  if (!enabled || disabled) return null;

  const canOrganize = TEXT_KINDS.has(field.kind) || LIST_KINDS.has(field.kind);
  const canReview = REVIEW_KINDS.has(field.kind) && fieldAnswered(field, value);

  const open = (next: Mode) => {
    stream.reset();
    setDraft(null);
    setOrganizeError(null);
    setMode(next);
    if (next === "hint" || next === "review") {
      void stream.run({ mode: next, startupStageId, answerKey: field.answerKey, draft: value });
    }
  };

  const organize = async () => {
    setOrganizing(true);
    setOrganizeError(null);
    setDraft(null);
    try {
      const response = await fetch("/api/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "organize", startupStageId, answerKey: field.answerKey, notes }),
      });
      const data = (await response.json().catch(() => null)) as
        | { items?: string[]; text?: string; missing?: string; error?: string }
        | null;
      if (!response.ok || !data) throw new Error(data?.error ?? t("errors.noAnswer"));
      if ((data.items?.length ?? 0) === 0 && !data.text) {
        throw new Error(data.missing || t("organize.nothing"));
      }
      setDraft(data);
    } catch (err) {
      setOrganizeError(err instanceof Error ? err.message : t("errors.noAnswer"));
    } finally {
      setOrganizing(false);
    }
  };

  const insert = () => {
    if (!draft) return;
    if (LIST_KINDS.has(field.kind)) {
      const current = Array.isArray(value) ? value.filter((v): v is string => typeof v === "string" && v.trim().length > 0) : [];
      const merged = [...current, ...(draft.items ?? []).filter((item) => !current.includes(item))];
      onChange(merged);
    } else if (draft.text) {
      const base = typeof value === "string" ? value : "";
      onChange(base ? appendDictation(base, (field.kind === "long_text" ? "\n\n" : "") + draft.text, field.config.max) : draft.text.slice(0, field.config.max ?? undefined));
    }
    setMode(null);
    setDraft(null);
    setNotes("");
  };

  const button = (target: Mode, label: string, Icon: typeof Lightbulb) => (
    <button
      type="button"
      onClick={() => (mode === target ? setMode(null) : open(target))}
      aria-pressed={mode === target}
      className={cn(
        "inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] transition-colors",
        mode === target ? "bg-white/[0.08] text-white" : "text-[var(--text-subtle)] hover:bg-white/[0.06] hover:text-white"
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </button>
  );

  return (
    <div className="mt-1">
      <div className="flex flex-wrap items-center gap-1">
        {button("hint", t("buttons.hint"), Lightbulb)}
        {canReview ? button("review", t("buttons.review"), MessageSquareText) : null}
        {canOrganize ? button("organize", t("buttons.organize"), ListChecks) : null}
      </div>

      {mode === "hint" || mode === "review" ? (
        <AiPanel
          title={mode === "hint" ? t("panel.hint") : t("panel.review")}
          text={stream.text}
          loading={stream.loading}
          error={stream.error}
          onClose={() => {
            stream.reset();
            setMode(null);
          }}
        />
      ) : null}

      {mode === "organize" ? (
        <div className="mt-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-3">
          <p className="text-[12.5px] leading-relaxed text-[var(--text-muted)]">
            {t("organize.intro")}
          </p>
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            maxLength={8000}
            className="mt-2"
            placeholder={t("organize.placeholder")}
          />
          <VoiceButton onText={(text) => setNotes((prev) => appendDictation(prev, text, 8000))} />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" onClick={organize} disabled={organizing || !notes.trim()}>
              {organizing ? <Loader2 className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}
              {organizing ? t("organize.working") : t("organize.run")}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setMode(null)}>
              {tc("actions.cancel")}
            </Button>
          </div>
          {organizeError ? (
            <p role="alert" className="mt-2 text-[13px] text-[var(--danger-text)]">{organizeError}</p>
          ) : null}
          {draft ? (
            <div className="mt-3 rounded-lg border border-dashed border-white/15 px-3 py-2.5">
              <p className="text-[11.5px] font-semibold uppercase tracking-wide text-[var(--text-subtle)]">
                {t("organize.draft")}
              </p>
              {draft.items ? (
                <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[13.5px] text-[var(--text-muted)]">
                  {draft.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] text-[var(--text-muted)]">{draft.text}</p>
              )}
              {draft.missing ? (
                <p className="mt-2 text-[12.5px] text-[var(--text-subtle)]">{t("organize.missing", { missing: draft.missing })}</p>
              ) : null}
              <div className="mt-2.5 flex gap-2">
                <Button size="sm" onClick={insert}>
                  {t("organize.insert")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDraft(null)}>
                  {tc("actions.discard")}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Mentor dla całego punktu albo etapu: najsłabsze miejsca, ryzyka i następne
 * eksperymenty. Przy decyzji o etapie tylko doradza — wybór zostaje przy
 * zespole.
 */
export function MentorPanel({
  startupStageId,
  scope,
  pointKey,
  label,
  className,
}: {
  startupStageId: string;
  scope: "point" | "stage";
  pointKey?: string;
  label: string;
  className?: string;
}) {
  const t = useT("ai");
  const enabled = useAiEnabled();
  const [open, setOpen] = useState(false);
  const stream = useStream();
  if (!enabled) return null;

  return (
    <div className={className}>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => {
          setOpen(true);
          void stream.run({ mode: "mentor", startupStageId, scope, pointKey });
        }}
        disabled={stream.loading}
      >
        <Sparkles className="size-3.5" />
        {label}
      </Button>
      {open ? (
        <AiPanel
          title={scope === "stage" ? t("panel.stage") : t("panel.point")}
          text={stream.text}
          loading={stream.loading}
          error={stream.error}
          onClose={() => {
            stream.reset();
            setOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}
