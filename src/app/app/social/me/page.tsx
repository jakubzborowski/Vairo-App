import { redirect } from "next/navigation";
import { EyeOff, Settings } from "lucide-react";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { getPublicProfile } from "@/lib/social";
import { PersonPreviewCard } from "@/components/social/person-preview";
import { scoreProfile } from "@/lib/profile-completeness";
import { SocialPreferencesForm } from "@/components/social/social-preferences-form";
import { StageReturnBar } from "@/components/stage/stage-return-bar";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import type { LookingFor, PublicProfile } from "@/types/social";

export const metadata = { title: "Mój profil publiczny — Vairo" };
export const dynamic = "force-dynamic";

export default async function MyPublicProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ back?: string }>;
}) {
  const { back } = await searchParams;
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) redirect("/register?next=/app/social/me");

  type ProfileRow = {
    full_name: string | null;
    public_name: string | null;
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
      "full_name, public_name, avatar_url, headline, weekly_focus, weekly_focus_updated_at, " +
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
      // Ta sama reguła co w widokach publicznych (migracja 033).
      full_name: profile?.public_name ?? profile?.full_name ?? null,
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

  const top = completeness.topMissing;
  // „W tym tygodniu" starzeje się po cichu. Po 14 dniach przypominamy, bo
  // nieaktualne zdanie na karcie mówi obcym coś, co już nie jest prawdą.
  const focusAge = profile?.weekly_focus && profile.weekly_focus_updated_at
    ? daysSince(profile.weekly_focus_updated_at)
    : null;
  const focusStale = focusAge !== null && focusAge >= 14;

  return (
    <div className="page-wide">
      <StageReturnBar back={back} />
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-heading text-[1.65rem] font-semibold tracking-tight text-white">
            Mój profil publiczny
          </h1>
          <p className="mt-1 max-w-2xl text-[14px] leading-relaxed text-[var(--text-muted)]">
            Tak widzą Cię ludzie, którzy szukają kogoś do teamu.
          </p>
        </div>
        <Button href="/app/settings/profile" variant="secondary">
          <Settings className="size-4" />
          Edytuj profil
        </Button>
      </header>

      {/* Ten sam układ co profil teamu: po lewej „co poprawić" i ustawienia,
          po prawej przyklejona karta tak, jak widzą ją inni. */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:items-start">
        <div className="flex flex-col gap-4">
          {top ? (
            <section className="edge-accent flex flex-wrap items-center gap-3.5 rounded-[22px] border border-[var(--vairo)]/25 bg-[var(--vairo)]/[0.06] px-5 py-4 lift-2">
              <div className="min-w-0 flex-1">
                <p className="text-[15.5px] font-medium text-white">{top.label}</p>
                <p className="mt-0.5 text-[13.5px] leading-relaxed text-[var(--text-muted)]">
                  {top.why}
                  {completeness.missing.length > 1
                    ? ` Zostało jeszcze: ${completeness.missing
                        .filter((piece) => piece.key !== top.key)
                        .map((piece) => piece.label.toLowerCase())
                        .join(", ")}.`
                    : ""}
                </p>
              </div>
              <Button href="/app/settings/profile">{top.label}</Button>
            </section>
          ) : (
            <p className="rounded-[18px] border border-[var(--success)]/20 bg-[var(--success)]/[0.06] px-5 py-4 text-[14px] text-[var(--success)]">
              Profil jest kompletny — karta mówi o Tobie wszystko, co powinna.
            </p>
          )}

          {focusStale ? (
            <p className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[18px] border border-[var(--warning)]/25 bg-[var(--warning)]/[0.06] px-5 py-3.5 text-[13.5px] text-[var(--text-muted)]">
              <span className="min-w-0 flex-1">
                „Nad czym teraz pracujesz” ma {focusAge} dni. Odśwież je, jeśli robisz już coś innego.
              </span>
              <Button size="sm" variant="secondary" href="/app/settings/profile">
                Odśwież
              </Button>
            </p>
          ) : null}

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

          {hidden ? (
            <p className="flex items-start gap-2 px-1 text-[13px] leading-relaxed text-[var(--text-muted)]">
              <EyeOff className="mt-0.5 size-4 shrink-0" />
              Nie pojawiasz się teraz w Szukam ludzi. Teamy, do których się zgłosisz, nadal Cię widzą.
            </p>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-6">
          <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-[var(--text-subtle)]">
            Tak widzą Cię inni
          </p>
          <PersonPreviewCard person={preview} compact />
        </aside>
      </div>
    </div>
  );
}

/** Ile pełnych dni minęło od daty — poza komponentem, bo zależy od zegara. */
function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}
