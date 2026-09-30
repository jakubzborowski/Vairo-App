import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { NameStepForm } from "@/components/onboarding/name-step-form";
import { ensureOwnProfile } from "@/lib/profile";
import { stepsForPath, type OnboardingPath } from "@/types/profile";

export const metadata = { title: "Twoje imię — Vairo" };
export const dynamic = "force-dynamic";

export default async function OnboardingNamePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/onboarding/name");
  }

  await ensureOwnProfile(supabase, user);

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, onboarding_path, onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.onboarding_completed_at) {
    redirect("/app");
  }
  if (!profile?.onboarding_path) {
    redirect("/onboarding/path");
  }

  const path = profile.onboarding_path as OnboardingPath;

  return (
    <OnboardingShell
      step={2}
      totalSteps={stepsForPath(path).length}
      backHref="/onboarding/path"
    >
      <NameStepForm initialName={profile.full_name} path={path} />
    </OnboardingShell>
  );
}
