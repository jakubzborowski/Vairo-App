"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { setLocale } from "@/i18n/actions";
import { useLocale, useT } from "@/i18n/client";
import { LOCALES, LOCALE_NAMES, type Locale } from "@/i18n/config";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

/**
 * Wybór języka interfejsu — w Ustawieniach konta.
 *
 * Cztery wiersze zamiast listy rozwijanej: przy czterech opcjach lista tylko
 * chowa wybór o jedno kliknięcie głębiej. Nazwy języków są we własnym języku
 * („Deutsch”, nie „Niemiecki”), bo tak szuka ich ktoś, kto nie czyta
 * bieżącego interfejsu. Toast potwierdza zmianę już w nowym języku.
 */
export function LanguageSwitcher() {
  const t = useT("settings");
  const current = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();

  const choose = (next: Locale) => {
    if (next === current || pending) return;
    start(async () => {
      const result = await setLocale(next);
      if (result.error) {
        toast({ tone: "error", title: result.error });
        return;
      }
      router.refresh();
    });
  };

  return (
    <div role="radiogroup" aria-label={t("language.title")} className="divide-y divide-white/[0.05]">
      {LOCALES.map((locale) => {
        const active = locale === current;
        return (
          <button
            key={locale}
            type="button"
            role="radio"
            aria-checked={active}
            lang={locale}
            disabled={pending}
            onClick={() => choose(locale)}
            className={cn(
              "flex min-h-14 w-full items-center gap-3.5 px-5 py-3 text-left text-[14.5px] transition-colors",
              active ? "text-white" : "text-[var(--text-muted)] hover:bg-white/[0.03] hover:text-white"
            )}
          >
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-2)] text-[12px] font-semibold uppercase tracking-wide">
              {locale}
            </span>
            <span className="min-w-0 flex-1">{LOCALE_NAMES[locale]}</span>
            {active ? (
              pending ? (
                <Loader2 className="size-4 animate-spin text-[var(--text-subtle)]" aria-hidden="true" />
              ) : (
                <Check className="size-4 text-[var(--success)]" aria-hidden="true" />
              )
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
