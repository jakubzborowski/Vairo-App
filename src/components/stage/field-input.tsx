"use client";

import { ChevronDown, Info, Lightbulb, SkipForward } from "lucide-react";
import { useState } from "react";
import {
  CheckmarkInput,
  DateInput,
  LinksInput,
  ListInput,
  LongTextInput,
  MultiSelectInput,
  NumberInput,
  ScaleInput,
  SelectInput,
  ShortTextInput,
  validateField,
  type FieldInputProps,
} from "./field-inputs";
import { SentenceField } from "./sentence-field";
import { StageFilesInput } from "./files-field";
import { RecordsInput } from "./records-field";
import { ActionInput } from "./action-field";
import { PeopleInput } from "./people-field";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  SKIPPED_ANSWER,
  canSkipField,
  emptyValueFor,
  fieldAnswered,
  isSkipped,
  type StageField,
} from "@/types/stage";

/**
 * Jedno pytanie w modalu: treść, podpowiedź, składany przykład i kontrolka
 * dobrana do typu odpowiedzi.
 *
 * Podpowiedź jest widoczna zawsze — to ona tłumaczy, czego oczekujemy.
 * Przykład jest zwinięty, żeby nie podsuwał gotowej odpowiedzi.
 *
 * „Pomiń” stoi przy pustym pytaniu wymaganym. Kto nie chce albo nie umie
 * na nie odpowiedzieć, i tak tego nie zrobi — zamiast zamykać mu drogę
 * dalej, zapisujemy pominięcie. Liczy się ono do postępu, a pytanie czeka
 * z przyciskiem „Odpowiedz jednak”.
 */
