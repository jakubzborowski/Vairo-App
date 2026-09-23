"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type WizardStep = {
  key: string;
  /** Pytanie w pierwszej osobie, zwykłym językiem. */
  title: string;
  /** Jedno zdanie wyjaśnienia pod pytaniem. */
  description?: string;
  /** Podpowiedź pod polem — dlaczego o to pytamy albo jak odpowiedzieć. */
  help?: string;
  /**
   * Krok, na którym brak wyboru jest poprawną odpowiedzią.
   * „Dalej" zostaje aktywne — nie zmuszamy do szukania osobnego „Pomiń".
   */
  optional?: boolean;
  /** Blokuje „Dalej", dopóki nie jest spełnione. Ignorowane przy `optional`. */
  canContinue?: boolean;
  render: () => React.ReactNode;
};

type Props = {
  steps: WizardStep[];
  finishLabel: string;
  onFinish: () => void;
  finishing?: boolean;
  error?: string | null;
  /** Wyjście z kreatora — strzałka w lewym górnym rogu na pierwszym kroku. */
  onExit?: () => void;
  exitLabel?: string;
  /**
   * Gdy kreator jest częścią dłuższego procesu (np. ostatnie 3 kroki
   * onboardingu), pasek pokazuje postęp całości, a nie samego kreatora —
   * inaczej user widziałby „1 z 3" tuż po „3 z 3" i nie wiedziałby, ile
   * jeszcze przed nim.
   */
  stepOffset?: number;
  overallTotal?: number;
};

/**
 * Kreator: jedno pytanie na ekran.
 *
 * Vairo jest dla ludzi, którzy mogą się na tym całkowicie nie znać — formularz
 * z ośmioma polami naraz ich odrzuca, a pięć spokojnych ekranów po jednym
 * pytaniu nie. Postęp jest zawsze widoczny, powrót zawsze dostępny.
 */
export function StepWizard({
  steps,
  finishLabel,
  onFinish,
  finishing,
  error,
  onExit,
  exitLabel = "Wróć",
  stepOffset = 0,
  overallTotal,
}: Props) {
  const [index, setIndex] = useState(0);
  const step = steps[index]!;
  const isLast = index === steps.length - 1;
  // Krok opcjonalny zawsze przepuszcza dalej. Wyszarzony przycisk główny
  // i osobny link „Pomiń" obok niego to dwie akcje tam, gdzie wystarczy jedna.
  const canContinue = step.optional ? true : step.canContinue !== false;

  const total = overallTotal ?? steps.length;
  const current = stepOffset + index;

  const goBack = () => {
    if (index > 0) setIndex(index - 1);
    else onExit?.();
  };

  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col">
      <div className="mb-8 flex items-center gap-4">
        {index > 0 || onExit ? (
          <button
            type="button"
            onClick={goBack}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-[var(--text-subtle)] transition-colors hover:border-white/22 hover:text-white"
            aria-label={index > 0 ? "Poprzedni krok" : exitLabel}
          >
            <ArrowLeft className="size-4" />
          </button>
        ) : null}

        <div className="flex flex-1 items-center gap-3">
          <div className="flex flex-1 gap-1.5" aria-hidden="true">
            {Array.from({ length: total }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors duration-300",
                  i < current
                    ? "bg-[var(--vairo)]/50"
                    : i === current
                      ? "bg-[var(--vairo)]"
                      : "bg-white/12"
                )}
              />
            ))}
          </div>
          <span className="tabular shrink-0 text-[12px] text-[var(--text-subtle)]">
            {current + 1} z {total}
          </span>
        </div>
      </div>

      <div key={step.key} className="app-enter">
        <h1 className="font-heading text-[1.7rem] font-semibold leading-tight tracking-tight text-white sm:text-[1.95rem]">
          {step.title}
        </h1>
        {step.description ? (
          <p className="mt-2.5 text-[15px] leading-relaxed text-[var(--text-subtle)]">
            {step.description}
          </p>
        ) : null}

        <div className="mt-7">{step.render()}</div>

        {step.help ? (
          <p className="mt-4 rounded-xl border border-white/8 bg-[var(--surface)] px-4 py-3 text-[13px] leading-relaxed text-[var(--text-subtle)]">
            {step.help}
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="mt-6 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-[13px] text-[var(--danger)]">
          {error}
        </p>
      ) : null}

      <div className="mt-9 flex items-center gap-3">
        <Button
          size="lg"
          block
          disabled={!canContinue}
          loading={isLast ? finishing : false}
          onClick={() => (isLast ? onFinish() : setIndex(index + 1))}
        >
          {isLast ? (
            <>
              <Check className="size-4" />
              {finishLabel}
            </>
          ) : (
            <>
              Dalej
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </div>

      {step.optional ? (
        <p className="mt-3 text-center text-[12.5px] text-[var(--text-faint)]">
          Nic tu nie jest wymagane — możesz przejść dalej bez zaznaczania.
        </p>
      ) : null}
    </div>
  );
}
