"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type PillProps = {
  children: React.ReactNode;
  selected?: boolean;
  onToggle?: () => void;
  onRemove?: () => void;
  disabled?: boolean;
  className?: string;
};

/**
 * Jeden komponent na skille, tagi i kategorie.
 *
 * W designie każda pigułka miała pomarańczową ramkę, przez co ekran wyglądał
 * jak zbiór przycisków i nie dało się poznać, które są klikalne ani które
 * wybrane. Tutaj: zaznaczona = wypełnienie + ptaszek, niezaznaczona = neutralna.
 * Nieinteraktywna (bez onToggle/onRemove) renderuje się jako span, nie button.
 */
export function Pill({
  children,
  selected = false,
  onToggle,
  onRemove,
  disabled,
  className,
}: PillProps) {
  const interactive = Boolean(onToggle);

  const base = cn(
    "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-colors",
    selected
      ? "bg-[var(--vairo)]/15 text-white ring-1 ring-inset ring-[var(--vairo)]/50"
      : "bg-[var(--surface-2)] text-[var(--text-muted)] ring-1 ring-inset ring-white/8",
    interactive && !disabled && "hover:ring-white/20 cursor-pointer",
    interactive &&
      selected &&
      !disabled &&
      "hover:ring-[var(--vairo)]/70",
    disabled && "cursor-not-allowed opacity-50",
    className
  );

  if (!interactive && !onRemove) {
    return <span className={base}>{children}</span>;
  }

  if (onRemove) {
    return (
      <span className={base}>
        {children}
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          aria-label={`Usuń ${typeof children === "string" ? children : "element"}`}
          className="-mr-1 rounded-full p-0.5 text-[var(--text-faint)] transition-colors hover:text-white"
        >
          <X className="size-3" />
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={selected}
      className={base}
    >
      {selected ? (
        <Check className="size-3.5 text-[var(--vairo)]" aria-hidden="true" />
      ) : null}
      {children}
    </button>
  );
}
