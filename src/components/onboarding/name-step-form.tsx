"use client";

import { useState, useTransition } from "react";
import { saveOnboardingName } from "@/app/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import type { OnboardingPath } from "@/types/profile";

const SUBTITLE: Record<OnboardingPath, string> = {
  joiner: "Pod tym imieniem zobaczą Cię teamy szukające ludzi.",
  founder_idea: "Pod tym imieniem zobaczą Cię ludzie, których zaprosisz do teamu.",
  founder_no_idea: "Pod tym imieniem zobaczą Cię ludzie, których zaprosisz do teamu.",
};

export function NameStepForm({
  initialName,
  path,
}: {
  initialName?: string | null;
  path: OnboardingPath;
}) {
  const [name, setName] = useState(initialName ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="text-center">
      <h1 className="font-heading text-[1.85rem] font-semibold tracking-tight text-white sm:text-[2.1rem]">
        Jak masz na imię?
      </h1>
      <p className="mt-2.5 text-[15px] text-[var(--text-subtle)]">
        {SUBTITLE[path]}
      </p>

      <form
        className="mx-auto mt-9 max-w-[420px] text-left"
        action={(formData) => {
          setError(null);
          startTransition(async () => {
            const result = await saveOnboardingName(formData);
            if (result?.error) setError(result.error);
          });
        }}
      >
        <Field label="Imię i nazwisko" error={error}>
          {({ id }) => (
            <Input
              id={id}
              name="full_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="np. Anna Kowalska"
              autoComplete="name"
              autoFocus
              maxLength={120}
            />
          )}
        </Field>

        <Button
          type="submit"
          size="lg"
          block
          loading={pending}
          disabled={name.trim().length < 2}
          className="mt-6"
        >
          Dalej
        </Button>
      </form>
    </div>
  );
}
