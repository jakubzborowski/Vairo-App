"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type MenuOption = {
  value: string;
  label: string;
};

/**
 * Lista w stylu przełącznika teamu. Natywny select otwiera okno systemu,
 * które nie zna tokenów Vairo.
 */
export function MenuSelect({
  value,
  onChange,
  options,
  ariaLabel,
  disabled,
  className,
  placeholder = "Wybierz",
  size = "md",
}: {
  value: string;
  onChange: (value: string) => void;
  options: MenuOption[];
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState<{ top: number; left: number; width: number; up: boolean } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;

    const place = () => {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      const spaceBelow = window.innerHeight - rect.bottom;
      const up = spaceBelow < 220 && rect.top > spaceBelow;
      setBox({
        top: up ? rect.top - 6 : rect.bottom + 6,
        left: rect.left,
        width: Math.max(rect.width, 180),
        up,
      });
    };

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (ref.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };

    place();
    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      className={cn("relative", open && "z-30", className)}
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !open) return;
        event.stopPropagation();
        setOpen(false);
      }}
    >
      <button
        type="button"
        disabled={disabled || options.length === 0}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((next) => !next)}
        className={cn(
          "flex w-full items-center gap-2 rounded-xl border border-white/10 bg-[var(--surface-2)] text-left text-white",
          "transition-colors outline-none hover:border-white/16",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--vairo)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          open && "border-[var(--vairo)]/70",
          size === "sm" ? "h-9 px-3 text-[13px]" : "h-11 px-3.5 text-[14px]"
        )}
      >
        <span className={cn("min-w-0 flex-1 truncate", !current && "text-[var(--text-subtle)]")}>
          {current?.label ?? placeholder}
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-[var(--text-faint)]" aria-hidden="true" />
      </button>

      {open && box
        ? createPortal(
            <div
              ref={menuRef}
              id={listId}
              role="listbox"
              aria-label={ariaLabel}
              style={{
                top: box.top,
                left: box.left,
                width: box.width,
                transform: box.up ? "translateY(-100%)" : undefined,
              }}
              className="fixed z-[80] max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-[var(--surface-2)] py-1 shadow-[0_12px_40px_rgba(0,0,0,.6)]"
            >
              {options.map((option, index) => {
                const selected = option.value === value;
                return (
                  <button
                    key={`${option.value}:${index}`}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[var(--text-muted)] transition-colors hover:bg-white/[0.06] hover:text-white"
                  >
                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                    {selected ? <Check className="size-3.5 shrink-0 text-[var(--vairo)]" /> : null}
                  </button>
                );
              })}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
