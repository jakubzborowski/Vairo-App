"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { FieldInputProps } from "./field-inputs";

type Person = {
  id: string;
  full_name: string | null;
  headline: string | null;
  avatar_url: string | null;
};

const asIds = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

/**
 * Prawdziwe profile z warstwy Social. Wybór zapisuje się jako lista id
 * i jest dowodem podpunktu. Zaproszenie do startupu zostaje w Odkrywaj.
 */
export function PeopleInput({ value, onChange, disabled }: FieldInputProps) {
  const selected = asIds(value);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("public_profiles")
      .select("id, full_name, headline, avatar_url")
      .order("created_at", { ascending: false })
      .limit(40)
      .then(({ data, error: loadError }) => {
        if (cancelled) return;
        if (loadError) setError("Nie udało się wczytać osób z platformy.");
        else setPeople((data ?? []) as Person[]);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (id: string) => {
    if (disabled) return;
    onChange(
      selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <Link
        href="/app/social/discover?tab=people"
        className="text-[13px] text-[var(--vairo)] underline-offset-2 hover:underline"
      >
        Otwórz Odkrywaj, żeby zobaczyć więcej osób
      </Link>

      {loading ? (
        <p className="inline-flex items-center gap-2 text-[13px] text-[var(--text-subtle)]">
          <Loader2 className="size-3.5 animate-spin" />
          Wczytuję profile
        </p>
      ) : null}

      {error ? <p className="text-[13px] text-[var(--warning)]">{error}</p> : null}

      {!loading && !error && people.length === 0 ? (
        <p className="text-[13px] leading-relaxed text-[var(--text-subtle)]">
          Na platformie nie ma jeszcze widocznych profili. Uzupełnij swój w
          Social i wróć tutaj, gdy ktoś się pojawi.
        </p>
      ) : null}

      <ul className="flex flex-col gap-2">
        {people.map((person) => {
          const on = selected.includes(person.id);
          return (
            <li key={person.id}>
              <button
                type="button"
                onClick={() => toggle(person.id)}
                disabled={disabled}
                aria-pressed={on}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left",
                  on
                    ? "border-[var(--vairo)]/50 bg-[var(--vairo)]/10"
                    : "border-white/10 bg-[var(--surface-2)] hover:border-white/20"
                )}
              >
                <Avatar
                  src={person.avatar_url}
                  name={person.full_name ?? "Profil"}
                  size="sm"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] text-white">
                    {person.full_name ?? "Profil bez imienia"}
                  </span>
                  {person.headline ? (
                    <span className="block truncate text-[12.5px] text-[var(--text-subtle)]">
                      {person.headline}
                    </span>
                  ) : null}
                </span>
                {on ? <Check className="size-4 shrink-0 text-[var(--vairo)]" /> : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
