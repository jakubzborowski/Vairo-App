import { redirect } from "next/navigation";
import { Compass, Eye, Inbox, Settings, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getActiveStartupId } from "@/lib/active-team";
import { getUserStartups, resolveActiveStartup } from "@/lib/startup";
import { getOpenRoles, getTeamMembers, loadJoinRequests } from "@/lib/social";
import { InboxRow } from "@/components/social/inbox-row";
import { TeamLogo } from "@/components/social/team-logo";
import { LeaveTeamButton } from "@/components/team/leave-team-button";
import { MemberRow } from "@/components/team/member-row";
import { OpenRolesManager } from "@/components/team/open-roles-manager";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { MAX_STARTUPS, ROLE_LABELS, canManageTeam } from "@/types/startup";
import { cn } from "@/lib/utils";

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

  const teamRequests = requests.filter(
    (request) => request.startupId === active.id
  );
  const founderCount = members.filter((m) => m.role === "founder").length;
  const seatsLeft = MAX_STARTUPS - startups.length;

  const openCount = openRoles.filter((role) => role.isOpen).length;

  return (
    <div className="page-wide">
      {/* Nagłówek jako karta, nie jako wiersz tekstu.
          Wcześniej ekran teamu był trzema listami jedna pod drugą, w tej samej
          szarości i z tym samym odstępem — oko nie miało po czym poznać, że to
          są trzy różne rzeczy. Teraz zaczyna się od karty bohatera z fakturą
          warstwic i trzema liczbami, a dopiero pod nią idą sekcje. */}
      <header className="topo overflow-hidden rounded-2xl border border-white/[0.07] bg-[var(--surface)] p-5 lift-1 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <TeamLogo src={active.logoUrl} name={active.name} size="lg" />
            <div className="min-w-0">
              <h1 className="font-heading text-[1.65rem] font-semibold tracking-tight text-white">
                {active.name}
              </h1>
              <p className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-2.5 py-1 text-[12.5px] text-[var(--text-muted)]">
                {canManage ? (
                  <Users className="size-3.5" />
                ) : (
                  <Eye className="size-3.5 text-[var(--info)]" />
                )}
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
        </div>

        {/* Trzy liczby, które opisują ten zespół. Każda z bazy. */}
        <dl className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-white/[0.06]">
          <TeamStat label="W zespole" value={members.length} />
          <TeamStat label="Otwarte role" value={openCount} />
          <TeamStat
            label="Czeka na decyzję"
            shortLabel="Czeka"
            value={teamRequests.length}
            highlight={teamRequests.length > 0}
          />
        </dl>
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
        <section className="mt-4 overflow-hidden rounded-2xl border border-[var(--vairo)]/25 bg-[var(--vairo)]/[0.05]">
          <h2 className="flex items-center gap-2 border-b border-[var(--vairo)]/20 px-4 py-3 text-[13px] font-semibold uppercase tracking-wide text-[var(--vairo)]">
            <Inbox className="size-4" />
            Czeka na Twoją decyzję
            <span className="tabular ml-auto rounded-full bg-[var(--vairo)] px-2 py-0.5 text-[11px] font-semibold text-white">
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

      {/* Dwie kolumny od `lg`: skład to treść główna, otwarte role to
          towarzysząca. Jedna pod drugą wyglądały jak dwie równorzędne listy
          i trzeba było przeczytać nagłówki, żeby się dowiedzieć, że są o czym
          innym. */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-start">
        <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[var(--surface)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
            <h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-[var(--text-subtle)]">
              <Users className="size-4" />
              Skład
              <span className="tabular font-normal normal-case tracking-normal text-[var(--text-faint)]">
                {members.length}
              </span>
            </h2>
            {canManage ? (
              <Button
                href="/app/social/people"
                variant="secondary"
                size="sm"
              >
                Znajdź ludzi
              </Button>
            ) : null}
          </div>

          <ul className="flex flex-col gap-2.5 p-4">
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
          skillCatalogue={(skillRows ?? []).map((row) => ({
            id: row.id as string,
            label: row.label as string,
          }))}
        />
      </div>

      <p className="mt-6 text-[12.5px] text-[var(--text-faint)]">
        Jesteś w {startups.length} z {MAX_STARTUPS} teamów.
        {seatsLeft > 0
          ? ` Zostało ${seatsLeft} ${seatsLeft === 1 ? "miejsce" : "miejsca"}.`
          : " To maksimum na konto."}
      </p>
    </div>
  );
}

/**
 * Jedna liczba w nagłówku teamu.
 *
 * Siatka `gap-px` na jaśniejszym tle daje kreski między polami bez rysowania
 * ani jednej ramki — trzy pola czyta się wtedy jako jeden przyrząd, a nie
 * jako trzy kafelki.
 */
function TeamStat({
  label,
  shortLabel,
  value,
  highlight,
}: {
  label: string;
  /** Krótsza wersja na telefon — przy trzech kolumnach na 375 px pole ma
      niecałe 80 px i dłuższa etykieta łamie się na dwie linijki. */
  shortLabel?: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="bg-[var(--surface)] px-3 py-3 sm:px-4">
      <dt className="text-[11.5px] text-[var(--text-subtle)]">
        {shortLabel ? (
          <>
            <span className="sm:hidden">{shortLabel}</span>
            <span className="hidden sm:inline">{label}</span>
          </>
        ) : (
          label
        )}
      </dt>
      <dd
        className={cn(
          "tabular mt-0.5 font-heading text-[22px] font-semibold leading-none",
          highlight ? "text-[var(--vairo)]" : "text-white"
        )}
      >
        {value}
      </dd>
    </div>
  );
}
