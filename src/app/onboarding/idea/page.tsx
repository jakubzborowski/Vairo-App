import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { IdeaStepForm } from "@/components/onboarding/idea-step-form";
import { ensureOwnProfile } from "@/lib/profile";

export const metadata = {
  title: "Your idea — Vairo",
};

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
    .select("full_name, idea_description, onboarding_step, onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.onboarding_completed_at) {
    redirect("/app");
  }

  if (!profile?.full_name) {
    redirect("/onboarding/name");
  }

  return (
    <OnboardingShell>
      <IdeaStepForm initialIdea={profile?.idea_description} />
    </OnboardingShell>
  );
}
