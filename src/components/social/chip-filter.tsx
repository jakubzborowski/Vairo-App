"use client";

import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { cn, plural } from "@/lib/utils";

type Option = { value: string; label: string };

/**
 * Grupa filtrów w Odkrywaj jako „chipy” — zamiast pól wyboru w okienku
 * z systemowym paskiem przewijania, który wyglądał jak formularz sprzed lat.
 *
 * Działa w zwykłym formularzu GET: każdy zaznaczony chip to checkbox
 * z tą samą nazwą (`?skill=a&skill=b`). Zaznaczenia schowane przez
 * wyszukiwanie albo zwinięcie listy idą jako pola ukryte — inaczej
 * „Zastosuj” po cichu by je zgubił.
 */
export function ChipFilter({
  name,
  label,
  options,
  selected,
  searchable = false,
  collapsedCount = 12,
}: {
  name: string;
  label: string;
  options: Option[];
  selected: string[];
  /** Pole wyszukiwania i zwinięta lista — dla długich list (umiejętności). */
  searchable?: boolean;
  collapsedCount?: number;
}) {
  const [chosen, setChosen] = useState(() => new Set(selected));
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  // Zaznaczone przy wejściu idą na początek. Kolejność liczona tylko z tego,
  // co przyszło z adresu — gdyby liczyć z bieżących kliknięć, chip
  // uciekałby spod kursora.
  const ordered = useMemo(() => {
    const initial = new Set(selected);
    return [
      ...options.filter((option) => initial.has(option.value)),
      ...options.filter((option) => !initial.has(option.value)),
    ];
  }, [options, selected]);

  const needle = query.trim().toLocaleLowerCase("pl");
  const filtered = needle
    ? ordered.filter((option) => option.label.toLocaleLowerCase("pl").includes(needle))
    : ordered;
  const limit = searchable && !expanded && !needle ? collapsedCount : filtered.length;
  const visible = filtered.slice(0, limit);
  const visibleValues = new Set(visible.map((option) => option.value));
  const hiddenChosen = [...chosen].filter((value) => !visibleValues.has(value));

  const toggle = (value: string) =>
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });

  return (
    <fieldset className="min-w-0">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <legend className="text-[13px] font-semibold text-white">
          {label}
          {chosen.size > 0 ? (
            <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white/[0.12] px-1.5 text-[11.5px] font-semibold text-white">
              {chosen.size}
            </span>
          ) : null}
        </legend>
        {chosen.size > 0 ? (
          <button
            type="button"
            onClick={() => setChosen(new Set())}
            className="rounded-md px-1.5 py-0.5 text-[12px] text-[var(--text-subtle)] transition-colors hover:text-white"
          >
            Wyczyść
          </button>
        ) : null}
      </div>

      {searchable ? (
        <div className="mb-2.5 flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 transition-colors focus-within:border-white/25">
          <Search className="size-3.5 shrink-0 text-[var(--text-faint)]" aria-hidden="true" />
          {/* Bez `name` — to tylko zawężenie listy chipów, nie filtr wyników. */}
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              // Enter w tym polu nie wysyła formularza — ktoś szuka chipa,
              // a nie chce jeszcze filtrować wyników.
              if (event.key === "Enter") event.preventDefault();
            }}
            placeholder={`Szukaj: ${label.toLocaleLowerCase("pl")}`}
            aria-label={`Szukaj w grupie ${label}`}
            className="h-9 w-full bg-transparent text-[13px] text-white outline-none placeholder:text-[var(--text-faint)]"
          />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-1.5">
        {visible.map((option) => {
          const on = chosen.has(option.value);
          return (
            <label
              key={option.value}
              className={cn(
                "inline-flex min-h-9 cursor-pointer select-none items-center gap-1.5 rounded-full border px-3 text-[13px] transition-colors",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--vairo)]",
                on
                  ? "border-white/35 bg-white/[0.1] text-white"
                  : "border-white/[0.08] bg-white/[0.03] text-[var(--text-muted)] hover:border-white/20 hover:text-white"
              )}
            >
              <input
                type="checkbox"
                name={name}
                value={option.value}
                checked={on}
                onChange={() => toggle(option.value)}
                className="sr-only"
              />
              {on ? <Check className="size-3.5" aria-hidden="true" /> : null}
              {option.label}
            </label>
          );
        })}
        {visible.length === 0 ? (
          <p className="py-1.5 text-[12.5px] text-[var(--text-subtle)]">Nic nie pasuje do „{query}”.</p>
        ) : null}
      </div>

      {hiddenChosen.map((value) => (
        <input key={value} type="hidden" name={name} value={value} />
      ))}

      {searchable && !needle && filtered.length > collapsedCount ? (
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          className="mt-2 rounded-md px-1 text-[12.5px] text-[var(--text-subtle)] transition-colors hover:text-white"
        >
          {expanded
            ? "Zwiń"
            : `Pokaż wszystkie (${filtered.length} ${plural(filtered.length, "pozycja", "pozycje", "pozycji")})`}
        </button>
      ) : null}
    </fieldset>
  );
}
