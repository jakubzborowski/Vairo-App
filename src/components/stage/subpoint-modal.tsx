"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Check, Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, plural } from "@/lib/utils";
import {
  emptyValueFor,
  fieldAnswered,
  isSkipped,
  templateSlotPattern,
  type StageField,
  type StageSubpoint,
  type StageTree,
} from "@/types/stage";
import { AnswerView } from "./answer-view";
import { FieldInput } from "./field-input";
import { validateField } from "./field-inputs";
import { SummaryField, type ResolvedSource } from "./summary-field";

type Props = {
  tree: StageTree;
  subpoint: StageSubpoint;
  pointTitle: string;
  answers: Record<string, unknown>;
  saving: boolean;
  error: string | null;
  /** Rola Czlonka: te same tresci, ale do czytania, nie do edycji. */
  readOnly?: boolean;
  onClose: () => void;
  onSave: (answers: Record<string, unknown>) => void;
};

/**
 * Modal jednego podpunktu — formularz z kilkoma pytaniami (zwykle 2–5).
 *
 * Zamknięcie z niezapisanymi zmianami prosi o potwierdzenie; nie chcemy,
 * żeby kliknięcie w tło skasowało pięć minut pisania.
 */
export function SubpointModal({
  tree,
  subpoint,
  pointTitle,
  answers,
  saving,
  error,
  readOnly = false,
  onClose,
  onSave,
}: Props) {
  const initial = useMemo(() => {
    const draft: Record<string, unknown> = {};
    for (const field of subpoint.fields) {
      draft[field.answerKey] = answers[field.answerKey] ?? emptyValueFor(field.kind);
      if (field.kind === "summary") {
        for (const source of field.config.sources ?? []) {
          const resolved = resolvePath(tree, source.field);
          if (resolved) {
            draft[resolved.answerKey] =
              answers[resolved.answerKey] ?? emptyValueFor(resolved.kind);
          }
        }
      }
    }
    return draft;
  }, [subpoint, answers, tree]);

  const [draft, setDraft] = useState(initial);
  const [confirmClose, setConfirmClose] = useState(false);
  const [attemptedSave, setAttemptedSave] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const dirty = useMemo(
    () =>
      Object.keys(initial).some(
        (key) => JSON.stringify(draft[key]) !== JSON.stringify(initial[key])
      ),
    [draft, initial]
  );

  // Pusta lista przy `empty_ok` jest odpowiedzią („niczego nie brakuje”),
  // ale wygląda identycznie jak brak zapisu. Bez tego „Zapisz” zostaje
  // wyłączone i podpunktu nie da się domknąć.
  const canConfirmEmpty = subpoint.fields.some(
    (field) =>
      field.config.empty_ok &&
      field.isRequired &&
      !fieldAnswered(field, answers[field.answerKey]) &&
      fieldAnswered(field, draft[field.answerKey])
  );

  const missing = subpoint.fields.filter(
    (f) => f.isRequired && !fieldAnswered(f, draft[f.answerKey])
  );
  const skippedCount = subpoint.fields.filter((f) => isSkipped(draft[f.answerKey])).length;

  // Pytanie → treść, po kluczu odpowiedzi — do podglądu odpowiedzi z innych
  // punktów (`config.show_answers`).
  const fieldByKey = useMemo(() => {
    const map = new Map<string, StageField>();
    for (const category of tree.categories)
      for (const point of category.points)
        for (const sub of point.subpoints)
          for (const f of sub.fields) map.set(f.answerKey, f);
    return map;
  }, [tree]);

  const extrasFor = (field: (typeof subpoint.fields)[number]) => {
    const { rows_from: rowsFrom, show_answers: showAnswers } = field.config;
    const rowLabels = rowsFrom
      ? [...new Set(answerItems(answers[rowsFrom]))].slice(0, 20)
      : undefined;
    const references = showAnswers
      ?.map((key) => {
        const source = fieldByKey.get(key);
        return {
          question: source?.question ?? "",
          text: answerText(answers[key], source?.config.template),
        };
      })
      .filter((ref) => ref.question && ref.text);
    return { rowLabels, references };
  };
  const goalsOpen = (subpoint.goalConditions ?? []).filter(
    (condition) => condition.done < condition.minCount
  );

  // Odpowiedzi krótsze niż sugerowane minimum. To wskazówka, nie blokada —
  // pokazujemy ją dopiero po kliknięciu „Zapisz" i nigdy nie zamykamy drogi.
  const tooShort = subpoint.fields.filter(
    (f) => fieldAnswered(f, draft[f.answerKey]) && validateField(f, draft[f.answerKey])
  );

  // Focus tylko przy otwarciu. Wcześniej ten efekt zależał od `dirty`,
  // więc pierwszy wpisany znak przeliczał go na nowo i zabierał focus z pola.
  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  const patch = (answerKey: string, value: unknown) =>
    setDraft((prev) => ({ ...prev, [answerKey]: value }));

  // W trybie odczytu nie ma czego tracic, wiec nie pytamy o potwierdzenie.
  const tryClose = () => (dirty && !readOnly ? setConfirmClose(true) : onClose());

  // Escape obsługujemy na samym dialogu, nie na dokumencie — dzięki temu
  // handler nie musi być przepinany przy każdej zmianie `dirty`.
  const onDialogKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "Escape") return;
    event.stopPropagation();
    tryClose();
  };

  // Pierwsze kliknięcie „Zapisz" przy zbyt krótkich odpowiedziach tylko
  // pokazuje podpowiedzi. Drugie zapisuje mimo nich — user decyduje sam.
  const trySave = () => {
    if (tooShort.length > 0 && !attemptedSave) {
      setAttemptedSave(true);
      return;
    }
    onSave(draft);
  };

  const showSoftHints = attemptedSave && tooShort.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <button
        type="button"
        aria-label="Zamknij"
        onClick={tryClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={subpoint.title}
        tabIndex={-1}
        onKeyDown={onDialogKeyDown}
        className="relative my-auto w-full max-w-[680px] overflow-hidden rounded-2xl border border-white/10 bg-[var(--surface)] lift-3 edge-accent outline-none"
      >
        <header className="flex items-start justify-between gap-4 border-b border-white/[0.07] px-6 py-5">
          <div className="min-w-0">
            <p className="text-[12px] font-medium text-[var(--text-faint)]">
              {pointTitle}
            </p>
            <h2 className="mt-1 font-heading text-[19px] font-semibold text-white">
              {subpoint.title}
            </h2>
            {subpoint.description ? (
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--text-subtle)]">
                {subpoint.description}
              </p>
            ) : null}
            {subpoint.alsoIn.length > 0 ? (
              <p className="mt-2 text-[12px] text-[var(--text-faint)]">
                To pytanie dotyczy też: {subpoint.alsoIn.join(", ")} — odpowiadasz raz.
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={tryClose}
            aria-label="Zamknij"
            className="shrink-0 rounded-lg p-1.5 text-[var(--text-faint)] transition-colors hover:bg-white/6 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="flex flex-col gap-5 px-6 py-6">
          {readOnly
            ? subpoint.fields.map((field) => (
                <AnswerView
                  key={field.id}
                  field={field}
                  value={draft[field.answerKey]}
                />
              ))
            : subpoint.fields.map((field) =>
            field.kind === "summary" ? (
              <SummaryField
                key={field.id}
                field={field}
                value={draft[field.answerKey]}
                sources={resolveSources(tree, field.config.sources ?? [])}
                answers={draft}
                onChangeAnswer={patch}
                onChange={(value) => patch(field.answerKey, value)}
                disabled={saving}
                startupStageId={tree.startupStageId}
              />
            ) : (
              <FieldInput
                key={field.id}
                field={field}
                value={draft[field.answerKey]}
                onChange={(value) => patch(field.answerKey, value)}
                disabled={saving}
                startupStageId={tree.startupStageId}
                showErrors={attemptedSave}
                returnTo={`/app/stage?stage=${tree.templateKey}&subpoint=${subpoint.id}`}
                canSkip
                {...extrasFor(field)}
              />
            )
          )}
          {subpoint.goalConditions.length > 0 ? (
            <div className="rounded-xl border border-white/10 px-4 py-3">
              <p className="text-[13px] font-medium text-white">Cele, które zaliczają ten punkt</p>
              <ul className="mt-2 flex flex-col gap-1.5">
                {subpoint.goalConditions.map((condition) => (
                  <li key={condition.id} className="text-[13px] text-[var(--text-muted)]">
                    {condition.label} {condition.done}/{condition.minCount}
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button href="/app/goals" variant="secondary" size="sm">
                  Otwórz powiązane cele
                </Button>
                <Button
                  href={`/app/goals/new?condition=${subpoint.goalConditions[0]?.id ?? ""}`}
                  size="sm"
                >
                  Dodaj cel
                </Button>
                <Button
                  href={`/app/goals?condition=${subpoint.goalConditions[0]?.id ?? ""}&link=1`}
                  variant="ghost"
                  size="sm"
                >
                  Podepnij istniejący
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        {readOnly ? (
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] px-6 py-4">
            <p className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--text-subtle)]">
              <Lock className="size-3.5 shrink-0" />
              Tylko do odczytu — odpowiedzi zmieniają Founder i Admin.
            </p>
            <Button variant="secondary" onClick={onClose}>
              Zamknij
            </Button>
          </footer>
        ) : (
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] px-6 py-4">
          <div className="min-w-0">
            {error ? (
              <p className="flex items-center gap-1.5 text-[13px] text-[var(--danger)]">
                <AlertCircle className="size-3.5 shrink-0" />
                {error}
              </p>
            ) : showSoftHints ? (
              <p className="text-[12.5px] text-[var(--warning)]">
                {tooShort.length === 1
                  ? "Jedna odpowiedź jest bardzo krótka."
                  : `${tooShort.length} odpowiedzi jest bardzo krótkich.`}{" "}
                Możesz je rozwinąć albo zapisać tak, jak są.
              </p>
            ) : missing.length > 0 ? (
              <p className="text-[12.5px] text-[var(--text-subtle)]">
                Do uzupełnienia: {missing.length}{" "}
                {missing.length === 1 ? "pytanie" : "pytania"}. Możesz zapisać
                częściowo i wrócić.
              </p>
            ) : goalsOpen.length > 0 ? (
              <p className="text-[12.5px] text-[var(--text-subtle)]">
                Zostały cele:{" "}
                {goalsOpen.map((condition) => `${condition.label} ${condition.done}/${condition.minCount}`).join(", ")}.
              </p>
            ) : (
              <span className="inline-flex flex-wrap items-center gap-2">
                <Badge tone="success">
                  <Check className="size-3" />
                  Komplet
                </Badge>
                {skippedCount > 0 ? (
                  <span className="text-[12.5px] text-[var(--text-subtle)]">
                    {skippedCount} {plural(skippedCount, "pytanie pominięte", "pytania pominięte", "pytań pominiętych")}
                  </span>
                ) : null}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={tryClose} disabled={saving}>
              Anuluj
            </Button>
            <Button onClick={trySave} loading={saving} disabled={!dirty && !canConfirmEmpty}>
              {showSoftHints ? "Zapisz mimo to" : "Zapisz"}
            </Button>
          </div>
        </footer>
        )}

        {confirmClose ? (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-sm rounded-xl border border-white/10 bg-[var(--surface-2)] p-5 text-center">
              <p className="text-[15px] font-semibold text-white">
                Masz niezapisane zmiany
              </p>
              <p className="mt-1.5 text-[13px] text-[var(--text-subtle)]">
                Jeśli zamkniesz teraz, przepadną.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Button
                  variant="secondary"
                  block
                  onClick={() => setConfirmClose(false)}
                >
                  Wróć
                </Button>
                <Button variant="danger" block onClick={onClose}>
                  Zamknij bez zapisu
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Ścieżka „punkt.podpunkt.pole” → pole w drzewie etapu. */
function resolvePath(tree: StageTree, path: string) {
  const [pointKey, subpointKey, fieldKey] = path.split(".");
  for (const category of tree.categories) {
    const point = category.points.find((p) => p.key === pointKey);
    const subpoint = point?.subpoints.find((s) => s.key === subpointKey);
    const field = subpoint?.fields.find((f) => f.key === fieldKey);
    if (field) return field;
  }
  return null;
}

function resolveSources(
  tree: StageTree,
  sources: { field: string; label: string }[]
): ResolvedSource[] {
  return sources
    .map(({ field, label }) => {
      const resolved = resolvePath(tree, field);
      return resolved ? { label, field: resolved } : null;
    })
    .filter(Boolean) as ResolvedSource[];
}

export { cn };

/** Pozycje listy jako tekst — pominięte pytanie i puste pozycje odpadają. */
function answerItems(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Odpowiedź jako tekst do podglądu. Zdanie z szablonu składamy z luk —
 * definicja problemu i hipoteza są właśnie takimi zdaniami. Puste albo
 * pominięte pole daje pusty tekst i znika z podglądu.
 */
function answerText(value: unknown, template?: string): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return answerItems(value).join("; ");
  if (template && value && typeof value === "object" && !isSkipped(value)) {
    const slots = value as Record<string, unknown>;
    const filled = Object.values(slots).some((v) => typeof v === "string" && v.trim());
    if (!filled) return "";
    return template.replace(templateSlotPattern(), (_, key: string) => {
      const slot = slots[key];
      return typeof slot === "string" && slot.trim() ? slot.trim() : "…";
    });
  }
  return "";
}
