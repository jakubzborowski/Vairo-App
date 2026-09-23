import { redirect } from "next/navigation";
import { Compass, Eye, Inbox, Settings, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getActiveStartupId } from "@/lib/active-team";
import { getUserStartups, resolveActiveStartup } from "@/lib/startup";
import { getOpenRoles, getTeamMembers, loadJoinRequests } from "@/lib/social";
import { RequestCard } from "@/components/social/request-card";
import { TeamLogo } from "@/components/social/team-logo";
import { LeaveTeamButton } from "@/components/team/leave-team-button";
import { MemberRow } from "@/components/team/member-row";
import { OpenRolesManager } from "@/components/team/open-roles-manager";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { MAX_STARTUPS, ROLE_LABELS, canManageTeam } from "@/types/startup";

export const metadata = { title: "Team — Vairo" };
export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/register?next=/app/team");

  const [startups, activeTeamId] = await Promise.all([
    getUserStartups(supabase, user.id),
    getActiveStartupId(),
  ]);
  const active = resolveActiveStartup(startups, activeTeamId);

  if (!active) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <EmptyState
          icon={Users}
          title="Nie należysz do żadnego teamu"
          description="Team pojawia się tutaj, kiedy założysz startup albo dołączysz do cudzego. Do tego czasu masz warstwę Social."
          action={
            <>
              <Button href="/app/startups/new">Stwórz startup</Button>
              <Button href="/app/social/discover" variant="secondary">
                <Compass className="size-4" />
                Znajdź team
              </Button>
            </>
          }
        />
      </div>
    );
  }

  const canManage = canManageTeam(active.role);

  const [members, openRoles, { requests }] = await Promise.all([
    getTeamMembers(supabase, active.id),
    getOpenRoles(supabase, active.id),
    loadJoinRequests(
      supabase,
      user.id,
      canManage ? [active.id] : [],
      "pending"
    ),
  ]);

  const teamRequests = requests.filter(
    (request) => request.startupId === active.id
  );
  const founderCount = members.filter((m) => m.role === "founder").length;
  const seatsLeft = MAX_STARTUPS - startups.length;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <TeamLogo src={active.logoUrl} name={active.name} size="lg" />
          <div className="min-w-0">
            <h1 className="font-heading text-[1.65rem] font-semibold tracking-tight text-white">
              {active.name}
            </h1>
            <p className="mt-1 text-[13.5px] text-[var(--text-subtle)]">
              {members.length} {members.length === 1 ? "osoba" : "osób"} ·
              Twoja rola: {ROLE_LABELS[active.role]}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {canManage ? (
            <Button href="/app/team/profile" variant="secondary" size="sm">
              <Settings className="size-4" />
              Profil publiczny
            </Button>
          ) : null}
          <LeaveTeamButton startupId={active.id} teamName={active.name} />
        </div>
      </header>

      {/* Rola Członka nie jest karą — mówimy wprost, co z niej wynika. */}
      {!canManage ? (
        <p className="mt-5 flex items-start gap-2.5 rounded-xl border border-[var(--info)]/25 bg-[var(--info)]/8 px-4 py-3 text-[13px] leading-relaxed text-[var(--text-muted)]">
          <Eye className="mt-0.5 size-4 shrink-0 text-[var(--info)]" />
          <span>
            Jako {ROLE_LABELS[active.role]} widzisz cały skład i wszystko, co
            zespół uzupełnił w etapach. Skład, role i zaproszenia zmieniają
            Founder i Admin. Swoje stanowisko możesz edytować sam.
          </span>
        </p>
      ) : null}

      {canManage && teamRequests.length > 0 ? (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold text-white">
            <Inbox className="size-4 text-[var(--vairo)]" />
            Czeka na decyzję ({teamRequests.length})
          </h2>
          <p className="mt-0.5 text-[13px] text-[var(--text-subtle)]">
            Dopóki nie odpowiesz, te osoby czekają.
          </p>
          <div className="mt-3 flex flex-col gap-3">
            {teamRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-white">Skład</h2>
            <p className="mt-0.5 max-w-xl text-[13px] leading-relaxed text-[var(--text-subtle)]">
              Stanowisko to wizytówka, rola to uprawnienia. Tylko Founder
              i Admin zmieniają odpowiedzi w etapach.
            </p>
          </div>
          {canManage ? (
            <Button href="/app/social/discover?tab=people" variant="secondary" size="sm">
              <Users className="size-4" />
              Znajdź ludzi
            </Button>
          ) : null}
        </div>

        <ul className="mt-3 flex flex-col gap-2.5">
          {members.map((member) => (
            <MemberRow
              key={member.profileId}
              startupId={active.id}
              member={member}
              viewerId={user.id}
              viewerRole={active.role}
              founderCount={founderCount}
            />
          ))}
        </ul>
      </section>

      <OpenRolesManager
        startupId={active.id}
        roles={openRoles}
        canManage={canManage}
      />

      <p className="mt-8 text-[12.5px] text-[var(--text-faint)]">
        Jesteś w {startups.length} z {MAX_STARTUPS} teamów.
        {seatsLeft > 0
          ? ` Zostało ${seatsLeft} ${seatsLeft === 1 ? "miejsce" : "miejsca"}.`
          : " To maksimum na konto."}
      </p>
    </div>
  );
}
