"use client";

import { useId, useState } from "react";
import { Plus, X } from "lucide-react";
import { Input, Textarea } from "@/components/ui/input";
import { Pill } from "@/components/ui/pill";
import { cn } from "@/lib/utils";
import type { FieldConfig, StageField } from "@/types/stage";

export type FieldInputProps = {
  field: StageField;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  /** Nagłówki rubryk listy (`config.rows_from`), wyliczone przez modal. */
  rowLabels?: string[];
};

const asString = (value: unknown) => (typeof value === "string" ? value : "");
const asList = (value: unknown): string[] =>
  Array.isArray(value) ? value.map((v) => (typeof v === "string" ? v : String(v ?? ""))) : [];

// ---------------------------------------------------------------------------
// Tekst
// ---------------------------------------------------------------------------

export function ShortTextInput({ field, value, onChange, disabled }: FieldInputProps) {
  return (
    <Input
      value={asString(value)}
      onChange={(e) => onChange(e.target.value)}
      maxLength={field.config.max}
      disabled={disabled}
      placeholder="Twoja odpowiedź…"
    />
  );
}

export function LongTextInput({ field, value, onChange, disabled }: FieldInputProps) {
  return (
    <Textarea
      value={asString(value)}
      onChange={(e) => onChange(e.target.value)}
      maxLength={field.config.max}
      rows={5}
      disabled={disabled}
      placeholder="Twoja odpowiedź…"
    />
  );
}

// ---------------------------------------------------------------------------
// Listy
// ---------------------------------------------------------------------------

/**
 * Lista odpowiedzi. Zawsze pokazuje jedno puste pole na końcu, żeby
 * dodawanie nie wymagało najpierw kliknięcia „dodaj".
 */
