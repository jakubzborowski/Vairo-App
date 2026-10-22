"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Panel z prawej — szczegół rzeczy z listy, bez zasłaniania listy.
 *
 * Modal jest na krótkie decyzje. Panel na to, co się czyta i poprawia
 * kilkoma kliknięciami (zadanie na tablicy): lista zostaje widoczna obok,
 * więc wiadomo, skąd się przyszło. Na telefonie zajmuje cały ekran.
 */
export function Drawer({
  title,
  eyebrow,
  onClose,
  children,
  footer,
  className,
}: {
  title: string;
  eyebrow?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Zamknij"
        onClick={onClose}
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.stopPropagation();
          onClose();
        }}
        className={cn(
          "drawer-in relative flex h-full w-full max-w-[440px] flex-col border-l border-white/10 bg-[var(--surface)] outline-none lift-3",
          className
        )}
      >
        <header className="flex items-start gap-3 border-b border-white/[0.07] px-5 py-4">
          <div className="min-w-0 flex-1">
            {eyebrow ? (
              <div className="mb-1 text-[12.5px] text-[var(--text-subtle)]">{eyebrow}</div>
            ) : null}
            <h2 className="font-heading text-[18px] font-semibold leading-snug text-white">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zamknij"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-[var(--text-subtle)] transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <X className="size-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer ? (
          <footer className="border-t border-white/[0.07] px-5 py-3.5">{footer}</footer>
        ) : null}
      </div>
    </div>
  );
}
