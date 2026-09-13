"use client";

import { useState, useTransition } from "react";
import { saveOnboardingIdea } from "@/app/onboarding/actions";
import { cn } from "@/lib/utils";

type IdeaStepFormProps = {
  initialIdea?: string | null;
};

export function IdeaStepForm({ initialIdea }: IdeaStepFormProps) {
  const [idea, setIdea] = useState(initialIdea ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="text-center">
      <h1 className="font-heading text-[1.85rem] font-semibold tracking-tight text-white sm:text-[2.15rem]">
        It all starts with an idea...
      </h1>
      <p className="mt-2 text-[14px] text-white/50">
        Doesn&apos;t need to be perfect. You&apos;ll hammer it into perfection later.
      </p>

      <form
        className="mx-auto mt-10 max-w-[520px]"
        action={(formData) => {
          setError(null);
          startTransition(async () => {
            const result = await saveOnboardingIdea(formData);
            if (result?.error) setError(result.error);
          });
        }}
      >
        <div
          className={cn(
            "rounded-2xl border bg-[#0c0d11]/80 p-4 text-left sm:p-5",
            "border-vairo/55"
          )}
        >
          <label className="block text-[13px] font-medium text-white/85">
            What do you want to build?
            <textarea
              name="idea_description"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Something amazing..."
              required
              minLength={3}
              maxLength={2000}
              rows={5}
              className="mt-3 w-full resize-none bg-transparent text-[15px] text-white outline-none placeholder:text-white/35"
            />
          </label>

          <div className="mt-4 flex justify-center">
            <button
              type="submit"
              disabled={pending || idea.trim().length < 3}
              className="btn-vairo inline-flex h-11 min-w-[180px] items-center justify-center rounded-full px-6 text-[14px] font-semibold text-white transition disabled:opacity-50"
            >
              {pending ? "Saving…" : "Let's get started!"}
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
