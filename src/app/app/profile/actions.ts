"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
    return { supabase, user: null as null };
  }
  return { supabase, user };
}

export async function saveProfileDetails(formData: FormData) {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const headline = String(formData.get("headline") ?? "").trim();
  const weeklyFocus = String(formData.get("weekly_focus") ?? "").trim();
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (fullName && (fullName.length < 2 || fullName.length > 120)) {
    return { error: "Imię i nazwisko: 2–120 znaków." };
  }
  if (headline && headline.length > 120) {
    return { error: "Headline max 120 znaków." };
  }
  if (weeklyFocus && weeklyFocus.length > 2000) {
    return { error: "Weekly focus max 2000 znaków." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName || null,
      headline: headline || null,
      weekly_focus: weeklyFocus || null,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/app/profile");
  return { error: null };
}

export async function saveProfileSkills(skillIds: string[]) {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const unique = [...new Set(skillIds.filter(Boolean))];

  const { error: delError } = await supabase
    .from("profile_skills")
    .delete()
    .eq("profile_id", user.id);

  if (delError) return { error: delError.message };

  if (unique.length > 0) {
    const { error } = await supabase.from("profile_skills").insert(
      unique.map((skill_id) => ({
        profile_id: user.id,
        skill_id,
      }))
    );
    if (error) return { error: error.message };
  }

  revalidatePath("/app/profile");
  return { error: null };
}

export async function createCustomSkill(label: string) {
  const trimmed = label.trim();
  if (trimmed.length < 1 || trimmed.length > 48) {
    return { error: "Skill musi mieć 1–48 znaków.", skill: null };
  }

  const slug = slugify(trimmed);
  if (!slug) return { error: "Nieprawidłowa nazwa.", skill: null };

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Musisz być zalogowany.", skill: null };

  const { data: existing } = await supabase
    .from("skills")
    .select("id, slug, label, is_suggested, created_by, created_at")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) return { error: null, skill: existing };

  const { data, error } = await supabase
    .from("skills")
    .insert({
      slug,
      label: trimmed,
      is_suggested: false,
      created_by: user.id,
    })
    .select("id, slug, label, is_suggested, created_by, created_at")
    .single();

  if (error) return { error: error.message, skill: null };
  return { error: null, skill: data };
}

export async function uploadAvatar(formData: FormData) {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Musisz być zalogowany.", avatarUrl: null };

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Wybierz zdjęcie.", avatarUrl: null };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { error: "Max 5 MB.", avatarUrl: null };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { error: uploadError.message, avatarUrl: null };

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const avatarUrl = `${data.publicUrl}?t=${Date.now()}`;

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);

  if (error) return { error: error.message, avatarUrl: null };

  revalidatePath("/app/profile");
  return { error: null, avatarUrl };
}

export async function createTeam(formData: FormData) {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (name.length < 2 || name.length > 80) {
    return { error: "Nazwa teamu: 2–80 znaków." };
  }

  const { data, error } = await supabase
    .from("teams")
    .insert({
      name,
      description: description || null,
      owner_id: user.id,
    })
    .select("id, name, description, owner_id, created_at, updated_at")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/app/profile");
  return { error: null, team: data };
}
