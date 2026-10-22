import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Nagłówek modułu pracy: tytuł, jedno zdanie z liczbami z bazy i najwyżej
 * jedna akcja drugorzędna. Stoi w tym samym miejscu na każdym ekranie, więc
 * przełączanie pozycji w menu niczego nie przesuwa.
 *
 * Instrukcja „jak to działa" nie mieszka tutaj — wisiała nad każdą listą
 * i po trzecim wejściu nikt jej już nie czytał. Jej miejsce to pusty stan.
 */
export function ModuleHeader({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  /** Pasek pod tytułem, np. zakładki. */
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-wrap items-end justify-between gap-x-4 gap-y-3", className)}>
      <div className="min-w-0">
        <h1 className="font-heading text-[1.65rem] font-semibold leading-tight text-white">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--text-subtle)]">
            {subtitle}
          </p>
        ) : null}
      </div>
      {children || action ? (
        <div className="flex flex-wrap items-center gap-2">
          {children}
          {action}
        </div>
      ) : null}
    </header>
  );
}

/**
 * Mikro-nagłówek sekcji. To treść, nie dekoracja — dlatego `--text-subtle`,
 * nigdy `--text-faint`.
 */
export function SectionLabel({
  icon: Icon,
  count,
  action,
  className,
  children,
}: {
  icon?: LucideIcon;
  count?: number | string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex min-h-8 items-center justify-between gap-3", className)}>
      <h2 className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-[var(--text-subtle)]">
        {Icon ? <Icon className="size-3.5" aria-hidden="true" /> : null}
        {children}
        {count !== undefined ? (
          <span className="tabular font-normal normal-case tracking-normal">{count}</span>
        ) : null}
      </h2>
      {action}
    </div>
  );
}
