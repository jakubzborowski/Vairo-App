"use client";

import { useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { SentenceSlot, StageField } from "@/types/stage";

type Props = {
  field: StageField;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
};

const WIDTHS: Record<NonNullable<SentenceSlot["size"]>, string> = {
  sm: "min-w-[9rem] max-w-[14rem]",
  md: "min-w-[12rem] max-w-[22rem]",
  lg: "min-w-[16rem] max-w-[32rem]",
};

/**
 * Zdanie z lukami — „[kto] próbuje [co], ale [co przeszkadza]…”.
 *
 * Trudność polega na tym, że odpowiedzi mają skrajnie różną długość:
 * „Właściciele kawiarni” obok zdania na trzy linijki. Dlatego luki są
 * elementami inline, które zawijają się razem z tekstem i rosną w pionie,
 * zamiast rozpychać jedną linię w bok.
 */
export function SentenceField({ field, value, onChange, disabled }: Props) {
  const template = field.config.template ?? "";
  const slots = field.config.slots ?? [];
  const values = (value ?? {}) as Record<string, string>;

  const parts = splitTemplate(template);
  const filled = slots.filter((s) => (values[s.key] ?? "").trim().length > 0).length;

  const preview = parts
    .map((part) =>
      part.type === "text" ? part.text : (values[part.key] ?? "").trim() || "…"
    )
    .join("")
    .replace(/\s+/g, " ")
    .trim();

  return (
    <div>
      <div className="rounded-xl border border-white/10 bg-[var(--surface-2)] p-4 text-[15px] leading-[2.6]">
        {parts.map((part, index) =>
          part.type === "text" ? (
            <span key={index} className="text-[var(--text-muted)]">
              {part.text}
            </span>
          ) : (
            <SlotInput
              key={index}
              slot={slots.find((s) => s.key === part.key) ?? { key: part.key, label: part.key }}
              value={values[part.key] ?? ""}
              disabled={disabled}
              onChange={(next) => onChange({ ...values, [part.key]: next })}
            />
          )
        )}
      </div>

      <div className="mt-3 flex items-start justify-between gap-4">
        <p className="text-[12px] text-[var(--text-faint)]">
          Wypełnione {filled} z {slots.length}
        </p>
      </div>

      {filled > 0 ? (
        <div className="mt-2 rounded-xl border border-[var(--vairo)]/25 bg-[var(--vairo)]/6 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--vairo)]">
            Twoje zdanie
          </p>
          <p className="mt-1.5 text-[14px] leading-relaxed text-white">{preview}</p>
        </div>
      ) : null}
    </div>
  );
}

function SlotInput({
  slot,
  value,
  onChange,
  disabled,
}: {
  slot: SentenceSlot;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Wysokość idzie za treścią — bez tego dłuższa odpowiedź chowałaby się
  // pod scrollem wewnątrz jednolinijkowego pola.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.max(el.scrollHeight, 34)}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value.replace(/\n/g, " "))}
      placeholder={slot.label}
      aria-label={slot.label}
      className={cn(
        "mx-1 inline-block resize-none overflow-hidden rounded-lg border px-2.5 py-1 align-middle",
        "text-[15px] leading-snug text-white transition-colors outline-none",
        "border-white/15 bg-[var(--surface)] placeholder:text-[var(--text-faint)]",
        "hover:border-white/25 focus:border-[var(--vairo)]/70",
        "disabled:cursor-not-allowed disabled:opacity-50",
        WIDTHS[slot.size ?? "md"]
      )}
    />
  );
}

type Part = { type: "text"; text: string } | { type: "slot"; key: string };

/** Rozbija „{who} próbuje {what}.” na kawałki tekstu i luki. */
function splitTemplate(template: string): Part[] {
  const parts: Part[] = [];
  const regex = /\{([a-z0-9_]+)\}/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(template)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", text: template.slice(lastIndex, match.index) });
    }
    parts.push({ type: "slot", key: match[1]! });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < template.length) {
    parts.push({ type: "text", text: template.slice(lastIndex) });
  }

  return parts;
}
