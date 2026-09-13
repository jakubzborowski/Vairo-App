"use client";

import { useMemo, useState, useTransition } from "react";
import {
  completeOnboardingTags,
  createCustomTag,
} from "@/app/onboarding/actions";
import { cn } from "@/lib/utils";
import type { Tag } from "@/types/profile";

type TagsStepFormProps = {
  suggested: Tag[];
  catalog: Tag[];
  initialSelectedIds?: string[];
};

export function TagsStepForm({
  suggested,
  catalog,
  initialSelectedIds = [],
}: TagsStepFormProps) {
  const [tags, setTags] = useState<Tag[]>(catalog);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialSelectedIds)
  );
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return tags
      .filter(
        (tag) =>
          tag.label.toLowerCase().includes(q) && !selected.has(tag.id)
      )
      .slice(0, 8);
  }, [query, tags, selected]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addTag = (tag: Tag) => {
    setTags((prev) =>
      prev.some((t) => t.id === tag.id) ? prev : [...prev, tag]
    );
    setSelected((prev) => new Set(prev).add(tag.id));
    setQuery("");
  };

  const onCreate = () => {
    const label = query.trim();
    if (!label) return;
    startTransition(async () => {
      const result = await createCustomTag(label);
      if (result.error || !result.tag) {
        setError(result.error ?? "Nie udało się dodać tagu.");
        return;
      }
      addTag(result.tag as Tag);
    });
  };

  return (
    <div className="text-center">
      <h1 className="font-heading text-[1.75rem] font-semibold tracking-tight text-white sm:text-[2.05rem]">
        What tags best describe your idea?
      </h1>
      <p className="mt-2 text-[14px] text-white/50">
        Doesn&apos;t need to be perfect. You&apos;ll hammer it into perfection later.
      </p>

      <form
        className="mx-auto mt-10 max-w-[640px] text-left"
        action={(formData) => {
          setError(null);
          startTransition(async () => {
            const result = await completeOnboardingTags(formData);
            if (result?.error) setError(result.error);
          });
        }}
      >
        <input
          type="hidden"
          name="tag_ids"
          value={[...selected].join(",")}
        />

        <p className="text-[14px] font-medium text-white/90">
          Define what areas you&apos;ll be working in:
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          {suggested.map((tag) => {
            const active = selected.has(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggle(tag.id)}
                className={cn(
                  "h-9 rounded-full border px-4 text-[13px] font-medium transition",
                  active
                    ? "border-vairo bg-vairo/20 text-white"
                    : "border-white/25 bg-transparent text-white/85 hover:border-white/45"
                )}
              >
                {tag.label}
              </button>
            );
          })}

          <div className="relative min-w-[140px] flex-1">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (suggestions[0]) addTag(suggestions[0]);
                  else onCreate();
                }
              }}
              placeholder="Search or add…"
              className="h-9 w-full rounded-full border border-white/20 bg-[#0c0d11] px-3.5 text-[13px] text-white outline-none placeholder:text-white/35 focus:border-vairo/70"
            />
            {suggestions.length > 0 && (
              <ul className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 overflow-hidden rounded-xl border border-white/12 bg-[#12131a] py-1 shadow-xl">
                {suggestions.map((tag) => (
                  <li key={tag.id}>
                    <button
                      type="button"
                      onClick={() => addTag(tag)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-white/85 hover:bg-white/[0.06]"
                    >
                      <span className="text-vairo">+</span>
                      {tag.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="button"
            onClick={onCreate}
            disabled={pending || query.trim().length < 1}
            className="inline-flex size-9 items-center justify-center rounded-full border border-white/25 text-lg text-white/80 transition hover:border-white/45 disabled:opacity-40"
            aria-label="Add tag"
          >
            +
          </button>
        </div>

        {[...selected].length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags
              .filter((t) => selected.has(t.id) && !suggested.some((s) => s.id === t.id))
              .map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggle(tag.id)}
                  className="h-8 rounded-full border border-vairo/60 bg-vairo/15 px-3 text-[12px] text-white"
                >
                  {tag.label} ×
                </button>
              ))}
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">
            {error}
          </p>
        )}

        <div className="mt-10 flex justify-center">
          <button
            type="submit"
            disabled={pending || selected.size < 1}
            className="btn-vairo inline-flex h-12 min-w-[160px] items-center justify-center rounded-full px-8 text-[15px] font-semibold text-white transition disabled:opacity-50"
          >
            {pending ? "Saving…" : "Done"}
          </button>
        </div>
      </form>
    </div>
  );
}
