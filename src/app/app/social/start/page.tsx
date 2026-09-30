import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SocialProfileWizard } from "@/components/social/social-profile-wizard";
import type { LookingFor } from "@/types/social";

export const metadata = { title: "Twój profil publiczny — Vairo" };
export const dynamic = "force-dynamic";

/**
 * Wejście do warstwy Social.
 *
 * Tu trafia joiner zaraz po rejestracji i każdy, kto ma zbyt pusty profil,
 * żeby cokolwiek z Odkrywaj wyszło. Kreator, nie formularz — zgodnie z zasadą,
 * że jedno pytanie na ekran przechodzi ktoś, kogo długa lista pól odrzuca.
 */
export default async function SocialStartPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/register?next=/app/social/start");

  type ProfileRow = {
    full_name: string | null;
    avatar_url: string | null;
    headline: string | null;
    weekly_focus: string | null;
    looking_for: LookingFor | null;
    location: string | null;
    weekly_hours: number | null;
    is_discoverable: boolean;
  };

  const [{ data: profileRow }, { data: skillRows }, { data: mineRows }, { count }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "full_name, avatar_url, headline, weekly_focus, looking_for, " +
            "location, weekly_hours, is_discoverable"
        )
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("skills")
        .select("id, label")
        .order("is_suggested", { ascending: false })
        .order("label", { ascending: true })
        .limit(300),
      supabase.from("profile_skills").select("skill_id").eq("profile_id", user.id),
      supabase
        .from("startup_members")
        .select("startup_id", { count: "exact", head: true })
        .eq("profile_id", user.id),
    ]);

  const profile = profileRow as unknown as ProfileRow | null;

  return (
    <div className="page py-4">
      <SocialProfileWizard
        profileId={user.id}
        skills={(skillRows ?? []).map((row) => ({
          id: row.id as string,
          label: row.label as string,
        }))}
        initial={{
          fullName: profile?.full_name ?? "",
          avatarUrl: profile?.avatar_url ?? null,
          headline: profile?.headline ?? "",
          lookingFor: profile?.looking_for ?? null,
          location: profile?.location ?? "",
          weeklyHours: profile?.weekly_hours ?? null,
          weeklyFocus: profile?.weekly_focus ?? "",
          skillIds: (mineRows ?? []).map((row) => row.skill_id as string),
          isDiscoverable: profile?.is_discoverable ?? true,
          teamCount: count ?? 0,
        }}
      />
    </div>
  );
}