export function ListInput({
  field,
  value,
  onChange,
  disabled,
  multiline,
  rowLabels,
}: FieldInputProps & { multiline?: boolean }) {
  if (rowLabels && rowLabels.length > 0) {
    return (
      <LabeledRows
        field={field}
        value={value}
        onChange={onChange}
        disabled={disabled}
        labels={rowLabels}
        multiline={multiline}
      />
    );
  }
  const items = asList(value);
  const config = field.config;
  const max = config.max_items ?? 20;
  const rows = items.length > 0 ? items : [""];
  const canAdd = rows.length < max;

  const update = (index: number, next: string) => {
    const copy = [...rows];
    copy[index] = next;
    onChange(copy.filter((item, i) => item.trim().length > 0 || i === index));
  };

  const remove = (index: number) => {
    onChange(rows.filter((_, i) => i !== index).filter((item) => item.trim().length > 0));
  };

  const Control = multiline ? Textarea : Input;

  return (
    <div className="flex flex-col gap-2">
      {rows.map((item, index) => (
        <div key={index} className="group flex items-start gap-2.5">
          <span
            className="tabular mt-3 w-4 shrink-0 text-right text-[12px] text-[var(--text-faint)]"
            aria-hidden="true"
          >
            {index + 1}
          </span>
          <Control
            value={item}
            onChange={(e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) =>
              update(index, e.target.value)
            }
            maxLength={config.item_max}
            disabled={disabled}
            rows={multiline ? 3 : undefined}
            placeholder="Twoja odpowiedź…"
            className="flex-1"
          />
          {rows.length > 1 ? (
            <button
              type="button"
              onClick={() => remove(index)}
              disabled={disabled}
              aria-label={`Usuń pozycję ${index + 1}`}
              className="mt-2.5 rounded-lg p-1.5 text-[var(--text-faint)] transition-colors hover:bg-white/6 hover:text-white"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
      ))}

      {canAdd ? (
        <button
          type="button"
          onClick={() => onChange([...rows.filter((i) => i.trim()), ""])}
          disabled={disabled}
          className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-lg px-2 py-1 text-[13px] text-[var(--text-subtle)] transition-colors hover:bg-white/5 hover:text-white"
        >
          <Plus className="size-3.5" />
          Dodaj kolejną
        </button>
      ) : null}

      {config.min_items ? (
        <p className="text-[12px] text-[var(--text-faint)]">
          Minimum {config.min_items}
          {max < 20 ? `, maksimum ${max}` : ""}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Rubryki z nagłówkami z innej odpowiedzi — uwaga z redesignu: „po wpisaniu
 * imion osób, z którymi się rozmawiało, w drugim podpunkcie powinny być już
 * stworzone rubryki”. Pozycja w odpowiedzi to „Imię: treść”; rubrykę
 * rozpoznajemy po przedrostku, nie po kolejności, więc dopisanie albo
 * usunięcie kogoś z listy rozmówców nie przesuwa cudzych notatek.
 */
function LabeledRows({
  field,
  value,
  onChange,
  disabled,
  labels,
  multiline,
}: {
  field: StageField;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  labels: string[];
  multiline?: boolean;
}) {
  const items = asList(value);
  const prefix = (label: string) => `${label}: `;
  const textFor = (label: string) => {
    const hit = items.find((item) => item.startsWith(prefix(label)));
    return hit ? hit.slice(prefix(label).length) : "";
  };
  // Notatki o osobach, których już nie ma na liście rozmówców — zostają
  // w odpowiedzi nietknięte, żeby nic nie zniknęło po cichu.
  const extras = items.filter((item) => !labels.some((label) => item.startsWith(prefix(label))));

  const update = (label: string, text: string) => {
    const next = labels
      .map((l) => (l === label ? text : textFor(l)))
      .map((t, i) => (t.trim() ? prefix(labels[i]!) + t : ""))
      .filter(Boolean);
    onChange([...next, ...extras]);
  };

  const Control = multiline ? Textarea : Input;

  return (
    <div className="flex flex-col gap-3">
      {labels.map((label) => (
        <label key={label} className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-white">{label}</span>
          <Control
            value={textFor(label)}
            onChange={(e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) =>
              update(label, e.target.value)
            }
            maxLength={field.config.item_max}
            disabled={disabled}
            rows={multiline ? 3 : undefined}
            placeholder="Czego się dowiedziałeś?"
          />
        </label>
      ))}
      {extras.length > 0 ? (
        <p className="text-[12px] text-[var(--text-faint)]">
          Masz też {extras.length} {extras.length === 1 ? "wcześniejszą notatkę" : "wcześniejsze notatki"} spoza
          obecnej listy rozmówców — zostają w odpowiedzi.
        </p>
      ) : null}
      <p className="text-[12px] text-[var(--text-faint)]">
        Rubryki biorą się z listy rozmówców w poprzednim podpunkcie. Rozmawiałeś
        z kimś jeszcze? Dopisz go tam.
        {field.config.min_items ? ` Minimum ${field.config.min_items} uzupełnione.` : ""}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skala
// ---------------------------------------------------------------------------

export function ScaleInput({ field, value, onChange, disabled }: FieldInputProps) {
  const id = useId();
  const min = field.config.min ?? 1;
  const max = field.config.max ?? 5;
  const current = typeof value === "number" ? value : null;

  return (
    <div>
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={1}
          value={current ?? Math.round((min + max) / 2)}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/12 accent-[var(--vairo)]"
        />
        <span
          className={cn(
            "tabular inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-[15px] font-semibold",
            current === null
              ? "bg-[var(--surface-2)] text-[var(--text-faint)]"
              : "bg-[var(--vairo)]/15 text-[var(--vairo)]"
          )}
        >
          {current ?? "–"}
        </span>
      </div>

      {field.config.min_label || field.config.max_label ? (
        <div className="mt-2 flex justify-between gap-4 text-[12px] text-[var(--text-subtle)]">
          <span>{field.config.min_label}</span>
          <span className="text-right">{field.config.max_label}</span>
        </div>
      ) : null}

      {current === null ? (
        <p className="mt-2 text-[12px] text-[var(--text-faint)]">
          Przesuń suwak, żeby zapisać ocenę.
        </p>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Wybór
// ---------------------------------------------------------------------------

export function SelectInput({ field, value, onChange, disabled }: FieldInputProps) {
  const options = field.config.options ?? [];
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Pill
          key={option.value}
          selected={value === option.value}
          disabled={disabled}
          onToggle={() => onChange(value === option.value ? "" : option.value)}
        >
          {option.label}
        </Pill>
      ))}
    </div>
  );
}

export function MultiSelectInput({ field, value, onChange, disabled }: FieldInputProps) {
  const options = field.config.options ?? [];
  const selected = asList(value);

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Pill
          key={option.value}
          selected={selected.includes(option.value)}
          disabled={disabled}
          onToggle={() =>
            onChange(
              selected.includes(option.value)
                ? selected.filter((v) => v !== option.value)
                : [...selected, option.value]
            )
          }
        >
          {option.label}
        </Pill>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Liczba, data
// ---------------------------------------------------------------------------

export function NumberInput({ field, value, onChange, disabled }: FieldInputProps) {
  if (field.config.calc) {
    return <CalcInput field={field} value={value} onChange={onChange} disabled={disabled} />;
  }
  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        inputMode="decimal"
        value={typeof value === "number" ? String(value) : ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        min={field.config.min}
        max={field.config.max}
        disabled={disabled}
        className="max-w-[200px]"
        placeholder="0"
      />
      {field.config.unit ? (
        <span className="text-[14px] text-[var(--text-subtle)]">{field.config.unit}</span>
      ) : null}
    </div>
  );
}

/**
 * Kalkulator zamiast wzoru w podpowiedzi — uwaga z redesignu: „zastąpić
 * matematyczne wzory w opisach automatycznym wzorem do uzupełnienia”.
 * Zapisujemy sam wynik (liczba, jak w zwykłym polu), więc odpowiedzi sprzed
 * zmiany i ekran podsumowania działają bez zmian. Składniki żyją tylko
 * w formularzu; wynik można też poprawić ręcznie.
 */
function CalcInput({ field, value, onChange, disabled }: FieldInputProps) {
  const calc = field.config.calc!;
  const [parts, setParts] = useState<Record<string, string>>({});

  const compute = (next: Record<string, string>) => {
    const numbers = calc.inputs.map((input) => Number((next[input.key] ?? "").replace(",", ".")));
    if (numbers.some((n, i) => !next[calc.inputs[i]!.key]?.trim() || !Number.isFinite(n))) return;
    const result =
      calc.op === "product"
        ? numbers.reduce((acc, n) => acc * n, 1)
        : numbers[1] === 0
          ? null
          : numbers[0]! / numbers[1]!;
    if (result === null) return;
    onChange(Math.round(result * 100) / 100);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-2">
        {calc.inputs.map((input, index) => (
          <div key={input.key} className="flex items-end gap-2">
            {index > 0 ? (
              <span className="pb-3 text-[15px] text-[var(--text-subtle)]" aria-hidden="true">
                {calc.op === "product" ? "×" : "÷"}
              </span>
            ) : null}
            <label className="flex flex-col gap-1">
              <span className="text-[12px] text-[var(--text-subtle)]">
                {input.label}
                {input.unit ? ` (${input.unit})` : ""}
              </span>
              <Input
                inputMode="decimal"
                value={parts[input.key] ?? ""}
                onChange={(e) => {
                  const next = { ...parts, [input.key]: e.target.value };
                  setParts(next);
                  compute(next);
                }}
                disabled={disabled}
                className="w-[130px]"
                placeholder="0"
              />
            </label>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[13px] text-[var(--text-muted)]">Wynik:</span>
        <Input
          type="number"
          inputMode="decimal"
          aria-label="Wynik"
          value={typeof value === "number" ? String(value) : ""}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          disabled={disabled}
          className="max-w-[160px]"
          placeholder="0"
        />
        {field.config.unit ? (
          <span className="text-[14px] text-[var(--text-subtle)]">{field.config.unit}</span>
        ) : null}
      </div>
    </div>
  );
}

export function DateInput({ value, onChange, disabled }: FieldInputProps) {
  return (
    <Input
      type="date"
      value={asString(value)}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="max-w-[220px]"
    />
  );
}

// ---------------------------------------------------------------------------
// Linki
// ---------------------------------------------------------------------------

export function LinksInput({ field, value, onChange, disabled }: FieldInputProps) {
  const items = asList(value);
  const rows = items.length > 0 ? items : [""];

  const update = (index: number, next: string) => {
    const copy = [...rows];
    copy[index] = next;
    onChange(copy.filter((item, i) => item.trim().length > 0 || i === index));
  };

  return (
    <div className="flex flex-col gap-2">
      {rows.map((item, index) => {
        const invalid = item.trim().length > 0 && !isLikelyUrl(item);
        return (
          <div key={index}>
            <div className="flex items-center gap-2">
              <Input
                type="url"
                value={item}
                onChange={(e) => update(index, e.target.value)}
                disabled={disabled}
                placeholder="https://…"
                aria-invalid={invalid}
              />
              {rows.length > 1 ? (
                <button
                  type="button"
                  onClick={() => onChange(rows.filter((_, i) => i !== index))}
                  aria-label={`Usuń link ${index + 1}`}
                  className="rounded-lg p-1.5 text-[var(--text-faint)] transition-colors hover:bg-white/6 hover:text-white"
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </div>
            {invalid ? (
              <p className="mt-1 text-[12px] text-[var(--warning)]">
                To nie wygląda na adres — link powinien zaczynać się od http.
              </p>
            ) : null}
          </div>
        );
      })}

      {rows.length < (field.config.max_items ?? 10) ? (
        <button
          type="button"
          onClick={() => onChange([...rows.filter((i) => i.trim()), ""])}
          disabled={disabled}
          className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-lg px-2 py-1 text-[13px] text-[var(--text-subtle)] transition-colors hover:bg-white/5 hover:text-white"
        >
          <Plus className="size-3.5" />
          Dodaj link
        </button>
      ) : null}
    </div>
  );
}

function isLikelyUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Potwierdzenie
// ---------------------------------------------------------------------------

export function CheckmarkInput({ value, onChange, disabled }: FieldInputProps) {
  const checked = value === true;
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      disabled={disabled}
      aria-pressed={checked}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
        checked
          ? "border-[var(--success)]/50 bg-[var(--success)]/10"
          : "border-white/10 bg-[var(--surface-2)] hover:border-white/20"
      )}
    >
      <span
        className={cn(
          "inline-flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
          checked
            ? "border-[var(--success)] bg-[var(--success)] text-black"
            : "border-white/25"
        )}
      >
        {checked ? <CheckGlyph /> : null}
      </span>
      <span className="text-[14px] text-white">
        {checked ? "Zrobione" : "Zaznacz, gdy to zrobisz"}
      </span>
    </button>
  );
}

function CheckGlyph() {
  return (
    <svg viewBox="0 0 12 12" className="size-3" aria-hidden="true">
      <path
        d="M2 6.2 4.6 8.8 10 3.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function validateField(field: StageField, value: unknown): string | null {
  const config: FieldConfig = field.config;

  if (typeof value === "string") {
    const length = value.trim().length;
    if (config.min && length > 0 && length < config.min) {
      return `Za krótka odpowiedź — minimum ${config.min} znaków.`;
    }
  }

  if (Array.isArray(value) && config.min_items) {
    const filled = value.filter((v) => String(v ?? "").trim().length > 0);
    if (filled.length > 0 && filled.length < config.min_items) {
      return `Podaj przynajmniej ${config.min_items}.`;
    }
  }

  return null;
}
