"use client";

import { useState, useTransition } from "react";
import { saveOnboardingIdea } from "@/app/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { useT } from "@/i18n/client";

const IDEA_MAX = 4000;

export function IdeaStepForm({
  initialIdea,
  initialName,
}: {
  initialIdea?: string | null;
  initialName?: string | null;
}) {
  const t = useT("onboarding");
  const tc = useT("common");
  const [idea, setIdea] = useState(initialIdea ?? "");
  const [name, setName] = useState(initialName ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const ready = idea.trim().length >= 10 && name.trim().length >= 2;

  return (
    <div>
      <div className="text-center">
        <h1 className="font-heading text-[1.85rem] font-semibold tracking-tight text-white sm:text-[2.1rem]">
          {t("idea.title")}
        </h1>
        <p className="mt-2.5 text-[15px] text-[var(--text-subtle)]">
          {t("idea.subtitle")}
        </p>
      </div>

      <form
        className="mx-auto mt-9 max-w-[520px]"
        action={(formData) => {
          setError(null);
          startTransition(async () => {
            const result = await saveOnboardingIdea(formData);
            if (result?.error) setError(result.error);
          });
        }}
      >
        <div className="flex flex-col gap-5">
          <Field
            label={t("idea.ideaLabel")}
            hint={t("idea.ideaHint")}
            counter={{ value: idea.length, max: IDEA_MAX }}
          >
            {({ id }) => (
              <Textarea
                id={id}
                name="idea_description"
                rows={6}
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                maxLength={IDEA_MAX}
                placeholder={t("idea.ideaPlaceholder")}
                autoFocus
              />
            )}
          </Field>

          <Field
            label={t("idea.nameLabel")}
            hint={t("idea.nameHint")}
          >
            {({ id }) => (
              <Input
                id={id}
                name="startup_name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                placeholder={t("idea.namePlaceholder")}
              />
            )}
          </Field>
        </div>

        {error ? (
          <p className="mt-4 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-[13px] text-[var(--danger)]">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          block
          loading={pending}
          disabled={!ready}
          className="mt-6"
        >
          {tc("actions.next")}
        </Button>
      </form>
    </div>
  );
}
