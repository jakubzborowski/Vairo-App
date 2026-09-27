"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FieldInputProps } from "./field-inputs";

/**
 * Wyjście z modala do istniejącego miejsca w aplikacji.
 * Samo kliknięcie linku nie zalicza podpunktu — zalicza je potwierdzenie.
 */
export function ActionInput({ field, value, onChange, disabled }: FieldInputProps) {
  const checked = value === true;
  const href = field.config.href ?? "/app";
  const label = field.config.label ?? "Otwórz";

  return (
    <div className="flex flex-col gap-2">
      <Link
        href={href}
        className="inline-flex w-fit items-center gap-1.5 rounded-xl border border-[var(--vairo)]/40 bg-[var(--vairo)]/10 px-4 py-2.5 text-[14px] font-medium text-white hover:bg-[var(--vairo)]/16"
      >
        {label}
        <ArrowUpRight className="size-4 text-[var(--vairo)]" />
      </Link>
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
            "inline-flex size-5 shrink-0 items-center justify-center rounded-md border",
            checked
              ? "border-[var(--success)] bg-[var(--success)] text-black"
              : "border-white/25"
          )}
        >
          {checked ? (
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
          ) : null}
        </span>
        <span className="text-[14px] text-white">
          {checked ? "Zrobione" : "Zaznacz, gdy to zrobisz"}
        </span>
      </button>
    </div>
  );
}
