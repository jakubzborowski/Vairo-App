"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PartyPopper, RotateCcw, Sparkles, Undo2, X } from "lucide-react";
import type { MatchReason } from "@/lib/match";
import { cn } from "@/lib/utils";

type Props = {
  /** Numer bieżącej karty (od 1) i długość talii — „3 z 12". */
  position: number;
  total: number;
  passedCount: number;
  busy: boolean;
  error: string | null;
  canUndo: boolean;
  onPass: () => void;
  onUndo: () => void;
  onRestoreAll: () => void;
  /** Duże pionowe zdjęcie z nazwą wtopioną w dolną krawędź. */
  cover: React.ReactNode;
  /**
   * Dlaczego ta karta w ogóle się pokazuje. Pusta lista = nie pokazujemy nic;
   * wymyślony powód byłby gorszy niż jego brak.
   */
  reasons?: MatchReason[];
  /** Treść prawej kolumny — to, co druga strona sama o sobie napisała. */
  body: React.ReactNode;
  /** Akcja główna jako okrągły przycisk — „Napisz" albo „Zgłoś się". */
  action: React.ReactNode;
  /** Trzecia akcja, gdy istnieje — np. „Zaproś do teamu" dla Foundera. */
  extraAction?: React.ReactNode;
  /** Link do pełnego profilu — jedno zdanie na dole prawej kolumny. */
  footer?: React.ReactNode;
  passLabel: string;
  /** Podpis akcji głównej do skrótu klawiszowego i gestu („Zaczep", „Zgłoś się"). */
  primaryLabel?: string;
  /** „osób" / „teamów" — w liczniku pod talią. */
  unit?: string;
};

const SWIPE_RATIO = 0.5;

/**
 * Karta w Odkrywaj: **duże pionowe zdjęcie po lewej, treść po prawej,
 * okrągłe akcje pod spodem.**
 *
 * Układ wzięty z tego, co działa w aplikacjach randkowych — i warto nazwać,
 * DLACZEGO tam działa, bo to nie jest kwestia mody:
 *
 *   • **Zdjęcie jest pionowe i duże.** Twarz w kadrze 3:4 czyta się jak
 *     spotkanie z człowiekiem; ta sama twarz w miniaturze to pozycja
 *     w katalogu. To zdjęcie jest powodem, dla którego ktoś w ogóle czyta
 *     dalej.
 *   • **Obok niego jest MIEJSCE.** Prawa kolumna mieści imię, jedno zdanie,
 *     fakty, powód, opis i umiejętności — bez ściskania, bo nie konkuruje
 *     ze zdjęciem o tę samą przestrzeń.
 *   • **Akcje są POD kartą, nie w niej.** Karta to coś, co się ogląda;
 *     przyciski to coś, co się robi. Rozdzielenie ich przestrzenią sprawia,
 *     że nie trzeba ich szukać wzrokiem wśród treści.
 *
 * Wysokość karty jest stała, a prawa kolumna przewija się w środku (tylko od
 * `lg`). Dzięki temu talia nie skacze: każda karta zajmuje tyle samo miejsca,
 * niezależnie od tego, czy ktoś napisał o sobie dwa zdania czy dziesięć.
 * Na telefonie tego nie robimy — przewijanie w przewijaniu jest tam jednym
 * z najbardziej frustrujących wzorców.
 */
