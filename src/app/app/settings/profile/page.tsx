import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileEditor } from "@/components/app/profile-editor";
import { SettingsTabs } from "@/components/app/settings-tabs";
import type { Skill } from "@/types/profile";

export const metadata = {
  title: "Twój profil — Vairo",
};

export const dynamic = "force-dynamic";

export default async function ProfileSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/register?next=/app/settings/profile");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, email, headline, weekly_focus, avatar_url, is_discoverable, onboarding_completed_at"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed_at) {
    redirect("/onboarding");
  }

  const [{ data: catalog }, { data: selectedRows }] = await Promise.all([
    supabase
      .from("skills")
      .select("id, slug, label, is_suggested, created_by, created_at")
      .order("label", { ascending: true }),
    supabase.from("profile_skills").select("skill_id").eq("profile_id", user.id),
  ]);

  return (
    <div>
      <div className="mx-auto w-full max-w-3xl">
        <SettingsTabs active="profile" />
      </div>
      <ProfileEditor
      profile={{
        fullName: profile.full_name ?? "",
        headline: profile.headline ?? "",
        weeklyFocus: profile.weekly_focus ?? "",
        avatarUrl: profile.avatar_url ?? null,
        // Kolumna dochodzi w migracji 002 — do czasu jej odpalenia domyślnie widoczny.
        isDiscoverable: profile.is_discoverable ?? true,
        email: user.email ?? profile.email ?? "",
      }}
      skills={(catalog ?? []) as Skill[]}
      selectedSkillIds={(selectedRows ?? []).map((row) => row.skill_id)}
      />
    </div>
  );
}
