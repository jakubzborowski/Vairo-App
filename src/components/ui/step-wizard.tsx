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
  /**
   * Sprawdzenie DOPIERO po kliknięciu „Dalej". Zwraca zdanie błędu albo null.
   * Przycisk zostaje aktywny, a błąd trafia do kroku przez `api.error` —
   * krok sam pokazuje go przy polu, którego dotyczy.
   */
  validate?: () => string | null;
  render: (api: WizardApi) => React.ReactNode;
};

export type WizardApi = {
  /** Skok do dowolnego kroku — „Zmień" w podsumowaniu. */
  goTo: (index: number) => void;
  /** Błąd z `validate` po ostatnim kliknięciu „Dalej". */
  error: string | null;
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
  /** Jedna linijka nad pytaniem — mówi, czemu ten kreator służy. */
  crumb?: React.ReactNode;
  /**
   * „Wstecz" obok „Dalej" w jednym rzędzie, zamiast samej strzałki u góry.
   * Widać wtedy zawsze, że da się wrócić.
   */
  footerBack?: boolean;
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
  crumb,
  footerBack = false,
}: Props) {
  const [index, setIndexState] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);
  const setIndex = (next: number) => {
    setStepError(null);
    setIndexState(Math.max(0, Math.min(next, steps.length - 1)));
  };
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

  const goForward = () => {
    const problem = step.validate?.() ?? null;
    if (problem) {
      setStepError(problem);
      return;
    }
    setStepError(null);
    if (isLast) onFinish();
    else setIndex(index + 1);
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
                  // Za Tobą — zielone, bieżący — pomarańczowy, przed Tobą — szare.
                  // Dwie różne barwy mówią „to już zrobione", nie „to ważne".
                  i < current
                    ? "bg-[var(--success)]/70"
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
        {crumb ? (
          <p className="mb-3 text-[13px] text-[var(--text-subtle)]">{crumb}</p>
        ) : null}
        <h1 className="font-heading text-[1.7rem] font-semibold leading-tight tracking-tight text-white sm:text-[1.95rem]">
          {step.title}
        </h1>
        {step.description ? (
          <p className="mt-2.5 text-[15px] leading-relaxed text-[var(--text-subtle)]">
            {step.description}
          </p>
        ) : null}

        <div className="mt-7">{step.render({ goTo: setIndex, error: stepError })}</div>

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

      <div
        className={cn(
          "mt-9 flex items-center gap-3",
          // Na telefonie przyciski przypięte do dołu, w zasięgu kciuka.
          footerBack &&
            "sticky bottom-0 -mx-4 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)] to-transparent px-4 pb-4 pt-6 sm:static sm:mx-0 sm:bg-none sm:p-0"
        )}
      >
        {footerBack && (index > 0 || onExit) ? (
          <Button size="lg" variant="secondary" onClick={goBack} className="sm:min-w-[120px]">
            <ArrowLeft className="size-4" />
            {index > 0 ? "Wstecz" : exitLabel}
          </Button>
        ) : null}
        <Button
          size="lg"
          block
          disabled={!canContinue}
          loading={isLast ? finishing : false}
          onClick={goForward}
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
          {/* „bez zaznaczania" pasowało do kroków z wyborem, ale ten sam
              kreator ma też krok ze zdjęciem i kroki z polem tekstowym —
              a tam nie ma czego zaznaczać. Sformułowanie neutralne działa
              na wszystkich. */}
          Ten krok jest opcjonalny — „Dalej” działa też pusty.
        </p>
      ) : null}
    </div>
  );
}