export function DeckFrame({
  position,
  total,
  passedCount,
  busy,
  error,
  canUndo,
  onPass,
  onUndo,
  onRestoreAll,
  cover,
  reasons = [],
  body,
  action,
  extraAction,
  footer,
  passLabel,
  primaryLabel = "Zaczep",
  unit = "",
}: Props) {
  const primaryRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const [drag, setDrag] = useState(0);
  const dragStart = useRef<{ x: number; y: number; id: number } | null>(null);

  // Akcja główna to komponent z zewnątrz (z własnym oknem i logiką), więc
  // skrót i gest „klikają" jej przycisk — jedna droga do tej samej akcji.
  const firePrimary = () => {
    const target = primaryRef.current?.querySelector<HTMLElement>("button, a");
    target?.click();
  };

  // Skróty jak w talii: ← „Nie teraz", → akcja główna. Nie działają, gdy
  // ktoś pisze w polu albo jest otwarte okno.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const el = event.target as HTMLElement | null;
      if (el?.closest("input, textarea, [contenteditable], [role=dialog]")) return;
      if (busy) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onPass();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        firePrimary();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onPass]);

  // Gest tylko na dotyku: na desktopie przeciąganie kolidowałoby z
  // zaznaczaniem tekstu w opisie.
  const onPointerDown = (event: React.PointerEvent) => {
    if (event.pointerType !== "touch" || busy) return;
    dragStart.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
  };
  const onPointerMove = (event: React.PointerEvent) => {
    const start = dragStart.current;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    // Ruch głównie w pionie to przewijanie strony — nie przejmujemy go.
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(drag) < 8) {
      dragStart.current = null;
      setDrag(0);
      return;
    }
    setDrag(dx);
  };
  const onPointerEnd = () => {
    const width = cardRef.current?.offsetWidth ?? 320;
    const passed = Math.abs(drag) > width * SWIPE_RATIO * 0.6;
    if (passed && drag > 0) firePrimary();
    if (passed && drag < 0) onPass();
    dragStart.current = null;
    setDrag(0);
  };

  const intent = drag > 40 ? "primary" : drag < -40 ? "pass" : null;

  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col">
      {/* Krawędzie dwóch następnych kart — talia wygląda jak talia. */}
      <div className="relative pt-4">
        {total - position >= 2 ? (
          <div className="absolute inset-x-10 top-0 h-10 rounded-[28px] bg-[var(--surface)] opacity-45" aria-hidden="true" />
        ) : null}
        {total - position >= 1 ? (
          <div className="absolute inset-x-5 top-2 h-10 rounded-[28px] bg-[var(--surface-2)] opacity-75" aria-hidden="true" />
        ) : null}

        <article
          ref={cardRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          style={
            drag
              ? { transform: `translateX(${drag}px) rotate(${drag / 22}deg)`, transformOrigin: "50% 120%" }
              : undefined
          }
          className={cn(
            "relative touch-pan-y overflow-hidden rounded-[28px] border border-white/[0.08] bg-[var(--surface)] lift-3 md:grid md:grid-cols-[minmax(0,360px)_minmax(0,1fr)]",
            !drag && "transition-transform duration-200"
          )}
        >
          {intent ? (
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute top-10 z-10 rounded-xl border-[3px] px-3.5 py-1.5 font-heading text-[24px] font-bold uppercase tracking-wide",
                intent === "primary"
                  ? "left-5 -rotate-12 border-[var(--vairo)] bg-black/35 text-[var(--vairo-soft)]"
                  : "right-5 rotate-12 border-white/70 bg-black/35 text-white"
              )}
            >
              {intent === "primary" ? primaryLabel : passLabel}
            </span>
          ) : null}

          {cover}

          <div className="flex min-w-0 flex-col gap-4 px-5 py-5 sm:px-6 lg:max-h-[520px] lg:overflow-y-auto">
            {/* Powód to zdanie z ikoną — bez pomarańczowej ramki. Pomarańcz
                na tym ekranie ma tylko akcja główna. */}
            {reasons.length > 0 ? (
              <p className="flex items-start gap-2.5 text-[14px] leading-relaxed text-[var(--text-muted)]">
                <Sparkles className="mt-[3px] size-4 shrink-0 text-[var(--vairo-soft)]" aria-hidden="true" />
                <span>
                  <span className="sr-only">Dlaczego to widzisz: </span>
                  {reasons.map((reason) => reason.text).join(" · ")}
                </span>
              </p>
            ) : null}

            <div className="min-w-0 flex-1">{body}</div>

            {footer ? <div className="text-[13px] text-[var(--text-muted)]">{footer}</div> : null}
          </div>
        </article>
      </div>

      {/* Jeden pasek przyklejony do talii: po lewej ile zostało, w środku
          przyciski, po prawej skróty. Przyciski stoją zawsze w tym samym
          miejscu, pod kciukiem. */}
      <div className="mt-3 grid items-center gap-4 rounded-[24px] bg-[var(--surface)] px-4 py-3.5 lift-1 sm:px-5 md:grid-cols-[1fr_auto_1fr]">
        <div className="hidden flex-col gap-2 md:flex">
          <p className="text-[13.5px] text-[var(--text-muted)]">
            <span className="tabular font-heading text-[18px] font-semibold text-white">{position}</span> z {total}
            {unit ? ` ${unit}` : ""}
          </p>
          <span className="flex w-[180px] gap-[3px]" aria-hidden="true">
            {Array.from({ length: Math.min(total, 24) }, (_, index) => {
              const at = total <= 24 ? index + 1 : Math.round(((index + 1) / 24) * total);
              return (
                <span
                  key={index}
                  className={cn(
                    "h-[5px] flex-1 rounded-full",
                    at < position ? "bg-white/70" : at === position ? "bg-white" : "bg-white/10"
                  )}
                />
              );
            })}
          </span>
        </div>

        <div className="flex items-start justify-center gap-3 sm:gap-5">
          {canUndo ? (
            <DeckAction
              variant="quiet"
              label="Cofnij"
              icon={<Undo2 className="size-[18px]" />}
              onClick={onUndo}
              disabled={busy}
              title="Przywróć ostatnio pominiętą kartę"
            />
          ) : null}
          <DeckAction
            variant="pass"
            label={passLabel}
            icon={<X className="size-6" strokeWidth={2.25} />}
            onClick={onPass}
            disabled={busy}
          />
          <div ref={primaryRef} className="contents">
            {action}
          </div>
          {extraAction}
        </div>

        <div className="hidden flex-col items-end gap-1.5 text-[12.5px] text-[var(--text-muted)] md:flex">
          <p className="flex items-center gap-1.5">
            <Kbd>←</Kbd>
            {passLabel}
          </p>
          <p className="flex items-center gap-1.5">
            <Kbd>→</Kbd>
            {primaryLabel}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 md:hidden">
        <span className="tabular text-[12.5px] text-[var(--text-subtle)]">
          <span className="font-semibold text-white">{position}</span> z {total}
        </span>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-center text-[13px] text-[var(--danger)]">
          {error}
        </p>
      ) : null}

      {passedCount > 0 ? (
        <button
          type="button"
          onClick={onRestoreAll}
          disabled={busy}
          className="mx-auto mt-4 inline-flex min-h-11 items-center gap-1.5 text-[12.5px] text-[var(--text-subtle)] transition-colors hover:text-white"
        >
          <RotateCcw className="size-3.5" />
          Przywróć pominięte ({passedCount})
        </button>
      ) : null}
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-[7px] bg-[var(--surface-3)] px-1.5 font-sans text-[12px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.08)]">
      {children}
    </kbd>
  );
}