export function FieldInput({
  field,
  value,
  onChange,
  disabled,
  startupStageId,
  showErrors,
  returnTo,
  canSkip = false,
  rowLabels,
  references,
}: FieldInputProps & {
  startupStageId: string;
  showErrors?: boolean;
  returnTo?: string;
  /** Pokazuj „Pomiń” — tylko w modalu podpunktu, nie przy poprawianiu podsumowania. */
  canSkip?: boolean;
  /** Odpowiedzi z innych pól (`config.show_answers`) do podejrzenia nad pytaniem. */
  references?: { question: string; text: string }[];
}) {
  const [showExample, setShowExample] = useState(false);
  const skipped = isSkipped(value);
  const offerSkip =
    canSkip && !disabled && !skipped && canSkipField(field) && !fieldAnswered(field, value);
  // Nic nie podpowiadamy w trakcie pisania — człowiek dopiero zaczyna zdanie,
  // a aplikacja już zgłasza problem. Ostrzeżenie pokazuje modal po „Zapisz".
  const warning = showErrors ? validateField(field, value) : null;

  return (
    <div className="border-t border-white/[0.06] pt-5 first:border-t-0 first:pt-0">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[15px] font-medium leading-snug text-white">
          {field.question}
          {!field.isRequired ? (
            <span className="ml-2 align-middle text-[12px] font-normal text-[var(--text-faint)]">
              opcjonalne
            </span>
          ) : null}
        </p>
        {offerSkip ? (
          <button
            type="button"
            onClick={() => onChange(SKIPPED_ANSWER)}
            className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg px-2 text-[12.5px] text-[var(--text-subtle)] transition-colors hover:bg-white/[0.06] hover:text-white sm:min-h-8"
          >
            <SkipForward className="size-3.5" aria-hidden="true" />
            Pomiń
          </button>
        ) : null}
      </div>

      {skipped ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-white/12 px-4 py-3">
          <p className="text-[13px] leading-relaxed text-[var(--text-muted)]">
            Pytanie pominięte. Liczy się do postępu — możesz tu wrócić w każdej chwili.
          </p>
          <Button
            variant="secondary"
            size="sm"
            disabled={disabled}
            onClick={() => onChange(emptyValueFor(field.kind))}
          >
            Odpowiedz jednak
          </Button>
        </div>
      ) : (
        <>
          {/* To pole nadaje nazwę całemu teamowi. Bez tego zdania user za chwilę
              widzi w sidebarze inną nazwę i nie rozumie, skąd się wzięła. */}
          {field.config.syncs_startup_name ? (
            <p className="mt-1.5 flex items-start gap-2 rounded-lg bg-[var(--vairo)]/8 px-3 py-2 text-[12.5px] leading-relaxed text-[var(--text-muted)]">
              <Info
                className="mt-0.5 size-3.5 shrink-0 text-[var(--vairo)]"
                aria-hidden="true"
              />
              <span>
                Tak będzie nazywał się Twój team w całej aplikacji. Zmienisz to
                później w ustawieniach.
              </span>
            </p>
          ) : null}

          {field.help ? (
            <p className="mt-1.5 flex items-start gap-2 text-[13px] leading-relaxed text-[var(--text-subtle)]">
              <Lightbulb
                className="mt-0.5 size-3.5 shrink-0 text-[var(--text-faint)]"
                aria-hidden="true"
              />
              <span>{field.help}</span>
            </p>
          ) : null}

          <div className="mt-3.5">
            {/* Podgląd odpowiedzi z innego punktu — uwaga z redesignu: „nie powinno
                być potrzeby otwierania kolejnego punktu”. */}
            {references && references.length > 0 ? (
              <div className="mb-3 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-3">
                <p className="text-[11.5px] font-semibold uppercase tracking-wide text-[var(--text-subtle)]">
                  Twoje wcześniejsze odpowiedzi
                </p>
                <dl className="mt-1.5 flex flex-col gap-1.5">
                  {references.map((ref) => (
                    <div key={ref.question}>
                      <dt className="text-[12px] text-[var(--text-subtle)]">{ref.question}</dt>
                      <dd className="text-[13.5px] leading-relaxed text-[var(--text-muted)]">{ref.text}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}

            <Control
              field={field}
              value={value}
              onChange={onChange}
              disabled={disabled}
              startupStageId={startupStageId}
              returnTo={returnTo}
              rowLabels={rowLabels}
            />
          </div>

          {warning ? (
            <p className="mt-2 text-[12px] text-[var(--warning)]">{warning}</p>
          ) : null}

          {field.example ? (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowExample((v) => !v)}
                aria-expanded={showExample}
                className="inline-flex items-center gap-1 rounded-md text-[12.5px] text-[var(--text-subtle)] transition-colors hover:text-white"
              >
                <ChevronDown
                  className={cn("size-3.5 transition-transform", showExample && "rotate-180")}
                  aria-hidden="true"
                />
                {showExample ? "Ukryj przykład" : "Zobacz przykład"}
              </button>
              {showExample ? (
                <p className="mt-2 rounded-lg border-l-2 border-[var(--vairo)]/40 bg-white/[0.03] py-2 pl-3 text-[13px] leading-relaxed text-[var(--text-muted)]">
                  {field.example}
                </p>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function Control(props: FieldInputProps & { startupStageId: string; returnTo?: string }) {
  const { field } = props;

  switch (field.kind) {
    case "short_text":
      return <ShortTextInput {...props} />;
    case "long_text":
      return <LongTextInput {...props} />;
    case "list_short":
      return <ListInput {...props} />;
    case "list_long":
      return <ListInput {...props} multiline />;
    case "scale":
      return <ScaleInput {...props} />;
    case "select":
      return <SelectInput {...props} />;
    case "multi_select":
      return <MultiSelectInput {...props} />;
    case "number":
      return <NumberInput {...props} />;
    case "date":
      return <DateInput {...props} />;
    case "links":
      return <LinksInput {...props} />;
    case "checkmark":
      return <CheckmarkInput {...props} />;
    case "files":
      return <StageFilesInput {...props} />;
    case "sentence_template":
      return <SentenceField {...props} />;
    case "records":
      return <RecordsInput {...props} />;
    case "action":
      return <ActionInput {...props} />;
    case "people":
      return <PeopleInput {...props} />;
    default:
      // `summary` renderuje się osobno, poza listą pól — patrz summary-field.tsx
      return (
        <p className="text-[13px] text-[var(--text-faint)]">
          Nieobsługiwany typ pola: {field.kind}
        </p>
      );
  }
}

export type { StageField };
