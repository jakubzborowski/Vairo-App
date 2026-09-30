"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * `useLayoutEffect` na serwerze wypisuje ostrzeżenie, a komponent mimo
 * `"use client"` renderuje się też w SSR. Panel i tak powstaje dopiero po
 * kliknięciu, ale sam hook wykonuje się zawsze — stąd podmiana.
 */
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const GAP = 6;
const EDGE = 8;

type Coords = { top: number; left: number };

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
 * **Panel leci przez portal do `body`, nie `absolute` obok przycisku.**
 * Wcześniej menu przy ostatnim wierszu ucinało się na krawędzi karty, bo
 * kontenery mają `overflow-hidden` (potrzebne, żeby `edge-accent`
 * i zaokrąglenia nie wystawały). Podniesienie `z-index` nic by nie dało:
 * przycinanie dzieje się przed warstwowaniem, a wyłączenie `overflow` na
 * każdym pojemniku po kolei to naprawianie tego samego błędu w dziesięciu
 * miejscach i czekanie, aż pojawi się jedenaste. Element w `body` nie ma nad
 * sobą żadnego kontenera, który mógłby go przyciąć.
 *
 * Konsekwencje, o których trzeba pamiętać przy zmianach:
 *
 *   • **Pozycja liczy się z `getBoundingClientRect()`**, więc trzeba ją
 *     przeliczać przy przewijaniu i zmianie rozmiaru okna — inaczej panel
 *     zostaje w miejscu, a przycisk odjeżdża.
 *   • **Panel odwraca się do góry**, gdy pod przyciskiem jest za mało
 *     miejsca, i **nigdy nie wychodzi poza ekran w poziomie** — bez tego na
 *     telefonie menu przy prawej krawędzi wystawałoby za widok.
 *   • **Kliknięcie poza menu sprawdza DWA obszary.** Panel nie jest już
 *     potomkiem przycisku w DOM-ie, więc samo `contains()` na opakowaniu
 *     zamykałoby menu w chwili naciśnięcia pozycji — i akcja nigdy by się
 *     nie wykonała.
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
  const [coords, setCoords] = useState<Coords | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const place = useCallback(() => {
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!trigger || !panel) return;

    const anchor = trigger.getBoundingClientRect();
    const { width, height } = panel.getBoundingClientRect();

    // W dół, chyba że tam się nie mieści, a w górę tak.
    const fitsBelow = anchor.bottom + GAP + height <= window.innerHeight - EDGE;
    const fitsAbove = anchor.top - GAP - height >= EDGE;
    const top = fitsBelow || !fitsAbove
      ? anchor.bottom + GAP
      : anchor.top - GAP - height;

    const raw = align === "right" ? anchor.right - width : anchor.left;
    const left = Math.min(
      Math.max(raw, EDGE),
      Math.max(EDGE, window.innerWidth - width - EDGE)
    );

    setCoords({ top, left });
  }, [align]);

  useIsoLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }
    place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    // `capture` łapie też przewijanie kontenerów w środku strony — kolumny
    // etapu i lista rozmów mają własne paski.
    const onReflow = () => place();

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onReflow, true);
    window.addEventListener("resize", onReflow);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onReflow, true);
      window.removeEventListener("resize", onReflow);
    };
  }, [open, place]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        className={cn(
          "inline-flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors sm:size-8",
          open
            ? "bg-white/10 text-white"
            : "text-[var(--text-subtle)] hover:bg-white/[0.06] hover:text-white"
        )}
      >
        <MoreVertical className="size-4" />
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              role="menu"
              style={{
                top: coords?.top ?? 0,
                left: coords?.left ?? 0,
                // Pierwszy render służy do zmierzenia panelu. Ukrywamy go na
                // tę jedną klatkę, zamiast mrugać nim w lewym górnym rogu.
                visibility: coords ? "visible" : "hidden",
              }}
              // Skala warstw: modal 50 → MENU 55 → toast 60. Menu musi być
              // nad modalem, bo bywa w nim otwierane, ale POD toastem —
              // toast niesie komunikat błędu i nic nie ma prawa go zasłonić.
              className="fixed z-[55] min-w-[200px] max-w-[calc(100vw-16px)] overflow-hidden rounded-xl border border-white/10 bg-[var(--surface-2)] py-1 lift-3"
            >
              {children(() => setOpen(false))}
            </div>,
            document.body
          )
        : null}
    </>
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
