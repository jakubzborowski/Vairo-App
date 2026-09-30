import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { PathChoice } from "@/components/onboarding/path-choice";
import { ensureOwnProfile } from "@/lib/profile";

export const metadata = { title: "Od czego zaczynasz? — Vairo" };
export const dynamic = "force-dynamic";

export default async function OnboardingPathPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/onboarding/path");
  }

  await ensureOwnProfile(supabase, user);

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.onboarding_completed_at) {
    redirect("/app");
  }

  return (
    <OnboardingShell wide>
      <PathChoice />
    </OnboardingShell>
  );
}
