import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { PathChoice } from "@/components/onboarding/path-choice";
import { ensureOwnProfile } from "@/lib/profile";
import { INVITE_COOKIE, INVITE_TOKEN_RE } from "@/lib/invites";
import { getT } from "@/i18n/server";

export async function generateMetadata() {
  const t = await getT("onboarding");
  return { title: t("meta.path") };
}
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

  // Ktoś przyszedł z linku zaproszenia: nie pytamy, czy zakłada startup.
  // Wybór „founder” zakładał mu własny projekt (jedno z 3 miejsc), zanim
  // w ogóle zobaczył zaproszenie. Zostaje samo imię, a pierwsze wejście do
  // aplikacji prowadzi prosto na /join (layout `/app`).
  const pendingInvite = (await cookies()).get(INVITE_COOKIE)?.value;
  if (pendingInvite && INVITE_TOKEN_RE.test(pendingInvite)) {
    await supabase
      .from("profiles")
      .update({ onboarding_path: "joiner", onboarding_step: "name" })
      .eq("id", user.id);
    redirect("/onboarding/name");
  }

  return (
    <OnboardingShell wide>
      <PathChoice />
    </OnboardingShell>
  );
}
