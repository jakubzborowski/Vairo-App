"use client";

import { useState, useTransition } from "react";
import { Lightbulb, Rocket } from "lucide-react";
import { createStartup } from "@/app/app/startups/new/actions";
import { createIndustryTag } from "@/lib/actions/industry-tags";
import { CategoryPicker, IndustryPicker } from "@/components/stage/category-picker";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { StepWizard, type WizardStep } from "@/components/ui/step-wizard";
import { cn } from "@/lib/utils";
import { MAX_STARTUPS } from "@/types/startup";
import type { IndustryTag } from "@/types/startup";

type Props = {
  tags: IndustryTag[];
  teamCount: number;
  /** Ile podpunktow dokłada kazda kategoria — liczone z treści Idea Stage. */
  categoryCounts?: Record<string, number>;
};

/**
 * Zakładanie startupu jako kreator — jedno pytanie na ekran.
 *
 * Wcześniej był to jeden formularz z nazwą, opisem, czterema kategoriami
 * i listą tagów naraz. Dla kogoś, kto pierwszy raz słyszy o walidacji pomysłu,
 * taki ekran jest ścianą. Pięć spokojnych kroków przechodzi się bez wysiłku.
 */
export function CreateStartupForm({ tags, teamCount, categoryCounts }: Props) {
  const [name, setName] = useState("");
  const [hasIdea, setHasIdea] = useState<boolean | null>(null);
  const [idea, setIdea] = useState("");
  const [categories, setCategories] = useState<Set<string>>(new Set());
  const [catalog, setCatalog] = useState(tags);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const canCreateTag =
    query.trim().length > 0 &&
    !catalog.some((t) => t.label.toLowerCase() === query.trim().toLowerCase());

  const onCreateTag = () => {
    const label = query.trim();
    if (!label) return;
    startTransition(async () => {
      const result = await createIndustryTag(label);
      if (result.error || !result.tag) {
        setError(result.error ?? "Nie udało się dodać branży.");
        return;
      }
      const tag = result.tag as IndustryTag;
      setCatalog((prev) => (prev.some((t) => t.id === tag.id) ? prev : [...prev, tag]));
      setSelectedTags((prev) => new Set(prev).add(tag.id));
      setQuery("");
      setError(null);
    });
  };

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, key: string) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setter(next);
  };

  const onFinish = () => {
    setError(null);
    const formData = new FormData();
    formData.set("startup_name", name);
    formData.set("idea_description", hasIdea ? idea : "");
    formData.set("categories", [...categories].join(","));
    formData.set("tag_ids", [...selectedTags].join(","));

    startTransition(async () => {
      const result = await createStartup(formData);
      if (result?.error) setError(result.error);
    });
  };

  if (teamCount >= MAX_STARTUPS) {
    return (
      <div className="mx-auto max-w-[520px] rounded-2xl border border-white/10 bg-[var(--surface)] p-7 text-center">
        <p className="font-heading text-[18px] font-semibold text-white">
          Masz już {MAX_STARTUPS} teamy
        </p>
        <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-[var(--text-muted)]">
          To maksimum na jedno konto. Żeby założyć kolejny projekt, opuść jeden
          z obecnych albo przekaż w nim rolę Foundera komuś innemu.
        </p>
        <Button href="/app" variant="secondary" className="mt-6">
          Wróć na dashboard
        </Button>
      </div>
    );
  }

  const steps: WizardStep[] = [
    {
      key: "name",
      title: "Jak nazwiemy Twój projekt?",
      description: "Robocza nazwa w zupełności wystarczy — zmienisz ją w każdej chwili.",
      canContinue: name.trim().length >= 2,
      render: () => (
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          placeholder="np. Ostatnia Kanapka"
          autoFocus
          className="h-14 text-[16px]"
          aria-label="Nazwa projektu"
        />
      ),
    },
    {
      key: "has-idea",
      title: "Wiesz już, co chcesz zbudować?",
      description: "Od tej odpowiedzi zależy, od czego zaczniemy.",
      canContinue: hasIdea !== null,
      render: () => (
        <div className="grid gap-3">
          <ChoiceTile
            icon={Rocket}
            title="Tak, mam pomysł"
            description="Opiszesz go teraz i przejdziemy od razu do sprawdzania, czy ma sens."
            selected={hasIdea === true}
            onSelect={() => setHasIdea(true)}
          />
          <ChoiceTile
            icon={Lightbulb}
            title="Jeszcze nie wiem"
            description="Przeprowadzimy Cię przez kilkanaście minut pytań, po których będziesz mieć pierwszy zarys."
            selected={hasIdea === false}
            onSelect={() => setHasIdea(false)}
          />
        </div>
      ),
    },
    ...(hasIdea
      ? [
          {
            key: "idea",
            title: "Opowiedz, o co chodzi",
            description: "Jaki problem rozwiązujesz i komu pomagasz? Kilka zdań wystarczy.",
            help: "Nie musi być idealne. W kolejnych krokach Vairo pomoże Ci to doprecyzować.",
            canContinue: idea.trim().length >= 10,
            render: () => (
              <Textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                rows={7}
                maxLength={4000}
                placeholder="Chcę pomóc… bo dzisiaj muszą…"
                autoFocus
                aria-label="Opis pomysłu"
              />
            ),
          } satisfies WizardStep,
        ]
      : []),
    {
      key: "categories",
      title: "Co budujesz i komu to sprzedajesz?",
      description: "Zaznacz wszystko, co pasuje. Możesz też nie zaznaczać nic.",
      help: "Od tego zależy, o co Vairo będzie pytać podczas walidacji. Ogólna walidacja jest zawsze włączona — reszta tylko ją uzupełnia.",
      optional: true,
      render: () => (
        <CategoryPicker
          counts={categoryCounts}
          selected={categories}
          onToggle={(key) => toggle(categories, setCategories, key)}
        />
      ),
    },
    {
      key: "tags",
      title: "W jakiej branży to działa?",
      description: "Zaznacz wszystkie, które pasują. Dzięki temu inni znajdą Was w Social.",
      optional: true,
      render: () => (
        <IndustryPicker
          catalog={catalog}
          selected={selectedTags}
          query={query}
          onQueryChange={setQuery}
          onToggle={(id) => toggle(selectedTags, setSelectedTags, id)}
          onCreate={onCreateTag}
          canCreate={canCreateTag}
          disabled={pending}
        />
      ),
    },
  ];

  return (
    <StepWizard
      steps={steps}
      finishLabel={hasIdea ? "Stwórz i zacznij walidację" : "Stwórz i zacznij od zera"}
      onFinish={onFinish}
      finishing={pending}
      error={error}
      onExit={() => window.history.back()}
    />
  );
}

function ChoiceTile({
  icon: Icon,
  title,
  description,
  selected,
  onSelect,
}: {
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex items-start gap-4 rounded-2xl border p-5 text-left transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--vairo)]",
        selected
          ? "border-[var(--vairo)] bg-[var(--vairo)]/8"
          : "border-white/10 bg-[var(--surface)] hover:border-white/22 hover:bg-[var(--surface-2)]"
      )}
    >
      {Icon ? (
        <span
          className={cn(
            "inline-flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
            selected
              ? "bg-[var(--vairo)] text-white"
              : "bg-[var(--surface-2)] text-[var(--text-subtle)]"
          )}
        >
          <Icon className="size-5" strokeWidth={1.75} />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-semibold text-white">{title}</span>
        <span className="mt-1 block text-[13.5px] leading-relaxed text-[var(--text-muted)]">
          {description}
        </span>
      </span>
    </button>
  );
}
