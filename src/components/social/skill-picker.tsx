"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Search } from "lucide-react";
import { createCustomSkill } from "@/app/app/settings/profile/actions";
import { Input } from "@/components/ui/input";
import { Pill } from "@/components/ui/pill";

export type SkillOption = { id: string; label: string };

type Props = {
  skills: SkillOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  /** Nowo utworzone umiejętności trzeba dopisać do katalogu w stanie rodzica. */
  onSkillCreated: (skill: SkillOption) => void;
};

const VISIBLE_WITHOUT_QUERY = 18;

/**
 * Wybór umiejętności: szukaj albo dopisz własną.
 *
 * Bez zapytania pokazujemy krótką listę, a nie dwieście pigułek — ekran z
 * dwustoma opcjami paraliżuje kogoś, kto pierwszy raz wypełnia taki profil.
 */
export function SkillPicker({
  skills,
  selectedIds,
  onChange,
  onSkillCreated,
}: Props) {
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startPending] = useTransition();

  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
  const trimmed = query.trim();

  const visible = useMemo(() => {
    if (!trimmed) {
      // Wybrane zawsze na wierzchu, żeby nie znikały przy przewijaniu listy.
      const chosen = skills.filter((skill) => selected.has(skill.id));
      const rest = skills.filter((skill) => !selected.has(skill.id));
      return [...chosen, ...rest].slice(
        0,
        Math.max(VISIBLE_WITHOUT_QUERY, chosen.length + 6)
      );
    }
    const needle = trimmed.toLowerCase();
    return skills.filter((skill) => skill.label.toLowerCase().includes(needle));
  }, [skills, selected, trimmed]);

  const exactExists = skills.some(
    (skill) => skill.label.toLowerCase() === trimmed.toLowerCase()
  );
  const canCreate = trimmed.length >= 1 && trimmed.length <= 48 && !exactExists;

  const toggle = (id: string) =>
    onChange(
      selected.has(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]
    );

  const create = () => {
    setError(null);
    startPending(async () => {
      const result = await createCustomSkill(trimmed);
      if (result.error || !result.skill) {
        setError(result.error ?? "Nie udało się dodać umiejętności.");
        return;
      }
      const skill = { id: result.skill.id as string, label: result.skill.label as string };
      onSkillCreated(skill);
      onChange([...selectedIds, skill.id]);
      setQuery("");
    });
  };

  return (
    <div>
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[var(--text-faint)]"
          aria-hidden="true"
        />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && canCreate) {
              event.preventDefault();
              create();
            }
          }}
          placeholder="Szukaj albo wpisz własną…"
          className="pl-10"
          aria-label="Szukaj umiejętności"
        />
      </div>

      {canCreate ? (
        <button
          type="button"
          onClick={create}
          disabled={pending}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[13px] text-[var(--vairo)] transition-colors hover:bg-[var(--vairo)]/10"
        >
          <Plus className="size-3.5" />
          Dodaj &bdquo;{trimmed}&rdquo;
        </button>
      ) : null}

      {error ? (
        <p className="mt-2 text-[12.5px] text-[var(--danger)]">{error}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {visible.length === 0 ? (
          <p className="text-[13px] text-[var(--text-subtle)]">
            Brak wyników. Naciśnij Enter, żeby dodać własną umiejętność.
          </p>
        ) : (
          visible.map((skill) => (
            <Pill
              key={skill.id}
              selected={selected.has(skill.id)}
              onToggle={() => toggle(skill.id)}
            >
              {skill.label}
            </Pill>
          ))
        )}
      </div>

      <p className="mt-3 text-[12.5px] text-[var(--text-faint)]">
        Wybrane: {selectedIds.length}
      </p>
    </div>
  );
}
