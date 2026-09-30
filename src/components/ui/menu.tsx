"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Menu pod trzema kropkami.
 *
 * Powstało dlatego, że wiersze — członka teamu, otwartej roli — obrastały
 * przyciskami. Każda akcja dostawała własny widoczny guzik, więc przy trzech
 * akcjach wiersz miał trzy rzeczy do przeczytania, zanim dało się zobaczyć,
 * czyj to wiersz. **Widoczne ma być to, co się czyta; akcje mają być pod
 * ręką, nie przed oczami.**
 *
 * Trzy kropki są bezpieczne właśnie dlatego, że nic nie obiecują: nikt nie
 * kliknie ich przez pomyłkę, a każdy wie, że coś tam jest. To jedyny wyjątek
 * od zasady „ikona bez podpisu jest zagadką" — ten konkretny znak ma
 * ustalone znaczenie wszędzie.
 *
 * Zamyka się na Escape i na kliknięcie poza sobą. Bez tego drugiego menu
 * zostaje otwarte po wybraniu akcji i wygląda, jakby nic się nie stało.
 */
export function Menu({
  label = "Więcej",
  children,
  align = "right",
}: {
  label?: string;
  children: (close: () => void) => React.ReactNode;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        className={cn(
          "inline-flex size-9 items-center justify-center rounded-lg transition-colors sm:size-8",
          open
            ? "bg-white/10 text-white"
            : "text-[var(--text-subtle)] hover:bg-white/[0.06] hover:text-white"
        )}
      >
        <MoreVertical className="size-4" />
      </button>

      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute top-full z-30 mt-1 min-w-[200px] overflow-hidden rounded-xl border border-white/10 bg-[var(--surface-2)] py-1 lift-3",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {children(() => setOpen(false))}
        </div>
      ) : null}
    </div>
  );
}

/** Pozycja menu. `tone="danger"` dla akcji, której nie da się cofnąć. */
export function MenuItem({
  onClick,
  icon: Icon,
  children,
  tone = "default",
  disabled,
  title,
}: {
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  tone?: "default" | "danger";
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13.5px] transition-colors sm:py-2",
        disabled
          ? "cursor-not-allowed text-[var(--text-faint)]"
          : tone === "danger"
            ? "text-[var(--danger)] hover:bg-[var(--danger)]/10"
            : "text-[var(--text-muted)] hover:bg-white/[0.06] hover:text-white"
      )}
    >
      {Icon ? <Icon className="size-4 shrink-0" /> : null}
      {children}
    </button>
  );
}

/** Kreska oddzielająca akcje nieodwracalne od reszty. */
export function MenuSeparator() {
  return <div className="my-1 h-px bg-white/[0.07]" aria-hidden="true" />;
}
