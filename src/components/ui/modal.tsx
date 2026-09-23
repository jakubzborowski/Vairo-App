"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

/**
 * Prosty modal na krótkie decyzje: zaproszenie, zgłoszenie, potwierdzenie.
 *
 * Escape obsługujemy na samym dialogu, a nie na dokumencie — dzięki temu
 * handler nie jest przepinany przy każdym renderze i nie zabiera focusu
 * z pola, w którym ktoś właśnie pisze.
 */
export function Modal({
  title,
  description,
  onClose,
  children,
  footer,
  className,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <button
        type="button"
        aria-label="Zamknij"
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm"
      />

      <div
        ref={dialogRef}
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
          "relative my-auto w-full max-w-[520px] rounded-2xl border border-white/10 bg-[var(--surface)]",
          "shadow-[0_24px_80px_rgba(0,0,0,.7)] outline-none",
          className
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-white/[0.07] px-6 py-5">
          <div className="min-w-0">
            <h2 className="font-heading text-[18px] font-semibold text-white">
              {title}
            </h2>
            {description ? (
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--text-subtle)]">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zamknij"
            className="shrink-0 rounded-lg p-1.5 text-[var(--text-faint)] transition-colors hover:bg-white/6 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="flex flex-col gap-5 px-6 py-6">{children}</div>

        {footer ? (
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-white/[0.07] px-6 py-4">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
