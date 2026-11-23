"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AVATAR_MAX_BYTES, AVATAR_MAX_MB } from "@/types/profile";
import { translateDbError } from "@/lib/db-errors";
import { sessionExpired } from "@/lib/server-errors";
import { getT } from "@/i18n/server";

const LIMITS = {
  fullName: { min: 2, max: 120 },
  publicName: { min: 2, max: 80 },
  headline: { max: 120 },
  weeklyFocus: { max: 2000 },
  skillLabel: { min: 1, max: 48 },
} as const;

export type ProfileDraft = {
  fullName: string;
  /** Nazwa w Odkrywaj; pusta = imię i nazwisko z konta (migracja 033). */
  publicName: string;
  headline: string;
  weeklyFocus: string;
  isDiscoverable: boolean;
  skillIds: string[];
};

export type ActionResult = { error: string | null };

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/**
 * Jeden zapis dla całego formularza.
 *
 * Wcześniej strona profilu miała trzy przyciski robiące wariacje tego samego
 * („Continue" zapisywał skille, 💾 dane, ✓ jedno i drugie) — user nie miał jak
 * zgadnąć, który zapisze wszystko. Tutaj jest jedna akcja i jeden przycisk.
 */
export async function saveProfile(draft: ProfileDraft): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: await sessionExpired() };
  const t = await getT("settings");

  const fullName = draft.fullName.trim();
  const publicName = draft.publicName.trim().replace(/\s+/g, " ");
  const headline = draft.headline.trim();
  const weeklyFocus = draft.weeklyFocus.trim();

  if (
    fullName.length < LIMITS.fullName.min ||
    fullName.length > LIMITS.fullName.max
  ) {
    return { error: t("profile.errors.fullName", { min: LIMITS.fullName.min, max: LIMITS.fullName.max }) };
  }
  if (
    publicName &&
    (publicName.length < LIMITS.publicName.min || publicName.length > LIMITS.publicName.max)
  ) {
    return {
      error: t("profile.errors.publicName", { min: LIMITS.publicName.min, max: LIMITS.publicName.max }),
    };
  }
  if (headline.length > LIMITS.headline.max) {
    return { error: t("profile.errors.headline", { max: LIMITS.headline.max }) };
  }
  if (weeklyFocus.length > LIMITS.weeklyFocus.max) {
    return { error: t("profile.errors.weeklyFocus", { max: LIMITS.weeklyFocus.max }) };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      // Ta sama nazwa co na koncie to brak pseudonimu — karta idzie wtedy
      // za imieniem z konta, także po jego późniejszej zmianie.
      public_name: publicName && publicName !== fullName ? publicName : null,
      headline: headline || null,
      weekly_focus: weeklyFocus || null,
      is_discoverable: draft.isDiscoverable,
    })
    .eq("id", user.id);

  if (profileError) return { error: await translateDbError(profileError.message) };

  // Skille: podmiana całego zestawu. Przy kilkunastu pozycjach to tańsze
  // i prostsze niż wyliczanie różnicy.
  const unique = [...new Set(draft.skillIds.filter(Boolean))];

  const { error: deleteError } = await supabase
    .from("profile_skills")
    .delete()
    .eq("profile_id", user.id);

  if (deleteError) return { error: await translateDbError(deleteError.message) };

  if (unique.length > 0) {
    const { error: insertError } = await supabase
      .from("profile_skills")
      .insert(unique.map((skill_id) => ({ profile_id: user.id, skill_id })));

    if (insertError) return { error: await translateDbError(insertError.message) };
  }

  revalidatePath("/app/settings/profile");
  return { error: null };
}

export async function createCustomSkill(label: string) {
  const t = await getT("settings");
  const trimmed = label.trim();
  if (
    trimmed.length < LIMITS.skillLabel.min ||
    trimmed.length > LIMITS.skillLabel.max
  ) {
    return { error: t("profile.errors.skill", { max: LIMITS.skillLabel.max }), skill: null };
  }

  const slug = slugify(trimmed);
  if (!slug) return { error: t("profile.errors.invalidName"), skill: null };

  const { supabase, user } = await requireUser();
  if (!user) return { error: await sessionExpired(), skill: null };

  const columns = "id, slug, label, is_suggested, created_by, created_at";

  // Ktoś mógł już dodać ten sam skill — wtedy po prostu go zwracamy.
  const { data: existing } = await supabase
    .from("skills")
    .select(columns)
    .eq("slug", slug)
    .maybeSingle();

  if (existing) return { error: null, skill: existing };

  const { data, error } = await supabase
    .from("skills")
    .insert({ slug, label: trimmed, is_suggested: false, created_by: user.id })
    .select(columns)
    .single();

  if (error) return { error: await translateDbError(error.message), skill: null };
  return { error: null, skill: data };
}

export async function uploadAvatar(formData: FormData) {
  const { supabase, user } = await requireUser();
  if (!user) return { error: await sessionExpired(), avatarUrl: null };
  const t = await getT("settings");

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { error: t("profile.errors.pickPhoto"), avatarUrl: null };
  }
  // Zdjęcie profilowe jest w Social najważniejszym elementem karty, więc
  // nie zmuszamy nikogo do kompresowania fotki z telefonu.
  if (file.size > AVATAR_MAX_BYTES) {
    return {
      error: t("profile.errors.photoTooBig", { mb: AVATAR_MAX_MB }),
      avatarUrl: null,
    };
  }

  const allowed: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const ext = allowed[file.type];
  if (!ext) {
    return { error: t("profile.errors.photoFormat"), avatarUrl: null };
  }

  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { error: await translateDbError(uploadError.message), avatarUrl: null };

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  // Cache-buster: ścieżka jest stała, więc bez niego przeglądarka pokaże stare zdjęcie.
  const avatarUrl = `${data.publicUrl}?v=${Date.now()}`;

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);

  if (error) return { error: await translateDbError(error.message), avatarUrl: null };

  revalidatePath("/app/settings/profile");
  return { error: null, avatarUrl };
}
