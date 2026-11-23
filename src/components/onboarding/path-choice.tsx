"use client";

import { useState, useTransition } from "react";
import { Compass, Lightbulb, Rocket, type LucideIcon } from "lucide-react";
import { chooseOnboardingPath } from "@/app/onboarding/actions";
import { cn } from "@/lib/utils";
import type { OnboardingPath } from "@/types/profile";
import { useT } from "@/i18n/client";

type Option = { key: OnboardingPath; icon: LucideIcon };

// Teksty: słownik `onboarding`, klucze `path.<key>.title|description|outcome`.
const OPTIONS: Option[] = [
  { key: "founder_idea", icon: Rocket },
  { key: "founder_no_idea", icon: Lightbulb },
  { key: "joiner", icon: Compass },
];

export function PathChoice() {
  const t = useT("onboarding");
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
          {t("path.title")}
        </h1>
        <p className="mt-2.5 text-[15px] text-[var(--text-subtle)]">
          {t("path.subtitle")}
        </p>
      </div>

      <div className="mt-9 grid gap-3">
        {OPTIONS.map(({ key, icon: Icon }) => {
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
                  {t(`path.${key}.title`)}
                </span>
                <span className="mt-1 block text-[14px] leading-relaxed text-[var(--text-muted)]">
                  {t(`path.${key}.description`)}
                </span>
                <span className="mt-2.5 inline-block rounded-md bg-white/6 px-2 py-0.5 text-[12px] font-medium text-[var(--text-subtle)]">
                  {isSelected && pending ? t("path.pending") : t(`path.${key}.outcome`)}
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
