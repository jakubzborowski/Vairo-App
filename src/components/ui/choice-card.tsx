"use client";

import { Check, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Karta wyboru w kreatorach: ikona, nazwa i jedno zdanie opisu.
 * Zaznaczenie to pierścień i ptaszek — nie sam kolor tła, który na ciemnym
 * łatwo przeoczyć. Wyłączona karta mówi, dlaczego (`note`).
 */
export function ChoiceCard({
  icon: Icon,
  label,
  description,
  note,
  selected,
  disabled,
  onSelect,
}: {
  icon?: LucideIcon;
  label: string;
  description?: string | null;
  note?: string | null;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex min-h-16 w-full items-center gap-3.5 rounded-2xl px-4 py-3.5 text-left transition-[background-color,box-shadow]",
        selected
          ? "bg-[var(--vairo)]/[0.08] shadow-[inset_0_0_0_1.5px_rgba(238,95,28,0.6)]"
          : "bg-[var(--surface)] lift-1 hover:bg-[var(--surface-2)]",
        disabled && "cursor-not-allowed opacity-55 hover:bg-[var(--surface)]"
      )}
    >
      {Icon ? (
        <Icon
          className={cn(
            "size-5 shrink-0",
            selected ? "text-[var(--vairo)]" : "text-[var(--text-muted)]"
          )}
          strokeWidth={1.75}
          aria-hidden="true"
        />
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block text-[14.5px] font-medium text-white">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-[13px] leading-snug text-[var(--text-subtle)]">
            {description}
          </span>
        ) : null}
        {note ? (
          <span className="mt-1 block text-[12.5px] leading-snug text-[var(--text-muted)]">
            {note}
          </span>
        ) : null}
      </span>
      {selected ? (
        <Check className="size-[18px] shrink-0 text-[var(--vairo)]" aria-hidden="true" />
      ) : null}
    </button>
  );
}