/**
 * Koniec talii — zielone miejsce na to, co już zrobione, i dwie drogi dalej:
 * przywrócić pominiętych albo poluzować filtry. Wzór warstwicowy tylko tutaj.
 */
export function DeckEnd({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="topo-brand mx-auto flex w-full max-w-[880px] items-center justify-center rounded-[28px] bg-[var(--surface)] px-4 py-12">
      <div className="flex w-full max-w-sm flex-col items-center rounded-[22px] bg-[var(--bg)]/90 px-5 py-7 text-center">
        <span className="inline-flex size-14 items-center justify-center rounded-[18px] bg-[var(--success)]/14 text-[var(--success)]">
          <PartyPopper className="size-6" strokeWidth={1.75} />
        </span>
        <p className="mt-3.5 font-heading text-[21px] font-semibold text-white">{title}</p>
        <p className="mt-1.5 text-[14.5px] leading-relaxed text-[var(--text-muted)]">{description}</p>
        {children ? <div className="mt-5 flex w-full flex-col items-center gap-2.5">{children}</div> : null}
      </div>
    </div>
  );
}

/**
 * Okrągły przycisk talii z podpisem pod spodem.
 *
 * Cztery warianty różnią się **rozmiarem**, nie tylko kolorem: akcja główna
 * jest fizycznie największa, „cofnij" najmniejsze. Rozmiar czyta się
 * peryferyjnie — nie trzeba patrzeć wprost, żeby wiedzieć, który przycisk
 * jest tym właściwym.
 *
 * `icon` jest **wymagane**. Wcześniej było opcjonalne i przycisk „Nie teraz"
 * renderował się jako puste kółko z podpisem — wyglądało to na niedokończony
 * element, a nie na decyzję.
 */
