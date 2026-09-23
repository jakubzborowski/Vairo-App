"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureOwnProfile } from "@/lib/profile";
import { ensureStartupStage } from "@/lib/stage";
import { setActiveStartupId } from "@/lib/active-team";
import {
  isStartupLimitError,
  VALIDATION_CATEGORIES,
  type ValidationCategory,
} from "@/types/startup";
import type { OnboardingPath } from "@/types/profile";

const DEFAULT_PROJECT_NAME = "Mój pierwszy projekt";

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

/** Krok 1 — wybór ścieżki. Różnicuje wyłącznie dalszy onboarding. */
export async function chooseOnboardingPath(path: OnboardingPath) {
  if (!["joiner", "founder_idea", "founder_no_idea"].includes(path)) {
    return { error: "Nieznana ścieżka." };
  }

  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("profiles")
    .update({ onboarding_path: path, onboarding_step: "name" })
    .eq("id", user.id);

  if (error) return { error: error.message };

  redirect("/onboarding/name");
}

/** Krok 2 — imię i nazwisko. Wspólne dla wszystkich ścieżek. */
export async function saveOnboardingName(formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (fullName.length < 2 || fullName.length > 120) {
    return { error: "Podaj imię i nazwisko (min. 2 znaki)." };
  }

  const { supabase, user } = await requireUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_path")
    .eq("id", user.id)
    .maybeSingle();

  const path = (profile?.onboarding_path ?? "joiner") as OnboardingPath;

  // Founder z pomysłem ma jeszcze dwa kroki. Pozostali kończą tutaj.
  const nextStep = path === "founder_idea" ? "idea" : "done";

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      email: user.email ?? null,
      onboarding_step: nextStep,
      onboarding_completed_at:
        nextStep === "done" ? new Date().toISOString() : null,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  if (path === "founder_idea") {
    redirect("/onboarding/idea");
  }

  // Founder bez pomysłu dostaje startup z roboczą nazwą — Ambition Stage
  // nada mu właściwą w punkcie „Nadaj projektowi roboczą nazwę".
  if (path === "founder_no_idea") {
    const result = await createStartupForUser(supabase, user.id, {
      name: DEFAULT_PROJECT_NAME,
      stageKey: "ambition",
    });
    if (result.error) return { error: result.error };
    redirect("/app/stage");
  }

  // Joiner nie ma startupu, więc jego jedynym wejściem jest Social — a tam
  // pusty profil znaczy „nikt mnie nie zaprosi". Prowadzimy go od razu przez
  // kreator profilu publicznego, zamiast zostawiać na pustym dashboardzie.
  redirect("/app/social/start");
}

/** Krok 3 (tylko founder z pomysłem) — opis pomysłu i nazwa. Tworzy startup. */
export async function saveOnboardingIdea(formData: FormData) {
  const idea = String(formData.get("idea_description") ?? "").trim();
  const name = String(formData.get("startup_name") ?? "").trim();

  if (idea.length < 10 || idea.length > 4000) {
    return { error: "Opisz pomysł — przynajmniej kilka zdań." };
  }
  if (name.length < 2 || name.length > 80) {
    return { error: "Nazwa projektu: 2–80 znaków." };
  }

  const { supabase, user } = await requireUser();

  // Startup powstaje już tutaj — krok kategorii tylko go uzupełnia.
  // Dzięki temu przerwany onboarding nie gubi opisu pomysłu.
  const existing = await findOwnStartup(supabase, user.id);

  if (existing) {
    const { error } = await supabase
      .from("startups")
      .update({ name, idea_description: idea })
      .eq("id", existing);
    if (error) return { error: error.message };
  } else {
    const result = await createStartupForUser(supabase, user.id, {
      name,
      idea,
      stageKey: "idea",
    });
    if (result.error) return { error: result.error };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ idea_description: idea, onboarding_step: "categories" })
    .eq("id", user.id);

  if (error) return { error: error.message };

  redirect("/onboarding/categories");
}

/** Krok 4 (tylko founder z pomysłem) — kategorie walidacyjne i tagi branżowe. */
export async function completeOnboardingWithStartup(formData: FormData) {
  const rawCategories = String(formData.get("categories") ?? "");
  const rawTags = String(formData.get("tag_ids") ?? "");

  const categories = rawCategories
    .split(",")
    .map((c) => c.trim())
    .filter((c): c is ValidationCategory =>
      (VALIDATION_CATEGORIES as readonly string[]).includes(c) && c !== "general"
    );

  const tagIds = rawTags.split(",").map((t) => t.trim()).filter(Boolean);

  const { supabase, user } = await requireUser();
  const startupId = await findOwnStartup(supabase, user.id);

  if (!startupId) {
    return { error: "Nie znaleziono projektu. Wróć krok wstecz." };
  }

  // Podmiana całego zestawu — user mógł wrócić i odznaczyć kategorię.
  await supabase
    .from("startup_categories")
    .delete()
    .eq("startup_id", startupId)
    .neq("category", "general");

  if (categories.length > 0) {
    const { error } = await supabase
      .from("startup_categories")
      .insert(categories.map((category) => ({ startup_id: startupId, category })));
    if (error) return { error: error.message };
  }

  await supabase.from("startup_tags").delete().eq("startup_id", startupId);
  if (tagIds.length > 0) {
    await supabase
      .from("startup_tags")
      .insert(tagIds.map((tag_id) => ({ startup_id: startupId, tag_id })));
  }

  await ensureStartupStage(supabase, startupId, "idea");

  const { error } = await supabase
    .from("profiles")
    .update({
      onboarding_step: "done",
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  redirect("/app/stage");
}

// ---------------------------------------------------------------------------

/** Startup założony przez tego usera — onboarding operuje na jednym. */
async function findOwnStartup(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("startups")
    .select("id")
    .eq("created_by", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

type CreateStartupInput = {
  name: string;
  idea?: string | null;
  categories?: ValidationCategory[];
  tagIds?: string[];
  stageKey: "ambition" | "idea";
};

/**
 * Zakłada startup, przypina kategorie i tagi, a na koniec otwiera etap.
 * Rolę Foundera i kategorię `general` dokłada trigger w bazie.
 */
async function createStartupForUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  input: CreateStartupInput
): Promise<{ error: string | null; startupId?: string }> {
  const { data: startup, error } = await supabase
    .from("startups")
    .insert({
      name: input.name,
      idea_description: input.idea ?? null,
      created_by: userId,
    })
    .select("id")
    .single();

  if (error) {
    if (isStartupLimitError(error.message)) {
      return { error: "Masz już 3 teamy — to maksimum na jedno konto." };
    }
    return { error: error.message };
  }

  const extraCategories = (input.categories ?? []).filter((c) => c !== "general");
  if (extraCategories.length > 0) {
    await supabase.from("startup_categories").insert(
      extraCategories.map((category) => ({ startup_id: startup.id, category }))
    );
  }

  if (input.tagIds && input.tagIds.length > 0) {
    await supabase.from("startup_tags").insert(
      input.tagIds.map((tag_id) => ({ startup_id: startup.id, tag_id }))
    );
  }

  await ensureStartupStage(supabase, startup.id, input.stageKey);
  await setActiveStartupId(startup.id);

  return { error: null, startupId: startup.id };
}
