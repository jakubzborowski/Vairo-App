"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureOwnProfile } from "@/lib/profile";

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

  if (!user) {
    redirect("/login?next=/onboarding");
  }

  await ensureOwnProfile(supabase, user);
  return { supabase, user };
}

export async function saveOnboardingName(formData: FormData) {
  const raw = String(formData.get("full_name") ?? "").trim();
  if (raw.length < 2 || raw.length > 120) {
    return { error: "Podaj imię i nazwisko (min. 2 znaki)." };
  }

  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: raw,
      onboarding_step: "idea",
      email: user.email ?? null,
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  redirect("/onboarding/idea");
}

export async function saveOnboardingIdea(formData: FormData) {
  const raw = String(formData.get("idea_description") ?? "").trim();
  if (raw.length < 3 || raw.length > 2000) {
    return { error: "Opisz pomysł (min. 3 znaki)." };
  }

  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("profiles")
    .update({
      idea_description: raw,
      onboarding_step: "tags",
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  redirect("/onboarding/tags");
}

export async function completeOnboardingTags(formData: FormData) {
  const rawTags = String(formData.get("tag_ids") ?? "");
  const tagIds = rawTags
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (tagIds.length < 1) {
    return { error: "Wybierz przynajmniej jeden tag." };
  }

  const { supabase, user } = await requireUser();

  await supabase.from("profile_tags").delete().eq("profile_id", user.id);

  const { error: linkError } = await supabase.from("profile_tags").insert(
    tagIds.map((tag_id) => ({
      profile_id: user.id,
      tag_id,
    }))
  );

  if (linkError) {
    return { error: linkError.message };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      onboarding_step: "done",
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  redirect("/app");
}

export async function createCustomTag(label: string) {
  const trimmed = label.trim();
  if (trimmed.length < 1 || trimmed.length > 48) {
    return { error: "Tag musi mieć 1–48 znaków.", tag: null };
  }

  const slug = slugify(trimmed);
  if (!slug) {
    return { error: "Nieprawidłowa nazwa tagu.", tag: null };
  }

  const { supabase, user } = await requireUser();

  const { data: existing } = await supabase
    .from("tags")
    .select("id, slug, label, is_suggested, created_by, created_at")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    return { error: null, tag: existing };
  }

  const { data, error } = await supabase
    .from("tags")
    .insert({
      slug,
      label: trimmed,
      is_suggested: false,
      created_by: user.id,
    })
    .select("id, slug, label, is_suggested, created_by, created_at")
    .single();

  if (error) {
    return { error: error.message, tag: null };
  }

  return { error: null, tag: data };
}
