import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadCategoryQuestionCounts } from "@/lib/stage";
import { getUserStartups } from "@/lib/startup";
import { CreateStartupForm } from "@/components/app/create-startup-form";
import type { IndustryTag } from "@/types/startup";

export const metadata = { title: "Nowy startup — Vairo" };
export const dynamic = "force-dynamic";

export default async function NewStartupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/register?next=/app/startups/new");
  }

  const [startups, { data: tags }] = await Promise.all([
    getUserStartups(supabase, user.id),
    supabase
      .from("industry_tags")
      .select("id, slug, label, is_suggested")
      .order("label", { ascending: true }),
  ]);

  // Wybor kategorii decyduje o liczbie pytan w Idea Stage — mowimy to wprost.
  const categoryCounts = await loadCategoryQuestionCounts(supabase, "idea");

  return (
    <div className="py-6">
      <CreateStartupForm
        categoryCounts={categoryCounts}
        tags={(tags ?? []) as IndustryTag[]}
        teamCount={startups.length}
      />
    </div>
  );
}
