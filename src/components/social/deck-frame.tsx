"use client";

import { RotateCcw, Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  /** Numer bieżącej karty i długość talii — „3 z 12". */
  index: number;
  total: number;
  passedCount: number;
  busy: boolean;
  error: string | null;
  canUndo: boolean;
  onPass: () => void;
  onUndo: () => void;
  onRestoreAll: () => void;
  /** Duże zdjęcie albo logo z nazwą na dole. */
  cover: React.ReactNode;
  /** Reszta informacji — na telefonie pod spodem, na dużym ekranie obok. */
  details: React.ReactNode;
  /** Akcja główna: „Napisz" albo „Zgłoś się". */
  action: React.ReactNode;
  /**
   * Druga akcja, gdy istnieje — np. „Zaproś do teamu" dla Foundera.
   * Idzie w osobny rząd pod spodem, bo trzy przyciski w jednej linii
   * przestają być czytelne na telefonie.
   */
  extraAction?: React.ReactNode;
  passLabel: string;
};

/**
 * Rama talii w Odkrywaj — jedna osoba (albo jeden team) na ekran.
 *
 * Przeglądanie siatki kilkudziesięciu kart naraz nie pomaga przy decyzji „czy
 * chcę z tą osobą pracować". Dlatego pokazujemy jedną, dużą, z konkretem na
 * wierzchu i dwiema drogami wyjścia: pomiń albo napisz. Pominięci nie wracają,
 * więc przeglądanie ma koniec.
 *
 * Na telefonie: zdjęcie → akcje → szczegóły (akcje od razu widoczne, bez
 * przewijania). Na dużym ekranie zdjęcie i akcje po lewej, szczegóły po prawej,
 * żeby nie marnować szerokości.
 */
export function DeckFrame({
  index,
  total,
  passedCount,
  busy,
  error,
  canUndo,
  onPass,
  onUndo,
  onRestoreAll,
  cover,
  details,
  action,
  extraAction,
  passLabel,
}: Props) {
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="tabular text-[13px] text-[var(--text-muted)]">
            <span className="font-semibold text-white">{index + 1}</span> z {total}
          </span>
          <span className="flex h-1.5 w-32 overflow-hidden rounded-full bg-white/8">
            <span
              className="h-full rounded-full bg-[var(--vairo)] transition-[width] duration-300"
              style={{ width: `${((index + 1) / Math.max(total, 1)) * 100}%` }}
            />
          </span>
        </div>

        <div className="flex items-center gap-2">
          {canUndo ? (
            <button
              type="button"
              onClick={onUndo}
              disabled={busy}
              className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--text-subtle)] transition-colors hover:text-white"
            >
              <Undo2 className="size-3.5" />
              Cofnij
            </button>
          ) : null}
          {passedCount > 0 ? (
            <button
              type="button"
              onClick={onRestoreAll}
              disabled={busy}
              className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--text-subtle)] transition-colors hover:text-white"
            >
              <RotateCcw className="size-3.5" />
              Pominięci: {passedCount} — przywróć
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:items-start">
        <div className="mx-auto flex w-full max-w-[420px] flex-col gap-3 lg:mx-0 lg:max-w-none">
          {cover}

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="lg"
              className="flex-1"
              disabled={busy}
              onClick={onPass}
            >
              <X className="size-[18px]" />
              {passLabel}
            </Button>
            <div className="flex-1 [&>*]:w-full">{action}</div>
          </div>

          {extraAction ? (
            <div className="[&>*]:w-full">{extraAction}</div>
          ) : null}

          {error ? (
            <p className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-[13px] text-[var(--danger)]">
              {error}
            </p>
          ) : null}
        </div>

        <div className="min-w-0">{details}</div>
      </div>
    </div>
  );
}

/**
 * Zdjęcie na całą szerokość karty z informacjami wtopionymi w dolną krawędź.
 * Gradient jest po to, żeby biały tekst był czytelny na dowolnej fotografii.
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
        "relative overflow-hidden rounded-3xl border border-white/[0.07] bg-[var(--surface-2)]",
        "aspect-[4/5]",
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
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#f9a870]/25 to-[#e8551a]/15">
          {fallback}
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/92 via-black/70 to-transparent px-5 pb-5 pt-16">
        {children}
      </div>
    </div>
  );
}

/** Sekcja szczegółów pod zdjęciem — nagłówek plus treść. */
export function DeckSection({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-white/[0.07] bg-[var(--surface)] px-5 py-4",
        className
      )}
    >
      <p className="text-[11.5px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">
        {title}
      </p>
      <div className="mt-2.5">{children}</div>
    </section>
  );
}
