"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

const fieldBase = [
  "w-full rounded-xl border bg-[var(--surface-2)] text-[14px] text-white",
  "border-white/10 placeholder:text-[var(--text-faint)]",
  "transition-colors outline-none",
  "hover:border-white/16",
  "focus:border-[var(--vairo)]/70 focus-visible:outline-none",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "aria-[invalid=true]:border-[var(--danger)]/60",
].join(" ");

type FieldShellProps = {
  label?: string;
  hint?: string;
  error?: string | null;
  /** Aktualna długość + limit, np. 42/120. Pokazuje się dopiero po 60% limitu. */
  counter?: { value: number; max: number };
  children: (props: { id: string; invalid: boolean }) => React.ReactNode;
  className?: string;
};

/** Wspólna obudowa pola: etykieta, podpowiedź, błąd, licznik znaków. */
export function Field({
  label,
  hint,
  error,
  counter,
  children,
  className,
}: FieldShellProps) {
  const id = useId();
  const invalid = Boolean(error);
  const showCounter = counter && counter.value > counter.max * 0.6;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <div className="flex items-baseline justify-between gap-2">
          <label
            htmlFor={id}
            className="text-[13px] font-medium text-[var(--text-muted)]"
          >
            {label}
          </label>
          {showCounter ? (
            <span
              className={cn(
                "tabular text-[12px]",
                counter.value > counter.max
                  ? "text-[var(--danger)]"
                  : "text-[var(--text-subtle)]"
              )}
            >
              {counter.value}/{counter.max}
            </span>
          ) : null}
        </div>
      ) : null}

      {children({ id, invalid })}

      {error ? (
        <p className="text-[12px] text-[var(--danger)]">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-[var(--text-subtle)]">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, "h-11 px-3.5", className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(fieldBase, "resize-none px-3.5 py-3 leading-relaxed", className)}
      {...props}
    />
  );
}
