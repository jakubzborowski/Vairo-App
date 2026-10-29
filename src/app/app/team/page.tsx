import { redirect } from "next/navigation";
import { Compass, Eye, Inbox, UserPlus, Users } from "lucide-react";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { getActiveStartupId } from "@/lib/active-team";
import { getUserStartups, resolveActiveStartup } from "@/lib/startup";
import { getOpenRoles, getTeamMembers, loadJoinRequests } from "@/lib/social";
import { InboxRow } from "@/components/social/inbox-row";
import { TeamLogo } from "@/components/social/team-logo";
import { LeaveTeamButton } from "@/components/team/leave-team-button";
import { MemberRow } from "@/components/team/member-row";
import { OpenRolesManager } from "@/components/team/open-roles-manager";
import { InviteLinkCard } from "@/components/team/invite-link-card";
import { getActiveInviteLink } from "@/lib/invites";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { MAX_STARTUPS, ROLE_LABELS, canManageTeam } from "@/types/startup";
import { plural } from "@/lib/utils";

export const metadata = { title: "Team — Vairo" };
export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) redirect("/register?next=/app/team");

  const [startups, activeTeamId] = await Promise.all([
    getUserStartups(supabase, user.id),
    getActiveStartupId(),
  ]);
  const active = resolveActiveStartup(startups, activeTeamId);

  if (!active) {
    return (
      <div className="page">
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
  // Link widzą tylko Founder i Admin — przekazanie go dalej to decyzja,
  // kto wchodzi do teamu.
  const inviteLink = canManage ? await getActiveInviteLink(supabase, active.id) : null;

  // Katalog umiejętności potrzebny przy otwartych rolach — bez niego nie da
  // się powiedzieć, czego rola szuka, a to jedyne pole, po którym Odkrywaj
  // potrafi dopasować kogokolwiek.
  const skillsQuery = supabase
    .from("skills")
    .select("id, label")
    .order("label", { ascending: true })
    .limit(300);

  const [members, openRoles, { requests }, { data: skillRows }] = await Promise.all([
    getTeamMembers(supabase, active.id),
    getOpenRoles(supabase, active.id),
    loadJoinRequests(
      supabase,
      user.id,
      canManage ? [active.id] : [],
      "pending"
    ),
    skillsQuery,
  ]);

  // Otwarta praca każdej osoby i praca po kimś, kto odszedł (wytyczne,
  // sekcja 7). Przed migracją 025 tabel nie ma — wtedy nic nie pokazujemy.
  const [goalRows, taskRows] = await Promise.all([
    supabase
      .from("goals")
      .select("owner_id, needs_reassign")
      .eq("startup_id", active.id)
      .neq("status", "completed")
      .is("archived_at", null),
    supabase
      .from("tasks")
      .select("owner_id, needs_reassign")
      .eq("startup_id", active.id)
      .neq("status", "done"),
  ]);
  const workAvailable = !goalRows.error;
  const workOf = (profileId: string) =>
    workAvailable
      ? {
          goals: (goalRows.data ?? []).filter((row) => row.owner_id === profileId).length,
          tasks: (taskRows.data ?? []).filter((row) => row.owner_id === profileId).length,
        }
      : null;
  const toReassign =
    (goalRows.data ?? []).filter((row) => row.needs_reassign).length +
    (taskRows.data ?? []).filter((row) => row.needs_reassign).length;

  const teamRequests = requests.filter(
    (request) => request.startupId === active.id
  );
  const founderCount = members.filter((m) => m.role === "founder").length;
  const seatsLeft = MAX_STARTUPS - startups.length;

  const openCount = openRoles.filter((role) => role.isOpen).length;

  return (
    <div className="page-wide">
      {/* Nagłówek mówi zdaniem, nie trzema liczbami. „W zespole 1 / Otwarte
          role 0 / Czeka na decyzję 0" trzeba było złożyć w myśl; jedno zdanie
          robi to za czytającego. Liczby dalej pochodzą z bazy. */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <TeamLogo src={active.logoUrl} name={active.name} size="lg" />
          <div className="min-w-0">
            <h1 className="font-heading text-[1.65rem] font-semibold leading-tight tracking-tight text-white">
              {active.name}
            </h1>
            <p className="mt-1 text-[14px] text-[var(--text-muted)]">
              {members.length} {plural(members.length, "osoba", "osoby", "osób")} w zespole.
              {canManage && teamRequests.length > 0
                ? ` ${teamRequests.length === 1 ? "Jedna osoba chce" : `${teamRequests.length} ${plural(teamRequests.length, "osoba chce", "osoby chcą", "osób chce")}`} dołączyć.`
                : ""}
              {openCount > 0
                ? ` Szukacie: ${openRoles
                    .filter((role) => role.isOpen)
                    .slice(0, 2)
                    .map((role) => role.title)
                    .join(", ")}${openCount > 2 ? "…" : ""}.`
                : ""}{" "}
              <span className="text-[var(--text-subtle)]">Twoja rola: {ROLE_LABELS[active.role]}.</span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {canManage ? (
            <Button href="/app/social/people" variant="secondary" size="sm">
              <UserPlus className="size-4" />
              Znajdź ludzi
            </Button>
          ) : null}
          <LeaveTeamButton startupId={active.id} teamName={active.name} asMenu canManage={canManage} />
        </div>
      </header>

      {/* Rola Członka nie jest karą, ale nie musi być tłumaczona akapitem. */}
      {!canManage ? (
        <p className="mt-4 flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-[var(--surface)] px-4 py-2.5 text-[13px] text-[var(--text-subtle)]">
          <Eye className="size-4 shrink-0 text-[var(--info)]" />
          Skład i role zmieniają Founder i Admin. Swoje stanowisko zmieniasz sam.
        </p>
      ) : null}

      {/* Sprawy czekające idą PRZED wszystkim i na całą szerokość — to jedyna
          rzecz na tym ekranie, na którą ktoś czeka po drugiej stronie.
          Ten sam wiersz co w skrzynce Zaproszeń: dwie różne karty na tę samą
          sprawę to dwa razy ta sama decyzja podejmowana od nowa. */}
      {canManage && teamRequests.length > 0 ? (
        <section className="edge-accent mt-5 overflow-hidden rounded-[22px] border border-[var(--vairo)]/25 bg-[var(--vairo)]/[0.05]">
          <h2 className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3 text-[13px] font-semibold text-white">
            <Inbox className="size-4 text-[var(--text-subtle)]" />
            Czeka na Twoją decyzję
            <span className="tabular ml-auto text-[12px] font-normal text-[var(--text-subtle)]">
              {teamRequests.length}
            </span>
          </h2>
          <ul className="divide-y divide-white/[0.06]">
            {teamRequests.map((request) => (
              <InboxRow key={request.id} kind="request" request={request} />
            ))}
          </ul>
        </section>
      ) : null}

      {canManage && toReassign > 0 ? (
        <p className="mt-5 flex flex-wrap items-center gap-3 rounded-[18px] border border-[var(--warning)]/25 bg-[var(--warning)]/[0.06] px-5 py-3.5 text-[13.5px] text-[var(--text-muted)]">
          <span className="min-w-0 flex-1">
            {toReassign} {plural(toReassign, "rzecz czeka", "rzeczy czekają", "rzeczy czeka")} na nowego właściciela — ktoś
            odszedł z teamu, a jego cele albo zadania zostały.
          </span>
          <Button size="sm" variant="secondary" href="/app/goals?view=all">
            Przypisz ponownie
          </Button>
        </p>
      ) : null}

      {canManage ? <InviteLinkCard startupId={active.id} initial={inviteLink} /> : null}

      {/* Ciepła karta tylko wtedy, gdy jest co zrobić: nikt nie czeka na
          decyzję, a team nikogo nie szuka — czyli nie pojawia się wśród
          rekrutujących w Odkrywaj. */}
      {canManage && teamRequests.length === 0 && openCount === 0 ? (
        <section className="edge-accent mt-5 flex flex-wrap items-center gap-4 rounded-[22px] border border-[var(--vairo)]/25 bg-[var(--vairo)]/[0.05] px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-medium text-white">Nie szukacie teraz nikogo</p>
            <p className="mt-0.5 text-[13.5px] leading-relaxed text-[var(--text-muted)]">
              Dodaj otwartą rolę — z liczbą godzin i umiejętnościami — a team pojawi się
              w Szukam projektu wśród tych, którzy rekrutują.
            </p>
          </div>
          <Button href="#otwarte-role">Dodaj otwartą rolę</Button>
        </section>
      ) : null}

      {/* Dwie kolumny od `lg`: skład to treść główna, otwarte role to
          towarzysząca. Jedna pod drugą wyglądały jak dwie równorzędne listy
          i trzeba było przeczytać nagłówki, żeby się dowiedzieć, że są o czym
          innym. */}
      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-start">
        <section className="overflow-hidden rounded-[22px] bg-[var(--surface)] lift-1">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
            <h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-[var(--text-subtle)]">
              <Users className="size-4" />
              Skład
              <span className="tabular font-normal normal-case tracking-normal text-[var(--text-subtle)]">
                {members.length}
              </span>
            </h2>

          </div>

          <p className="px-4 pt-3 text-[12.5px] leading-relaxed text-[var(--text-subtle)]">
            Rola mówi, kto może zmieniać etapy i skład. Stanowisko (CEO, CTO) nie daje uprawnień.
          </p>
          <ul className="flex flex-col gap-2.5 p-4">
            {members.map((member) => (
              <MemberRow
                key={member.profileId}
                startupId={active.id}
                member={member}
                viewerId={user.id}
                viewerRole={active.role}
                founderCount={founderCount}
                work={workOf(member.profileId)}
              />
            ))}
          </ul>
        </section>

        <div id="otwarte-role" className="scroll-mt-6">
        <OpenRolesManager
          startupId={active.id}
          roles={openRoles}
          canManage={canManage}
          skillCatalogue={(skillRows ?? []).map((row) => ({
            id: row.id as string,
            label: row.label as string,
          }))}
        />
        </div>
      </div>

      <p className="mt-6 text-[12.5px] text-[var(--text-subtle)]">
        Jesteś w {startups.length} z {MAX_STARTUPS} teamów.
        {seatsLeft > 0
          ? ` Zostało ${seatsLeft} ${seatsLeft === 1 ? "miejsce" : "miejsca"}.`
          : " To maksimum na konto."}
      </p>
    </div>
  );
}
