"use client";

import { useState, useTransition } from "react";
import { Compass, Lightbulb, Rocket, type LucideIcon } from "lucide-react";
import { chooseOnboardingPath } from "@/app/onboarding/actions";
import { cn } from "@/lib/utils";
import type { OnboardingPath } from "@/types/profile";

type Option = {
  key: OnboardingPath;
  icon: LucideIcon;
  title: string;
  description: string;
  outcome: string;
};

/**
 * Trzy kafelki na wejściu. Ścieżka różnicuje wyłącznie onboarding —
 * później wszystkie konta są identyczne, a Joiner w każdej chwili
 * zakłada startup. Dlatego opisy mówią „na start", a nie „jesteś".
 */
const OPTIONS: Option[] = [
  {
    key: "founder_idea",
    icon: Rocket,
    title: "Mam pomysł",
    description:
      "Wiesz, co chcesz zbudować. Opiszesz pomysł, nazwiesz projekt i od razu przejdziesz do sprawdzania, czy ma sens.",
    outcome: "Zaczynasz od Idea Stage",
  },
  {
    key: "founder_no_idea",
    icon: Lightbulb,
    title: "Chcę coś zbudować, ale nie wiem co",
    description:
      "Przeprowadzimy Cię przez kilka pytań, po których będziesz mieć pierwszy konkretny zarys projektu.",
    outcome: "Zaczynasz od Ambition Stage · 10–15 min",
  },
  {
    key: "joiner",
    icon: Compass,
    title: "Chcę dołączyć do kogoś",
    description:
      "Uzupełnisz profil i trafisz do Social, gdzie znajdziesz teamy szukające ludzi — albo one znajdą Ciebie.",
    outcome: "Zaczynasz od Social",
  },
];

export function PathChoice() {
  const [selected, setSelected] = useState<OnboardingPath | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const choose = (path: OnboardingPath) => {
    setSelected(path);
    setError(null);
    startTransition(async () => {
      const result = await chooseOnboardingPath(path);
      if (result?.error) {
        setError(result.error);
        setSelected(null);
      }
    });
  };

  return (
    <div>
      <div className="text-center">
        <h1 className="font-heading text-[1.9rem] font-semibold tracking-tight text-white sm:text-[2.2rem]">
          Od czego zaczynasz?
        </h1>
        <p className="mt-2.5 text-[15px] text-[var(--text-subtle)]">
          Wybór dotyczy tylko pierwszych kroków. Później nic Cię nie ogranicza.
        </p>
      </div>

      <div className="mt-9 grid gap-3">
        {OPTIONS.map(({ key, icon: Icon, title, description, outcome }) => {
          const isSelected = selected === key;
          return (
            <button
              key={key}
              type="button"
              disabled={pending}
              onClick={() => choose(key)}
              aria-busy={isSelected && pending}
              className={cn(
                "group flex items-start gap-4 rounded-2xl border p-5 text-left transition-all",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--vairo)]",
                isSelected
                  ? "border-[var(--vairo)] bg-[var(--vairo)]/8"
                  : "border-white/10 bg-[var(--surface)] hover:border-white/22 hover:bg-[var(--surface-2)]",
                pending && !isSelected && "opacity-40"
              )}
            >
              <span
                className={cn(
                  "inline-flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors",
                  isSelected
                    ? "bg-[var(--vairo)] text-white"
                    : "bg-[var(--surface-2)] text-[var(--text-subtle)] group-hover:text-white"
                )}
              >
                <Icon className="size-5" strokeWidth={1.75} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block font-heading text-[17px] font-semibold text-white">
                  {title}
                </span>
                <span className="mt-1 block text-[14px] leading-relaxed text-[var(--text-muted)]">
                  {description}
                </span>
                <span className="mt-2.5 inline-block rounded-md bg-white/6 px-2 py-0.5 text-[12px] font-medium text-[var(--text-subtle)]">
                  {isSelected && pending ? "Chwileczkę…" : outcome}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {error ? (
        <p className="mt-5 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-center text-[13px] text-[var(--danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
