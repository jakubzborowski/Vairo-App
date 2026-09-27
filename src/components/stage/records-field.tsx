"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { asRecords, type RecordColumn, type RecordsValue, type StageField } from "@/types/stage";
import type { FieldInputProps } from "./field-inputs";

function columnsOf(field: StageField, value: RecordsValue): RecordColumn[] {
  const base = field.config.columns ?? [];
  const extra = value.extra_columns ?? [];
  const seen = new Set(base.map((column) => column.key));
  return [...base, ...extra.filter((column) => !seen.has(column.key))];
}

function slug(label: string) {
  const base = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 24);
  return base || "pole";
}

export function RecordsInput({ field, value, onChange, disabled }: FieldInputProps) {
  const current = asRecords(value);
  const columns = columnsOf(field, current);
  const rows = current.rows.length > 0 ? current.rows : [{}];
  const max = field.config.max_items ?? 20;
  const [columnName, setColumnName] = useState("");

  const write = (next: RecordsValue) => onChange(next);

  const updateCell = (index: number, key: string, cell: string) => {
    const copy = rows.map((row) => ({ ...row }));
    copy[index] = { ...copy[index], [key]: cell };
    write({ ...current, rows: copy });
  };

  const removeRow = (index: number) => {
    write({ ...current, rows: rows.filter((_, i) => i !== index) });
  };

  const addRow = () => {
    if (rows.length >= max) return;
    write({ ...current, rows: [...rows, {}] });
  };

  const addColumn = () => {
    const label = columnName.trim();
    if (!label) return;
    const key = slug(label);
    if (columns.some((column) => column.key === key)) return;
    write({
      ...current,
      extra_columns: [...(current.extra_columns ?? []), { key, label }],
    });
    setColumnName("");
  };

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row, index) => (
        <div
          key={index}
          className="rounded-xl border border-white/10 bg-[var(--surface-2)] p-3"
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[12px] font-medium text-[var(--text-faint)]">
              Pozycja {index + 1}
            </p>
            {rows.length > 1 ? (
              <button
                type="button"
                onClick={() => removeRow(index)}
                disabled={disabled}
                aria-label={`Usuń pozycję ${index + 1}`}
                className="rounded-md p-1 text-[var(--text-faint)] hover:bg-white/6 hover:text-white"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            {columns.map((column) => (
              <label key={column.key} className="flex flex-col gap-1">
                <span className="text-[12.5px] text-[var(--text-subtle)]">
                  {column.label}
                </span>
                <Input
                  value={row[column.key] ?? ""}
                  placeholder={column.placeholder}
                  disabled={disabled}
                  onChange={(event) => updateCell(index, column.key, event.target.value)}
                />
              </label>
            ))}
          </div>
        </div>
      ))}

      {rows.length < max ? (
        <button
          type="button"
          onClick={addRow}
          disabled={disabled}
          className="inline-flex w-fit items-center gap-1.5 rounded-lg px-2 py-1 text-[13px] text-[var(--text-subtle)] hover:bg-white/5 hover:text-white"
        >
          <Plus className="size-3.5" />
          {field.config.add_label ?? "Dodaj pozycję"}
        </button>
      ) : null}

      {field.config.allow_custom_columns ? (
        <div className="flex items-end gap-2 border-t border-white/[0.06] pt-3">
          <label className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-[12.5px] text-[var(--text-subtle)]">
              Własne pole w tym profilu
            </span>
            <Input
              value={columnName}
              disabled={disabled}
              placeholder="Np. miasto albo stawka godzinowa"
              onChange={(event) => setColumnName(event.target.value)}
            />
          </label>
          <button
            type="button"
            onClick={addColumn}
            disabled={disabled || columnName.trim().length === 0}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-[13px] text-white hover:bg-white/5 disabled:opacity-40"
          >
            <Plus className="size-3.5" />
            Dodaj pole
          </button>
        </div>
      ) : null}

      {field.config.empty_ok ? (
        <p className="text-[12.5px] leading-relaxed text-[var(--text-faint)]">
          Jeśli niczego nie brakuje, zostaw listę pustą i zapisz. To też jest
          odpowiedź.
        </p>
      ) : null}
    </div>
  );
}
