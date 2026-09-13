import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { NameStepForm } from "@/components/onboarding/name-step-form";
import { ensureOwnProfile } from "@/lib/profile";

export const metadata = {
  title: "Your name — Vairo",
};

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
    .select("full_name, onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.onboarding_completed_at) {
    redirect("/app");
  }

  return (
    <OnboardingShell>
      <NameStepForm initialName={profile?.full_name} />
    </OnboardingShell>
  );
}
