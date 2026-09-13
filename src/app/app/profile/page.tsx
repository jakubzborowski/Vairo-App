import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/dashboard/app-shell";
import { ProfilePageClient } from "@/components/dashboard/profile-page-client";
import type { Skill, Tag, Team } from "@/types/profile";

export const metadata = {
  title: "Profile — Vairo",
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/register?next=/app/profile");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, email, headline, weekly_focus, avatar_url, idea_description, onboarding_completed_at"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed_at) {
    redirect("/onboarding");
  }

  const [
    { data: skills },
    { data: selectedSkillRows },
    { data: tagRows },
    { data: teams },
  ] = await Promise.all([
    supabase
      .from("skills")
      .select("id, slug, label, is_suggested, created_by, created_at")
      .order("label"),
    supabase.from("profile_skills").select("skill_id").eq("profile_id", user.id),
    supabase
      .from("profile_tags")
      .select("tag_id, tags(id, slug, label, is_suggested, created_by, created_at)")
      .eq("profile_id", user.id),
    supabase
      .from("teams")
      .select("id, name, description, owner_id, created_at, updated_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const ideaTags: Tag[] = (tagRows ?? [])
    .map((row) => {
      const tag = row.tags as Tag | Tag[] | null;
      if (!tag) return null;
      return Array.isArray(tag) ? tag[0] : tag;
    })
    .filter(Boolean) as Tag[];

  const displayName =
    profile.full_name?.trim() ||
    user.email?.split("@")[0] ||
    "Founder";

  return (
    <AppShell email={user.email ?? profile.email ?? ""} displayName={displayName}>
      <ProfilePageClient
        profile={{
          full_name: profile.full_name,
          headline: profile.headline,
          weekly_focus: profile.weekly_focus,
          avatar_url: profile.avatar_url,
          idea_description: profile.idea_description,
          email: profile.email,
        }}
        ideaTags={ideaTags}
        skills={(skills ?? []) as Skill[]}
        selectedSkillIds={(selectedSkillRows ?? []).map((r) => r.skill_id)}
        teams={(teams ?? []) as Team[]}
      />
    </AppShell>
  );
}
