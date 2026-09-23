import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getActiveStartupId } from "@/lib/active-team";
import { getUserStartups, resolveActiveStartup } from "@/lib/startup";
import { TeamProfileEditor } from "@/components/team/team-profile-editor";
import { ProfileNudge } from "@/components/social/profile-nudge";
import { scoreTeamProfile } from "@/lib/profile-completeness";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { canManageTeam, canTransferOwnership, type StartupStatus } from "@/types/startup";

export const metadata = { title: "Profil publiczny teamu — Vairo" };
export const dynamic = "force-dynamic";

export default async function TeamProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/register?next=/app/team/profile");

  const [startups, activeTeamId] = await Promise.all([
    getUserStartups(supabase, user.id),
    getActiveStartupId(),
  ]);
  const active = resolveActiveStartup(startups, activeTeamId);

  if (!active) redirect("/app/team");

  if (!canManageTeam(active.role)) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <EmptyState
          icon={Eye}
          title="Profil publiczny edytują Founder i Admin"
          description="Możesz go obejrzeć tak, jak widzą go osoby z zewnątrz."
          action={
            <>
              <Button href={`/app/social/teams/${active.id}`} variant="secondary">
                Zobacz profil publiczny
              </Button>
              <Button href="/app/team" variant="ghost">
                Wróć do teamu
              </Button>
            </>
          }
        />
      </div>
    );
  }

  type Row = {
    name: string;
    logo_url: string | null;
    public_tagline: string | null;
    public_description: string | null;
    location: string | null;
    website_url: string | null;
    is_discoverable: boolean;
    status: StartupStatus;
  };

  const { data: row } = await supabase
    .from("startups")
    .select(
      "name, logo_url, public_tagline, public_description, location, " +
        "website_url, is_discoverable, status"
    )
    .eq("id", active.id)
    .maybeSingle();

  const startup = row as unknown as Row | null;

  if (!startup) redirect("/app/team");

  const { count: openRoleCount } = await supabase
    .from("startup_open_roles")
    .select("id", { count: "exact", head: true })
    .eq("startup_id", active.id)
    .eq("is_open", true);

  const completeness = scoreTeamProfile({
    logo_url: startup.logo_url,
    public_tagline: startup.public_tagline,
    public_description: startup.public_description,
    location: startup.location,
    openRoleCount: openRoleCount ?? 0,
  });

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Link
        href="/app/team"
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-[var(--text-subtle)] transition-colors hover:text-white"
      >
        <ArrowLeft className="size-4" />
        Wróć do teamu
      </Link>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-heading text-[1.65rem] font-semibold tracking-tight text-white">
            Profil publiczny teamu
          </h1>
          <p className="mt-1 max-w-xl text-[14px] leading-relaxed text-[var(--text-subtle)]">
            Tak widzą Was ludzie, którzy szukają projektu. Pełny opis pomysłu
            z Idea Stage zostaje prywatny — na zewnątrz idzie tylko to, co
            napiszecie tutaj.
          </p>
        </div>
        <Button href={`/app/social/teams/${active.id}`} variant="secondary" size="sm">
          <Eye className="size-4" />
          Podgląd
        </Button>
      </header>

      {/* Team widoczny, ale bez logo, opisu i otwartych ról nie daje nikomu
          powodu, żeby się zgłosić — i nic mu tego nie mówiło. */}
      {startup.is_discoverable ? (
        <div className="mb-5">
          <ProfileNudge
            score={completeness.score}
            missing={completeness.missing}
            variant="panel"
            subject="team"
            showFix={false}
          />
          <p className="mt-2 px-1 text-[12.5px] text-[var(--text-subtle)]">
            Logo, opis i lokalizację uzupełnisz poniżej. Otwarte role dodajesz{" "}
            <Link
              href="/app/team"
              className="text-[var(--vairo)] underline-offset-2 hover:underline"
            >
              na stronie teamu
            </Link>
            .
          </p>
        </div>
      ) : null}

      <TeamProfileEditor
        startupId={active.id}
        name={startup.name}
        logoUrl={startup.logo_url}
        tagline={startup.public_tagline ?? ""}
        description={startup.public_description ?? ""}
        location={startup.location ?? ""}
        websiteUrl={startup.website_url ?? ""}
        isDiscoverable={startup.is_discoverable}
        status={startup.status}
        canArchive={canTransferOwnership(active.role)}
        canDelete={canTransferOwnership(active.role)}
      />
    </div>
  );
}
