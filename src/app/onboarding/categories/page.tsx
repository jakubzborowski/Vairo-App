import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadCategoryQuestionCounts } from "@/lib/stage";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { CategoriesStepForm } from "@/components/onboarding/categories-step-form";
import { ensureOwnProfile } from "@/lib/profile";
import type { IndustryTag } from "@/types/startup";

export const metadata = { title: "Czym to będzie? — Vairo" };
export const dynamic = "force-dynamic";

export default async function OnboardingCategoriesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/onboarding/categories");
  }

  await ensureOwnProfile(supabase, user);

  const { data: profile } = await supabase
    .from("profiles")
    .select("idea_description, onboarding_path, onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.onboarding_completed_at) {
    redirect("/app");
  }
  if (!profile?.idea_description) {
    redirect("/onboarding/idea");
  }

  const { data: tags } = await supabase
    .from("industry_tags")
    .select("id, slug, label, is_suggested")
    .order("label", { ascending: true });

  // Wybor kategorii decyduje o liczbie pytan w Idea Stage — mowimy to wprost.
  const categoryCounts = await loadCategoryQuestionCounts(supabase, "idea");

  return (
    <OnboardingShell>
      <CategoriesStepForm
        categoryCounts={categoryCounts}
        tags={(tags ?? []) as IndustryTag[]}
        stepOffset={3}
        overallTotal={5}
      />
    </OnboardingShell>
  );
}