export function DeckAction({
  label,
  onClick,
  href,
  disabled,
  loading,
  variant,
  icon,
  title,
}: {
  label: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  loading?: boolean;
  variant: "quiet" | "pass" | "primary" | "extra";
  icon: React.ReactNode;
  title?: string;
}) {
  const size =
    variant === "primary"
      ? "size-[68px]"
      : variant === "pass"
        ? "size-[60px]"
        : "size-12";

  const look =
    variant === "primary"
      ? "bg-[var(--vairo-strong)] text-white shadow-[0_8px_28px_rgba(238,95,28,.32)] hover:brightness-110"
      : variant === "pass"
        ? "border border-white/12 bg-[var(--surface)] text-[var(--text-muted)] hover:border-white/28 hover:text-white"
        : variant === "extra"
          ? "border border-white/12 bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--vairo)]/50 hover:text-white"
          : "border border-white/10 bg-transparent text-[var(--text-subtle)] hover:border-white/22 hover:text-white";

  const inner = (
    <>
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full transition-all duration-200",
          "group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-[var(--vairo)]",
          "group-active:scale-95",
          size,
          look,
          loading && "animate-pulse",
          disabled && "opacity-40"
        )}
      >
        {icon}
      </span>
      <span className="mt-2 block text-center text-[11px] leading-tight text-[var(--text-subtle)] sm:text-[11.5px]">
        {label}
      </span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        title={title}
        className="group flex w-[72px] flex-col items-center outline-none sm:w-[96px]"
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      className="group flex w-[72px] flex-col items-center outline-none disabled:cursor-not-allowed sm:w-[96px]"
    >
      {inner}
    </button>
  );
}

/**
 * Duże pionowe zdjęcie — lewa kolumna karty.
 *
 * Proporcja 3:4 zamiast 4:5: przy dwóch kolumnach karta nie może być wyższa
 * niż ekran, a 4:5 przy 360 px szerokości daje 450 px samego zdjęcia.
 * Gradient na dole jest po to, żeby biały tekst był czytelny na dowolnej
 * fotografii — bez niego imię na jasnym zdjęciu znika.
 */
export function DeckCover({
  image,
  fallback,
  children,
  className,
}: {
  image?: string | null;
  fallback: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative isolate aspect-[4/3] bg-[var(--surface-2)]",
        "sm:aspect-[16/9] md:aspect-[3/4] md:h-full md:max-h-[520px] md:min-h-[420px]",
        className
      )}
    >
      {image ? (
        // Zwykły <img>: adresy avatarów mają cache-buster w query i pochodzą
        // ze Storage, więc optymalizator Next.js nic tu nie wnosi.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <div className="topo-brand absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#f9a870]/18 to-[#e8551a]/10">
          {fallback}
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/92 via-black/70 to-transparent px-5 pb-5 pt-16">
        {children}
      </div>
    </div>
  );
}

/**
 * Blok treści w prawej kolumnie: drobny podpis i pod nim to, co człowiek
 * naprawdę napisał. Bez ramki, bez tła, bez wersalików — podpis ma tylko
 * powiedzieć, czym jest to, co pod nim, i zniknąć.
 */
export function DeckBlock({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("min-w-0", className)}>
      <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[var(--text-subtle)]">{label}</p>
      <div className="mt-1.5">{children}</div>
    </section>
  );
}
