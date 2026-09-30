import { redirect } from "next/navigation";
import { EyeOff, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPublicProfile } from "@/lib/social";
import { PersonPreviewCard } from "@/components/social/person-preview";
import { ProfileNudge } from "@/components/social/profile-nudge";
import { scoreProfile } from "@/lib/profile-completeness";
import { SocialPreferencesForm } from "@/components/social/social-preferences-form";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import type { LookingFor, PublicProfile } from "@/types/social";

export const metadata = { title: "Mój profil publiczny — Vairo" };
export const dynamic = "force-dynamic";

export default async function MyPublicProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/register?next=/app/social/me");

  type ProfileRow = {
    full_name: string | null;
    avatar_url: string | null;
    headline: string | null;
    weekly_focus: string | null;
    weekly_focus_updated_at: string | null;
    location: string | null;
    looking_for: LookingFor | null;
    weekly_hours: number | null;
    is_discoverable: boolean;
    onboarding_path: string | null;
    created_at: string;
  };

  const { data: profileRow } = await supabase
    .from("profiles")
    .select(
      "full_name, avatar_url, headline, weekly_focus, weekly_focus_updated_at, " +
        "location, looking_for, weekly_hours, is_discoverable, onboarding_path, created_at",
    )
    .eq("id", user.id)
    .maybeSingle();

  const profile = profileRow as unknown as ProfileRow | null;

  // Podgląd bierzemy z tego samego widoku, z którego korzysta Discover —
  // dzięki temu „tak widzą Cię inni" jest dosłownie prawdą, a nie makietą.
  const published = await getPublicProfile(supabase, user.id);

  const { data: skillRows } = await supabase
    .from("profile_skills")
    .select("skill_id, skills(id, label)")
    .eq("profile_id", user.id);

  type SkillRow = { skills: { id: string; label: string } | null };
  const skills = ((skillRows ?? []) as unknown as SkillRow[])
    .map((row) => row.skills)
    .filter(Boolean) as { id: string; label: string }[];

  const { count: teamCount } = await supabase
    .from("startup_members")
    .select("startup_id", { count: "exact", head: true })
    .eq("profile_id", user.id);

  const preview: PublicProfile =
    published ??
    ({
      id: user.id,
      full_name: profile?.full_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
      headline: profile?.headline ?? null,
      weekly_focus: profile?.weekly_focus ?? null,
      weekly_focus_updated_at: profile?.weekly_focus_updated_at ?? null,
      location: profile?.location ?? null,
      looking_for: profile?.looking_for ?? null,
      weekly_hours: profile?.weekly_hours ?? null,
      onboarding_path: profile?.onboarding_path ?? null,
      created_at: profile?.created_at ?? new Date().toISOString(),
      team_count: teamCount ?? 0,
      skills,
    } satisfies PublicProfile);

  const hidden = profile?.is_discoverable === false;

  const completeness = scoreProfile({
    full_name: profile?.full_name,
    avatar_url: profile?.avatar_url,
    headline: profile?.headline,
    weekly_focus: profile?.weekly_focus,
    looking_for: profile?.looking_for,
    skillCount: skills.length,
  });

  return (
    <div className="page-wide">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-heading text-[1.65rem] font-semibold tracking-tight text-white">
            Mój profil publiczny
          </h1>
          <p className="mt-1 max-w-2xl text-[14px] leading-relaxed text-[var(--text-subtle)]">
            Tak wyglądasz dla osób, które Cię jeszcze nie znają.
          </p>
        </div>
        <Button href="/app/settings/profile" variant="secondary">
          <Settings className="size-4" />
          Ustawienia profilu
        </Button>
      </header>

      {/* Podgląd na całą szerokość, ustawienia POD nim.
          Wcześniej karta stała w wąskiej kolumnie obok formularza i była
          mniejsza od rzeczy, które ją opisują — a to ona jest tu tematem.
          Teraz jest pierwsza i pełnowymiarowa: dokładnie taki obiekt, jaki
          zobaczą obcy, razem z prawą kolumną. */}
      <section className="mt-6">
        <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-wide text-[var(--text-subtle)]">
          Tak widzą Cię w Odkrywaj
        </p>
        <PersonPreviewCard person={preview} />

        {hidden ? (
          <p className="mt-3 flex items-start gap-2 rounded-xl border border-[var(--warning)]/25 bg-[var(--warning)]/8 px-4 py-3 text-[12.5px] leading-relaxed text-[var(--warning)]">
            <EyeOff className="mt-0.5 size-4 shrink-0" />
            <span>
              Ta karta nie pojawia się teraz w Odkrywaj — masz wyłączoną
              widoczność. Włącz ją niżej, gdy uznasz, że jest gotowa.
            </span>
          </p>
        ) : null}
      </section>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        <ProfileNudge
          score={completeness.score}
          missing={completeness.missing}
          variant="panel"
        />

        <Card>
          <CardBody className="pt-6">
            <SocialPreferencesForm
              lookingFor={profile?.looking_for ?? null}
              location={profile?.location ?? ""}
              weeklyHours={profile?.weekly_hours ?? null}
              isDiscoverable={profile?.is_discoverable ?? true}
            />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
