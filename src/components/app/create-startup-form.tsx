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
import { useT } from "@/i18n/client";

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
  const t = useT("startups");
  const to = useT("onboarding");
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
    !catalog.some((tag) => tag.label.toLowerCase() === query.trim().toLowerCase());

  const onCreateTag = () => {
    const label = query.trim();
    if (!label) return;
    startTransition(async () => {
      const result = await createIndustryTag(label);
      if (result.error || !result.tag) {
        setError(result.error ?? to("categories.tagFailed"));
        return;
      }
      const tag = result.tag as IndustryTag;
      setCatalog((prev) => (prev.some((item) => item.id === tag.id) ? prev : [...prev, tag]));
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
    formData.set("categories", hasIdea ? [...categories].join(",") : "");
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
          {t("limitTitle", { count: MAX_STARTUPS })}
        </p>
        <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-[var(--text-muted)]">
          {t("limitBody")}
        </p>
        <Button href="/app" variant="secondary" className="mt-6">
          {t("backToDashboard")}
        </Button>
      </div>
    );
  }

  const steps: WizardStep[] = [
    {
      key: "name",
      title: t("name.title"),
      description: t("name.description"),
      canContinue: name.trim().length >= 2,
      render: () => (
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          placeholder={to("idea.namePlaceholder")}
          autoFocus
          className="h-14 text-[16px]"
          aria-label={to("idea.nameLabel")}
        />
      ),
    },
    {
      key: "has-idea",
      title: t("hasIdea.title"),
      description: t("hasIdea.description"),
      canContinue: hasIdea !== null,
      render: () => (
        <div className="grid gap-3">
          <ChoiceTile
            icon={Rocket}
            title={t("hasIdea.yes")}
            description={t("hasIdea.yesDescription")}
            selected={hasIdea === true}
            onSelect={() => setHasIdea(true)}
          />
          <ChoiceTile
            icon={Lightbulb}
            title={t("hasIdea.no")}
            description={t("hasIdea.noDescription")}
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
            title: t("idea.title"),
            description: to("idea.ideaHint"),
            help: t("idea.help"),
            canContinue: idea.trim().length >= 10,
            render: () => (
              <Textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                rows={7}
                maxLength={4000}
                placeholder={to("idea.ideaPlaceholder")}
                autoFocus
                aria-label={to("idea.ideaLabel")}
              />
            ),
          } satisfies WizardStep,
        ]
      : []),
    // Bez pomysłu kategorie wybiera się dopiero po Ambition
    // (`chooseCategoriesAfterAmbition`) — wtedy wiadomo już, co powstaje.
    // Pytanie tutaj było podwójne i zadawane przed jakąkolwiek wiedzą.
    ...(hasIdea
      ? [
          {
            key: "categories",
            title: to("categories.title"),
            description: to("categories.description"),
            help: t("categoriesHelp"),
            optional: true,
            render: () => (
              <CategoryPicker
                counts={categoryCounts}
                selected={categories}
                onToggle={(key) => toggle(categories, setCategories, key)}
              />
            ),
          } satisfies WizardStep,
        ]
      : []),
    {
      key: "tags",
      title: to("categories.tagsTitle"),
      description: t("tagsDescription"),
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
      finishLabel={hasIdea ? t("finishWithIdea") : t("finishWithoutIdea")}
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
