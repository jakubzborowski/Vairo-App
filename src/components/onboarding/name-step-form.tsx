"use client";

import { useState, useTransition } from "react";
import { saveOnboardingName } from "@/app/onboarding/actions";
import { cn } from "@/lib/utils";

type NameStepFormProps = {
  initialName?: string | null;
};

export function NameStepForm({ initialName }: NameStepFormProps) {
  const [fullName, setFullName] = useState(initialName ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="text-center">
      <h1 className="font-heading text-[1.85rem] font-semibold tracking-tight text-white sm:text-[2.15rem]">
        First, tell us your name:
      </h1>
      <p className="mt-2 text-[14px] text-white/50">Your most important brand.</p>

      <form
        className="mx-auto mt-10 max-w-[420px] text-left"
        action={(formData) => {
          setError(null);
          startTransition(async () => {
            const result = await saveOnboardingName(formData);
            if (result?.error) setError(result.error);
          });
        }}
      >
        <label className="block text-[13px] font-medium text-white/85">
          Name and Surname
          <input
            name="full_name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jay Jayson..."
            autoComplete="name"
            required
            minLength={2}
            maxLength={120}
            className={cn(
              "mt-2 h-12 w-full rounded-full border bg-[#0c0d11] px-5 text-[15px] text-white outline-none transition placeholder:italic placeholder:text-white/35",
              "border-vairo/70 focus:border-vairo focus:ring-2 focus:ring-vairo/25"
            )}
          />
        </label>
        <p className="mt-2.5 text-[11px] italic leading-relaxed text-white/40">
          *Use your real name and surname. People with nicknames aren&apos;t as
          trustworthy in professional spaces.
        </p>

        {error && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || fullName.trim().length < 2}
          className="btn-vairo mt-8 inline-flex h-11 w-full items-center justify-center rounded-full text-[14px] font-semibold text-white transition disabled:opacity-50"
        >
          {pending ? "Saving…" : "Continue"}
        </button>
      </form>
    </div>
  );
}
