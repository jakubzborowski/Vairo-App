import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureOwnProfile, getProfileGate } from "@/lib/profile";
import { onboardingPathForStep, type OnboardingStep } from "@/types/profile";

export const dynamic = "force-dynamic";

export default async function OnboardingIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/onboarding");
  }

  await ensureOwnProfile(supabase, user);
  const profile = await getProfileGate(supabase, user.id);

  if (profile?.onboarding_completed_at) {
    redirect("/app");
  }

  redirect(
    onboardingPathForStep(
      (profile?.onboarding_step as OnboardingStep | undefined) ?? "name"
    )
  );
}
