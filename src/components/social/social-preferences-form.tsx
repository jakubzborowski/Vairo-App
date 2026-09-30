"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Eye, EyeOff } from "lucide-react";
import { saveSocialPreferences } from "@/app/app/social/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { LOOKING_FOR_OPTIONS, type LookingFor } from "@/types/social";

type Props = {
  lookingFor: LookingFor | null;
  location: string;
  weeklyHours: number | null;
  isDiscoverable: boolean;
};

/**
 * Ustawienia widoczności w Social.
 *
 * Trzy pytania, każde z konkretnym skutkiem — i wyłącznik na samej górze
 * listy skutków, bo „czy w ogóle chcę być widoczny" jest ważniejsze niż
 * cokolwiek poniżej.
 */
export function SocialPreferencesForm({
  lookingFor: initialLookingFor,
  location: initialLocation,
  weeklyHours: initialHours,
  isDiscoverable: initialDiscoverable,
}: Props) {
  const router = useRouter();
  const [lookingFor, setLookingFor] = useState<LookingFor | null>(initialLookingFor);
  const [location, setLocation] = useState(initialLocation);
  const [hours, setHours] = useState(initialHours ? String(initialHours) : "");
  const [discoverable, setDiscoverable] = useState(initialDiscoverable);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, startSaving] = useTransition();

  const dirty =
    lookingFor !== initialLookingFor ||
    location !== initialLocation ||
    hours !== (initialHours ? String(initialHours) : "") ||
    discoverable !== initialDiscoverable;

  const submit = () => {
    setError(null);
    setSaved(false);
    startSaving(async () => {
      const result = await saveSocialPreferences({
        lookingFor,
        location,
        weeklyHours: hours.trim() ? Number(hours) : null,
        isDiscoverable: discoverable,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={() => setDiscoverable((value) => !value)}
        aria-pressed={discoverable}
        className={cn(
          "flex items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors",
          discoverable
            ? "border-[var(--success)]/35 bg-[var(--success)]/8"
            : "border-white/10 bg-[var(--surface-2)]"
        )}
      >
        {discoverable ? (
          <Eye className="mt-0.5 size-4 shrink-0 text-[var(--success)]" />
        ) : (
          <EyeOff className="mt-0.5 size-4 shrink-0 text-[var(--text-faint)]" />
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-medium text-white">
            {discoverable ? "Jesteś widoczny w Odkrywaj" : "Jesteś ukryty"}
          </span>
          <span className="mt-0.5 block text-[12.5px] leading-relaxed text-[var(--text-subtle)]">
            {discoverable
              ? "Inni mogą Cię znaleźć i zaprosić do teamu. Twój e-mail widzą dopiero osoby z tego samego teamu."
              : "Nie pojawiasz się w wyszukiwarce ani na publicznych stronach teamów. Nadal możesz sam zgłaszać się do projektów."}
          </span>
        </span>
      </button>

      <div>
        <p className="mb-2 text-[13px] font-medium text-[var(--text-muted)]">
          Czego teraz szukasz?
        </p>
        <div className="flex flex-col gap-1.5">
          {LOOKING_FOR_OPTIONS.map((option) => {
            const selected = lookingFor === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  setLookingFor(selected ? null : option.value)
                }
                aria-pressed={selected}
                className={cn(
                  "flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-left transition-colors",
                  selected
                    ? "border-[var(--vairo)]/60 bg-[var(--vairo)]/8"
                    : "border-white/10 hover:border-white/22"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 inline-flex size-[18px] shrink-0 items-center justify-center rounded-full border",
                    selected
                      ? "border-[var(--vairo)] bg-[var(--vairo)] text-black"
                      : "border-white/25"
                  )}
                  aria-hidden="true"
                >
                  {selected ? <Check className="size-3" strokeWidth={3} /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-medium text-white">
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-[12.5px] leading-relaxed text-[var(--text-subtle)]">
                    {option.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Skąd jesteś" hint="Miasto albo kraj. Opcjonalne.">
          {({ id }) => (
            <Input
              id={id}
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              maxLength={80}
              placeholder="np. Kraków"
            />
          )}
        </Field>

        <Field
          label="Ile godzin tygodniowo"
          hint="Najczęstsze źródło rozczarowań w zespołach. Lepiej powiedzieć wprost."
        >
          {({ id }) => (
            <Input
              id={id}
              type="number"
              min={1}
              max={80}
              value={hours}
              onChange={(event) => setHours(event.target.value)}
              placeholder="np. 10"
            />
          )}
        </Field>
      </div>

      {error ? (
        <p className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-[13px] text-[var(--danger)]">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button onClick={submit} loading={saving} disabled={!dirty}>
          Zapisz
        </Button>
        {saved && !dirty ? (
          <span className="inline-flex items-center gap-1.5 text-[13px] text-[var(--success)]">
            <Check className="size-4" />
            Zapisane
          </span>
        ) : null}
      </div>
    </div>
  );
}
