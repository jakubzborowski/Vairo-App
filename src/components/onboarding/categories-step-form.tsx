"use client";

import { useState, useTransition } from "react";
import { completeOnboardingWithStartup } from "@/app/onboarding/actions";
import { createIndustryTag } from "@/lib/actions/industry-tags";
import { CategoryPicker, IndustryPicker } from "@/components/stage/category-picker";
import { StepWizard, type WizardStep } from "@/components/ui/step-wizard";
import type { IndustryTag } from "@/types/startup";

type CategoriesStepFormProps = {
  tags: IndustryTag[];
  /** Akcja zapisu — inna w onboardingu, inna po Ambition Stage. */
  action?: (formData: FormData) => Promise<{ error: string | null } | void>;
  submitLabel?: string;
  /** Kontekst teamu — potrzebny poza onboardingiem. */
  startupId?: string;
  initialCategories?: string[];
  initialTagIds?: string[];
  onExit?: () => void;
  stepOffset?: number;
  overallTotal?: number;
  /** Ile podpunktow dokłada kazda kategoria — liczone z treści Idea Stage. */
  categoryCounts?: Record<string, number>;
};

/**
 * Dwa kroki: kategorie walidacyjne i branża.
 *
 * Kategorie są na jednym ekranie, wszystkie cztery obok siebie — to jedna
 * decyzja, nie dwie, i tak było w designie. Branża osobno, bo to zupełnie
 * inna rzecz: kategorie decydują, o co Vairo zapyta, branża tylko o to,
 * czy ktoś Was znajdzie.
 */
export function CategoriesStepForm({
  tags,
  action,
  submitLabel = "Zaczynam walidację",
  startupId,
  initialCategories = [],
  initialTagIds = [],
  onExit,
  stepOffset,
  overallTotal,
  categoryCounts,
}: CategoriesStepFormProps) {
  const [categories, setCategories] = useState<Set<string>>(
    () => new Set(initialCategories.filter((c) => c !== "general"))
  );
  const [catalog, setCatalog] = useState(tags);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(
    () => new Set(initialTagIds)
  );
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const canCreateTag =
    query.trim().length > 0 &&
    !catalog.some((t) => t.label.toLowerCase() === query.trim().toLowerCase());

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, key: string) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setter(next);
  };

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

  const onFinish = () => {
    setError(null);
    const formData = new FormData();
    formData.set("categories", [...categories].join(","));
    formData.set("tag_ids", [...selectedTags].join(","));
    if (startupId) formData.set("startup_id", startupId);

    startTransition(async () => {
      const result = await (action ?? completeOnboardingWithStartup)(formData);
      if (result && "error" in result && result.error) setError(result.error);
    });
  };

  const steps: WizardStep[] = [
    {
      key: "categories",
      title: "Co budujesz i komu to sprzedajesz?",
      description: "Zaznacz wszystko, co pasuje. Możesz też nie zaznaczać nic.",
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
      description:
        "Zaznacz wszystkie, które pasują. Dzięki temu inni znajdą Was w Social — nie zmienia to pytań w walidacji.",
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
      finishLabel={submitLabel}
      onFinish={onFinish}
      finishing={pending}
      error={error}
      onExit={onExit}
      stepOffset={stepOffset}
      overallTotal={overallTotal}
    />
  );
}
