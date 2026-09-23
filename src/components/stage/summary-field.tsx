"use client";

import { CheckCircle2, Pencil } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { StageField } from "@/types/stage";
import { hasAnswer } from "@/types/stage";
import { FieldInput } from "./field-input";

export type ResolvedSource = {
  label: string;
  field: StageField;
};

type Props = {
  field: StageField;
  value: unknown;
  sources: ResolvedSource[];
  answers: Record<string, unknown>;
  onChangeAnswer: (answerKey: string, value: unknown) => void;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  startupStageId: string;
};

/**
 * Podsumowanie etapu.
 *
 * Nie przechowuje własnej kopii danych — pokazuje odpowiedzi z wcześniejszych
 * podpunktów i pozwala je poprawić w miejscu. Zapis idzie do tych samych pól
 * źródłowych, więc nie ma dwóch wersji prawdy.
 */
export function SummaryField({
  field,
  value,
  sources,
  answers,
  onChangeAnswer,
  onChange,
  disabled,
  startupStageId,
}: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const confirmed = (value as { confirmed?: boolean } | null)?.confirmed === true;

  return (
    <div>
      <ul className="flex flex-col gap-2">
        {sources.map(({ label, field: sourceField }) => {
          const answer = answers[sourceField.answerKey];
          const isEditing = editing === sourceField.answerKey;
          const filled = hasAnswer(answer);

          return (
            <li
              key={sourceField.answerKey}
              className={cn(
                "rounded-xl border px-4 py-3 transition-colors",
                isEditing
                  ? "border-[var(--vairo)]/50 bg-[var(--surface-2)]"
                  : "border-white/8 bg-[var(--surface-2)]"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">
                  {label}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setEditing(isEditing ? null : sourceField.answerKey)
                  }
                  disabled={disabled}
                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[12px] text-[var(--text-subtle)] transition-colors hover:text-white"
                >
                  <Pencil className="size-3" />
                  {isEditing ? "Gotowe" : "Popraw"}
                </button>
              </div>

              {isEditing ? (
                <div className="mt-3">
                  <FieldInput
                    field={sourceField}
                    value={answer}
                    onChange={(next) => onChangeAnswer(sourceField.answerKey, next)}
                    disabled={disabled}
                    startupStageId={startupStageId}
                  />
                </div>
              ) : (
                <p
                  className={cn(
                    "mt-1 text-[14px] leading-relaxed",
                    filled ? "text-white" : "text-[var(--text-faint)] italic"
                  )}
                >
                  {filled ? renderAnswer(answer) : "Jeszcze nieuzupełnione"}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-5 flex items-center gap-3">
        <Button
          onClick={() => onChange({ confirmed: !confirmed, at: Date.now() })}
          variant={confirmed ? "secondary" : "primary"}
          disabled={disabled}
        >
          {confirmed ? (
            <>
              <CheckCircle2 className="size-4" />
              Zatwierdzone
            </>
          ) : (
            (field.config.confirm_label ?? "Zatwierdzam")
          )}
        </Button>
        {!confirmed ? (
          <p className="text-[12.5px] text-[var(--text-subtle)]">
            Sprawdź, czy podsumowanie oddaje to, co chcesz zrobić.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function renderAnswer(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Tak" : "Nie";
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === "object" && item !== null && "name" in item
          ? String((item as { name: string }).name)
          : String(item)
      )
      .filter(Boolean)
      .join(" · ");
  }
  if (typeof value === "object" && value !== null) {
    return Object.values(value as Record<string, unknown>)
      .filter((v) => typeof v === "string" && v.trim())
      .join(" ");
  }
  return "";
}
