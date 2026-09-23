import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadCategoryQuestionCounts } from "@/lib/stage";
import { getUserStartups, resolveActiveStartup } from "@/lib/startup";
import { getActiveStartupId } from "@/lib/active-team";
import { CategoriesStepForm } from "@/components/onboarding/categories-step-form";
import { chooseCategoriesAfterAmbition } from "@/app/app/stage/actions";
import type { IndustryTag } from "@/types/startup";

export const metadata = { title: "Czym to będzie? — Vairo" };
export const dynamic = "force-dynamic";

/**
 * Wybór kategorii po Ambition Stage.
 *
 * Na starcie Ambition człowiek nie wie jeszcze, czy buduje SaaS, czy
 * urządzenie — dowiaduje się tego dopiero, wypełniając etap. Dlatego pytamy
 * o to tutaj, w drodze do Idea Stage.
 */
export default async function StageCategoriesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/register?next=/app/stage/categories");
  }

  const [startups, activeTeamId] = await Promise.all([
    getUserStartups(supabase, user.id),
    getActiveStartupId(),
  ]);
  const active = resolveActiveStartup(startups, activeTeamId);

  if (!active) {
    redirect("/app");
  }

  const [{ data: tags }, { data: currentTags }] = await Promise.all([
    supabase
      .from("industry_tags")
      .select("id, slug, label, is_suggested")
      .order("label", { ascending: true }),
    supabase.from("startup_tags").select("tag_id").eq("startup_id", active.id),
  ]);

  // Wybor kategorii decyduje o liczbie pytan w Idea Stage — mowimy to wprost.
  const categoryCounts = await loadCategoryQuestionCounts(supabase, "idea");

  return (
    <div className="py-6">
      <div className="mx-auto mb-8 max-w-[560px] rounded-2xl border border-[var(--vairo)]/25 bg-[var(--vairo)]/6 px-5 py-4">
        <p className="text-[13px] font-semibold text-[var(--vairo)]">
          Masz pierwszy zarys projektu
        </p>
        <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--text-muted)]">
          Teraz wiesz o swoim pomyśle więcej niż na starcie. Odpowiedz na trzy
          pytania, a Vairo dobierze do nich pytania w Idea Stage.
        </p>
      </div>

      <CategoriesStepForm
        categoryCounts={categoryCounts}
        tags={(tags ?? []) as IndustryTag[]}
        action={chooseCategoriesAfterAmbition}
        submitLabel="Przechodzę do Idea Stage"
        startupId={active.id}
        initialCategories={active.categories.filter((c) => c !== "general")}
        initialTagIds={(currentTags ?? []).map((t) => t.tag_id)}
      />
    </div>
  );
}
