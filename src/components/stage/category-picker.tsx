"use client";

import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Pill } from "@/components/ui/pill";
import { cn } from "@/lib/utils";
import { SELECTABLE_CATEGORIES, type IndustryTag } from "@/types/startup";

/**
 * Cztery kategorie walidacyjne obok siebie, na jednym ekranie.
 *
 * Rozbicie ich na dwa kroki („rodzaj produktu" i „komu sprzedajesz") wyglądało
 * porządnie, ale rozrywało decyzję, którą człowiek podejmuje naraz — i tak
 * było w designie. Podpisy grup zostają jako drobne etykiety, więc podział
 * dalej jest czytelny bez dodatkowego kliknięcia.
 */
export function CategoryPicker({
  selected,
  onToggle,
  /** Ile podpunktow dokłada dana kategoria — liczone z treści etapu. */
  counts,
}: {
  selected: Set<string>;
  onToggle: (key: string) => void;
  counts?: Record<string, number>;
}) {
  const groups = [
    { label: "Rodzaj produktu", items: SELECTABLE_CATEGORIES.filter((c) => c.group === "product") },
    { label: "Komu sprzedajesz", items: SELECTABLE_CATEGORIES.filter((c) => c.group === "customer") },
  ];

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {groups.map((group) => (
        <section key={group.label}>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-subtle)]">
            {group.label}
          </p>
          <div className="flex flex-col gap-2">
            {group.items.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => onToggle(option.key)}
                aria-pressed={selected.has(option.key)}
                className={cn(
                  "rounded-xl border px-4 py-3 text-left transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--vairo)]",
                  selected.has(option.key)
                    ? "border-[var(--vairo)] bg-[var(--vairo)]/8"
                    : "border-white/10 bg-[var(--surface)] hover:border-white/22 hover:bg-[var(--surface-2)]"
                )}
              >
                <span className="block text-[15px] font-semibold text-white">
                  {option.label}
                </span>
                <span className="mt-0.5 block text-[12.5px] leading-relaxed text-[var(--text-muted)]">
                  {option.description}
                </span>
                {counts?.[option.key] ? (
                  <span className="mt-1.5 block text-[12px] text-[var(--text-subtle)]">
                    + {counts[option.key]} podpunktów do uzupełnienia
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/**
 * Wybór branż: pełna lista widoczna od razu plus możliwość dopisania własnej.
 * Ten sam komponent w onboardingu i przy zakładaniu startupu — inaczej łatwo
 * o sytuację, w której w jednym miejscu da się dodać własną branżę, a w drugim nie.
 */
export function IndustryPicker({
  catalog,
  selected,
  query,
  onQueryChange,
  onToggle,
  onCreate,
  canCreate,
  disabled,
}: {
  catalog: IndustryTag[];
  selected: Set<string>;
  query: string;
  onQueryChange: (value: string) => void;
  onToggle: (id: string) => void;
  onCreate: () => void;
  canCreate: boolean;
  disabled?: boolean;
}) {
  const q = query.trim().toLowerCase();
  const visible = q
    ? catalog.filter((t) => t.label.toLowerCase().includes(q))
    : catalog
        .filter((t) => t.is_suggested || selected.has(t.id))
        .sort((a, b) => a.label.localeCompare(b.label, "pl"));

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {visible.map((tag) => (
          <Pill
            key={tag.id}
            selected={selected.has(tag.id)}
            disabled={disabled}
            onToggle={() => onToggle(tag.id)}
          >
            {tag.label}
          </Pill>
        ))}
        {visible.length === 0 ? (
          <p className="text-[13px] text-[var(--text-subtle)]">
            Nic nie pasuje — dodaj własną poniżej.
          </p>
        ) : null}
      </div>

      <div className="mt-5 border-t border-white/[0.06] pt-4">
        <p className="mb-2 text-[12.5px] text-[var(--text-subtle)]">
          Nie ma Twojej branży?
        </p>
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canCreate) {
                e.preventDefault();
                onCreate();
              }
            }}
            placeholder="Wpisz własną…"
            aria-label="Dodaj własną branżę"
            disabled={disabled}
          />
          <button
            type="button"
            onClick={onCreate}
            disabled={disabled || !canCreate}
            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-white/12 px-3.5 text-[13px] text-[var(--text-muted)] transition-colors hover:border-[var(--vairo)]/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="size-4" />
            Dodaj
          </button>
        </div>
      </div>
    </div>
  );
}
