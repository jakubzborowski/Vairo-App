import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { IdeaStepForm } from "@/components/onboarding/idea-step-form";
import { ensureOwnProfile } from "@/lib/profile";

export const metadata = { title: "Twój pomysł — Vairo" };
export const dynamic = "force-dynamic";

export default async function OnboardingIdeaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/onboarding/idea");
  }

  await ensureOwnProfile(supabase, user);

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, idea_description, onboarding_path, onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.onboarding_completed_at) {
    redirect("/app");
  }
  if (!profile?.full_name) {
    redirect("/onboarding/name");
  }
  if (profile.onboarding_path !== "founder_idea") {
    redirect("/onboarding");
  }

  // Nazwa mogła już powstać, jeśli user cofnął się z kroku kategorii.
  const { data: startup } = await supabase
    .from("startups")
    .select("name")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <OnboardingShell step={3} totalSteps={5} backHref="/onboarding/name">
      <IdeaStepForm
        initialIdea={profile.idea_description}
        initialName={startup?.name}
      />
    </OnboardingShell>
  );
}
