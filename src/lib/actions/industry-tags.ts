"use server";

import { createClient } from "@/lib/supabase/server";
import { translateDbError } from "@/lib/db-errors";
import { sessionExpired } from "@/lib/server-errors";
import { getT } from "@/i18n/server";

/**
 * Tworzenie własnej branży. Wspólne dla onboardingu i zakładania startupu
 * spoza onboardingu — obie ścieżki pytają dokładnie o to samo.
 */
export async function createIndustryTag(label: string) {
  const t = await getT("onboarding");
  const trimmed = label.trim();
  if (trimmed.length < 1 || trimmed.length > 48) {
    return { error: t("errors.tagLength"), tag: null };
  }

  const slug = trimmed
    .toLowerCase()
    // Litery dowolnego alfabetu (cyrylica, ñ, ß) zostają — inaczej branża
    // wpisana po ukraińsku dostałaby pusty slug i nie dałoby się jej dodać.
    .replace(new RegExp("[^\\p{L}\\p{N}]+", "gu"), "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

  if (!slug) return { error: t("errors.tagInvalid"), tag: null };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: await sessionExpired(), tag: null };

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

  if (error) return { error: await translateDbError(error.message), tag: null };
  return { error: null, tag: data };
}
