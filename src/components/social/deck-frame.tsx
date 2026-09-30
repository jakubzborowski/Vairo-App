"use client";

import Link from "next/link";
import { RotateCcw, Sparkles, Undo2, X } from "lucide-react";
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
};

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
}: Props) {
  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col">
      <article className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-[var(--surface)] lift-3 md:grid md:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        {cover}

        <div className="flex min-w-0 flex-col gap-4 px-5 py-5 sm:px-6 lg:max-h-[520px] lg:overflow-y-auto">
          {/* Powód stoi na samej górze prawej kolumny: to jedno zdanie
              decyduje, czy warto czytać resztę. */}
          {reasons.length > 0 ? (
            <p className="flex items-start gap-2 rounded-xl bg-[var(--vairo)]/[0.07] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[var(--text-muted)]">
              <Sparkles
                className="mt-[3px] size-3.5 shrink-0 text-[var(--vairo)]"
                aria-hidden="true"
              />
              <span>
                <span className="sr-only">Dlaczego to widzisz: </span>
                {reasons.map((reason) => reason.text).join(" · ")}
              </span>
            </p>
          ) : null}

          <div className="min-w-0 flex-1">{body}</div>

          {footer ? (
            <div className="text-[12.5px] text-[var(--text-faint)]">{footer}</div>
          ) : null}
        </div>
      </article>

      {/* Rząd akcji. „Cofnij" jest tu jednym z przycisków, nie linkiem obok —
          to ta sama klasa decyzji co reszta i zasługuje na ten sam kształt. */}
      {/* Na telefonie cztery przyciski po 96 px z odstępami po 20 px dają
          444 px przy 343 px dostępnych — zawijały się do dwóch rzędów, przez
          co „Zaproś" lądowało samo pod spodem i wyglądało na coś innego niż
          reszta. Węższe pole podpisu i mniejszy odstęp mieszczą wszystkie
          cztery w jednym rzędzie. */}
      <div className="mt-5 flex flex-wrap items-start justify-center gap-3 sm:gap-7">
        {canUndo ? (
          <DeckAction
            variant="quiet"
            label="Cofnij"
            icon={<Undo2 className="size-5" />}
            onClick={onUndo}
            disabled={busy}
            title="Przywróć ostatnio pominiętą kartę"
          />
        ) : null}

        <DeckAction
          variant="pass"
          label={passLabel}
          icon={<X className="size-6" strokeWidth={2.5} />}
          onClick={onPass}
          disabled={busy}
        />

        {action}
        {extraAction}
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-center text-[13px] text-[var(--danger)]">
          {error}
        </p>
      ) : null}

      {/* Licznik drobnym drukiem na samym dole — informacja porządkowa ma być
          dostępna, a nie widoczna. */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <span className="tabular inline-flex items-center gap-2 text-[12.5px] text-[var(--text-subtle)]">
          <span className="font-semibold text-white">{position}</span>
          <span>z {total}</span>
          <span className="flex h-1 w-20 overflow-hidden rounded-full bg-white/8">
            <span
              className="h-full rounded-full bg-[var(--vairo)] transition-[width] duration-300"
              style={{ width: `${(position / Math.max(total, 1)) * 100}%` }}
            />
          </span>
        </span>

        {passedCount > 0 ? (
          <button
            type="button"
            onClick={onRestoreAll}
            disabled={busy}
            className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--text-subtle)] transition-colors hover:text-white"
          >
            <RotateCcw className="size-3.5" />
            Przywróć pominięte ({passedCount})
          </button>
        ) : null}
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
      <p className="text-[11.5px] font-medium text-[var(--text-subtle)]">{label}</p>
      <div className="mt-1.5">{children}</div>
    </section>
  );
}
