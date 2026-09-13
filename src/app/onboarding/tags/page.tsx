import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { TagsStepForm } from "@/components/onboarding/tags-step-form";
import { ensureOwnProfile } from "@/lib/profile";
import type { Tag } from "@/types/profile";

export const metadata = {
  title: "Tags — Vairo",
};

export const dynamic = "force-dynamic";

export default async function OnboardingTagsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/onboarding/tags");
  }

  await ensureOwnProfile(supabase, user);

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, idea_description, onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.onboarding_completed_at) {
    redirect("/app");
  }

  if (!profile?.full_name) {
    redirect("/onboarding/name");
  }

  if (!profile?.idea_description) {
    redirect("/onboarding/idea");
  }

  const [{ data: catalog }, { data: selectedRows }] = await Promise.all([
    supabase
      .from("tags")
      .select("id, slug, label, is_suggested, created_by, created_at")
      .order("label", { ascending: true }),
    supabase.from("profile_tags").select("tag_id").eq("profile_id", user.id),
  ]);

  const tags = (catalog ?? []) as Tag[];
  const suggested = tags.filter((t) => t.is_suggested);
  const initialSelectedIds = (selectedRows ?? []).map((row) => row.tag_id);

  return (
    <OnboardingShell wide>
      <TagsStepForm
        suggested={suggested}
        catalog={tags}
        initialSelectedIds={initialSelectedIds}
      />
    </OnboardingShell>
  );
}
