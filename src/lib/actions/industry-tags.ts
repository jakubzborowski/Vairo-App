"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Tworzenie własnej branży. Wspólne dla onboardingu i zakładania startupu
 * spoza onboardingu — obie ścieżki pytają dokładnie o to samo.
 */
export async function createIndustryTag(label: string) {
  const trimmed = label.trim();
  if (trimmed.length < 1 || trimmed.length > 48) {
    return { error: "Branża musi mieć 1–48 znaków.", tag: null };
  }

  const slug = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9ąćęłńóśźż]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

  if (!slug) return { error: "Nieprawidłowa nazwa.", tag: null };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Musisz być zalogowany.", tag: null };

  const columns = "id, slug, label, is_suggested";

  // Ktoś mógł już dodać tę samą branżę — wtedy po prostu ją zwracamy.
  const { data: existing } = await supabase
    .from("industry_tags")
    .select(columns)
    .eq("slug", slug)
    .maybeSingle();

  if (existing) return { error: null, tag: existing };

  const { data, error } = await supabase
    .from("industry_tags")
    .insert({ slug, label: trimmed, is_suggested: false, created_by: user.id })
    .select(columns)
    .single();

  if (error) return { error: error.message, tag: null };
  return { error: null, tag: data };
}
