"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureStartupStage } from "@/lib/stage";
import { setActiveStartupId } from "@/lib/active-team";
import {
  isStartupLimitError,
  MAX_STARTUPS,
  VALIDATION_CATEGORIES,
  type ValidationCategory,
} from "@/types/startup";

/**
 * Tworzy startup poza onboardingiem — dla Joinera, który zmienił zdanie,
 * albo dla drugiego i trzeciego projektu.
 */
export async function createStartup(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Musisz być zalogowany." };

  const name = String(formData.get("startup_name") ?? "").trim();
  const idea = String(formData.get("idea_description") ?? "").trim();

  if (name.length < 2 || name.length > 80) {
    return { error: "Nazwa projektu: 2–80 znaków." };
  }
  if (idea.length > 0 && idea.length < 10) {
    return { error: "Opis pomysłu: przynajmniej kilka zdań albo zostaw pusty." };
  }

  const categories = String(formData.get("categories") ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter((c): c is ValidationCategory =>
      (VALIDATION_CATEGORIES as readonly string[]).includes(c) && c !== "general"
    );

  const tagIds = String(formData.get("tag_ids") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const { data: startup, error } = await supabase
    .from("startups")
    .insert({
      name,
      idea_description: idea || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    if (isStartupLimitError(error.message)) {
      return {
        error: `Masz już ${MAX_STARTUPS} teamy — to maksimum na jedno konto. Opuść któryś, żeby założyć nowy.`,
      };
    }
    return { error: error.message };
  }

  if (categories.length > 0) {
    await supabase
      .from("startup_categories")
      .insert(categories.map((category) => ({ startup_id: startup.id, category })));
  }

  if (tagIds.length > 0) {
    await supabase
      .from("startup_tags")
      .insert(tagIds.map((tag_id) => ({ startup_id: startup.id, tag_id })));
  }

  // Bez opisu pomysłu zaczynamy od Ambition Stage, z opisem — od razu od Idea.
  await ensureStartupStage(supabase, startup.id, idea ? "idea" : "ambition");

  // Świeżo założony team staje się aktywny — inaczej user wylądowałby
  // w poprzednim workspace i nie zrozumiał, co się stało.
  await setActiveStartupId(startup.id);

  revalidatePath("/app", "layout");
  redirect("/app/stage");
}
