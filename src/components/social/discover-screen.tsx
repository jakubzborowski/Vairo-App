import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ChevronDown,
  LayoutGrid,
  Search,
  SlidersHorizontal,
  Square,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserStartups } from "@/lib/startup";
import {
  discoverPeople,
  discoverTeams,
  loadMatchContext,
  loadPassedIds,
} from "@/lib/social";
import {
  matchHighlight,
  reasonsForPerson,
  reasonsForTeam,
  type MatchContext,
} from "@/lib/match";
import { loadConversationPartners } from "@/lib/messages";
import { scoreProfile } from "@/lib/profile-completeness";
import { ProfileNudge } from "@/components/social/profile-nudge";
import { ApplyButton } from "@/components/social/apply-button";
import { InviteButton } from "@/components/social/invite-button";
import { PeopleDeck } from "@/components/social/people-deck";
import { PersonCard } from "@/components/social/person-card";
import { TeamCard } from "@/components/social/team-card";
import { TeamsDeck } from "@/components/social/teams-deck";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LOOKING_FOR_OPTIONS } from "@/types/social";
import {
  MAX_STARTUPS,
  SELECTABLE_CATEGORIES,
  canManageTeam,
} from "@/types/startup";

export type DiscoverParams = {
  view?: string;
  q?: string;
  skill?: string;
  looking?: string;
  room?: string;
  category?: string;
  hiring?: string;
};

/** Gdzie mieszka która talia. Jedno miejsce, żeby adresy nie rozjechały się
 *  między linkiem w menu, formularzem szukania i przekierowaniem. */
export const DISCOVER_PATHS = {
  people: "/app/social/people",
  teams: "/app/social/teams",
} as const;

/**
 * Ekran Odkrywaj — **jedna talia, jeden adres.**
 *
 * Wcześniej obie talie mieszkały pod `/app/social/discover?tab=…`, a goły
 * adres przekierowywał na jedną z nich. To się nie broniło z trzech powodów:
 *
 *   • **Linka nie dało się wysłać.** „Zobacz, kogo tu mają" bez parametru
 *     otwierało u drugiej osoby coś innego niż u nadawcy.
 *   • **Zakładka w adresie to stan, nie miejsce.** Menu boczne ma dwie osobne
 *     pozycje, więc to są dwa miejsca — i powinny mieć dwie nazwy.
 *   • **Sąsiedztwo się zgadza.** Pod `/app/social/people/<id>` leży już profil
 *     jednej osoby, więc lista jest po prostu poziom wyżej. Ta sama rzecz
 *     w dwóch różnych drzewach adresów to dwa razy ta sama nawigacja.
 *
 * Cała mechanika została wspólna — różni je wyłącznie `tab`.
 */
export async function DiscoverScreen({
  tab,
  params,
}: {
  tab: "people" | "teams";
  params: DiscoverParams;
}) {
  // Talia jest trybem domyślnym: przy decyzji „czy chcę z kimś pracować"
  // jedna duża karta działa lepiej niż siatka trzydziestu miniatur.
  const view = params.view === "list" ? "list" : "deck";
  const basePath = DISCOVER_PATHS[tab];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/register?next=${basePath}`);

  const [startups, passed, conversationByProfile] = await Promise.all([
    getUserStartups(supabase, user.id),
    loadPassedIds(supabase, user.id),
    loadConversationPartners(supabase, user.id),
  ]);

  const myStartupIds = startups.map((s) => s.id);
  const invitableTeams = startups
    .filter((s) => canManageTeam(s.role))
    .map((s) => ({ id: s.id, name: s.name }));
  const atTeamLimit = startups.length >= MAX_STARTUPS;
  // W imieniu teamu może pisać każdy jego członek, nie tylko zarządzający.
  const contactContexts = startups.map((s) => ({ id: s.id, name: s.name }));

  // Moje umiejętności i otwarte role moich teamów — na tym opiera się zdanie
  // „dlaczego to widzisz" pod każdą kartą. Jedno pobranie na stronę.
  const matchContext = await loadMatchContext(supabase, user.id, myStartupIds);

  // Otwarte rozmowy znikają z talii: karta z napisem „już wysłane" zamiast
  // akcji to tylko przeszkoda na drodze do następnej osoby.
  const { data: pendingRows } = await supabase
    .from("startup_join_requests")
    .select("startup_id, profile_id")
    .eq("status", "pending");

  const myPendingTeams = new Set(
    (pendingRows ?? [])
      .filter((row) => row.profile_id === user.id)
      .map((row) => row.startup_id as string)
  );
  const pendingInvitees = new Set(
    (pendingRows ?? [])
      .filter((row) => myStartupIds.includes(row.startup_id as string))
      .map((row) => row.profile_id as string)
  );

  const { data: skillRows } =
    tab === "people"
      ? await supabase
          .from("skills")
          .select("slug, label")
          .order("label", { ascending: true })
          .limit(200)
      : { data: null };

  // Karta jest tak dobra, jak profil za nią — a bez tego paska człowiek nie ma
  // jak się dowiedzieć, że sam wygląda w Odkrywaj jak pusty prostokąt.
  type MyProfile = {
    full_name: string | null;
    avatar_url: string | null;
    headline: string | null;
    weekly_focus: string | null;
    looking_for: string | null;
  };

  const [{ data: myProfileRow }, { count: mySkillCount }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, avatar_url, headline, weekly_focus, looking_for")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("profile_skills")
      .select("skill_id", { count: "exact", head: true })
      .eq("profile_id", user.id),
  ]);

  const myProfile = myProfileRow as unknown as MyProfile | null;
  const completeness = scoreProfile({
    full_name: myProfile?.full_name,
    avatar_url: myProfile?.avatar_url,
    headline: myProfile?.headline,
    weekly_focus: myProfile?.weekly_focus,
    looking_for: myProfile?.looking_for,
    skillCount: mySkillCount ?? 0,
  });

  const resetHref = `${basePath}?view=${view}`;

  return (
    <div className="page-wide">
      {/* Nagłówek bez przełącznika „projekty / ludzie".
          Ten wybór przeniósł się do menu bocznego, gdzie widać obie drogi
          naraz — bo to nie jest decyzja podejmowana w trakcie przeglądania,
          tylko przed nim. Na ekranie zostaje tylko to, co dotyczy jednej
          talii: co oglądam, jak to wyświetlić i czego szukam. */}
      <header className="mx-auto flex max-w-[880px] flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="font-heading text-[1.5rem] font-semibold tracking-tight text-white">
            {tab === "people" ? "Szukam ludzi" : "Szukam projektu"}
          </h1>
          <p className="mt-0.5 text-[13.5px] text-[var(--text-subtle)]">
            {tab === "people"
              ? "Jedna osoba na ekran."
              : "Jeden projekt na ekran."}
          </p>
        </div>

        <nav
          aria-label="Sposób wyświetlania"
          className="inline-flex shrink-0 rounded-xl border border-white/10 bg-[var(--surface)] p-1"
        >
          <ViewLink
            href={`${basePath}?view=deck`}
            active={view === "deck"}
            label="Pojedynczo"
          >
            <Square className="size-4" />
          </ViewLink>
          <ViewLink
            href={`${basePath}?view=list`}
            active={view === "list"}
            label="Lista"
          >
            <LayoutGrid className="size-4" />
          </ViewLink>
        </nav>
      </header>

      <ProfileNudge
        score={completeness.score}
        missing={completeness.missing}
        className="mx-auto mt-5 max-w-[880px]"
      />

      {/* Szukanie jest POLEM, nie krokiem.
          Wcześniej trzeba było kliknąć „Filtry", poczekać na rozwinięcie,
          wpisać, kliknąć „Filtruj" — cztery ruchy do czynności, którą ludzie
          wykonują odruchowo jednym. Pole stoi więc na wierzchu i wysyła się
          Enterem. Pod nim, w rozwijanym pasku, zostają zawężenia, po które
          sięga się rzadziej: umiejętność, czego ktoś szuka, kategoria.

          To zwykły formularz GET, więc wynik da się odświeżyć, cofnąć
          i wysłać komuś linkiem. */}
      <form action={basePath} method="get" className="mx-auto mt-4 max-w-[880px]">
        <input type="hidden" name="view" value={view} />

        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[var(--surface)] py-1.5 pl-3.5 pr-1.5 transition-colors focus-within:border-[var(--vairo)]/45">
          <Search className="size-4 shrink-0 text-[var(--text-faint)]" />
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder={
              tab === "people"
                ? "Imię, rola, nad czym pracuje…"
                : "Nazwa projektu albo czym się zajmuje…"
            }
            aria-label="Szukaj"
            className="min-w-0 flex-1 bg-transparent py-1.5 text-[14px] text-white outline-none placeholder:text-[var(--text-faint)]"
          />
          {hasActiveFilter(params) ? (
            <Link
              href={resetHref}
              className="shrink-0 rounded-lg px-2.5 py-1.5 text-[12.5px] text-[var(--text-subtle)] transition-colors hover:text-white"
            >
              Wyczyść
            </Link>
          ) : null}
          <Button type="submit" size="sm" variant="secondary" className="shrink-0">
            Szukaj
          </Button>
        </div>

        <details open={hasNarrowingFilter(params)} className="group mt-2">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 px-1 text-[12.5px] text-[var(--text-subtle)] transition-colors hover:text-white">
            <SlidersHorizontal className="size-3.5" />
            Zawęź
            <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
          </summary>

          <div className="mt-2 flex flex-wrap items-end gap-2.5 rounded-xl border border-white/[0.07] bg-[var(--surface)] p-3.5">
            {tab === "people" ? (
              <>
                <Select
                  name="skill"
                  label="Umiejętność"
                  defaultValue={params.skill ?? ""}
                  options={(skillRows ?? []).map((row) => ({
                    value: row.slug as string,
                    label: row.label as string,
                  }))}
                />
                <Select
                  name="looking"
                  label="Czego szuka"
                  defaultValue={params.looking ?? ""}
                  options={LOOKING_FOR_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                />
                <Checkbox
                  name="room"
                  label="Ma miejsce na team"
                  checked={params.room === "1"}
                />
              </>
            ) : (
              <>
                <Select
                  name="category"
                  label="Kategoria"
                  defaultValue={params.category ?? ""}
                  options={SELECTABLE_CATEGORIES.map((category) => ({
                    value: category.key,
                    label: category.label,
                  }))}
                />
                <Checkbox
                  name="hiring"
                  label="Tylko szukające ludzi"
                  checked={params.hiring === "1"}
                />
              </>
            )}

            <Button type="submit" variant="secondary" size="sm">
              Zastosuj
            </Button>
          </div>
        </details>
      </form>

      <div className="mt-5">
        {tab === "people" ? (
          <PeopleResults
            supabase={supabase}
            userId={user.id}
            params={params}
            view={view}
            invitableTeams={invitableTeams}
            contactContexts={contactContexts}
            conversationByProfile={conversationByProfile}
            pendingInvitees={pendingInvitees}
            passedIds={passed.people}
            resetHref={resetHref}
            matchContext={matchContext}
          />
        ) : (
          <TeamResults
            supabase={supabase}
            params={params}
            view={view}
            myStartupIds={myStartupIds}
            myPendingTeams={myPendingTeams}
            passedIds={passed.teams}
            atTeamLimit={atTeamLimit}
            resetHref={resetHref}
            matchContext={matchContext}
          />
        )}
      </div>
    </div>
  );
}

async function PeopleResults({
  supabase,
  userId,
  params,
  view,
  invitableTeams,
  contactContexts,
  conversationByProfile,
  pendingInvitees,
  passedIds,
  resetHref,
  matchContext,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  params: DiscoverParams;
  view: "deck" | "list";
  invitableTeams: { id: string; name: string }[];
  contactContexts: { id: string; name: string }[];
  conversationByProfile: Record<string, string>;
  pendingInvitees: Set<string>;
  passedIds: string[];
  resetHref: string;
  matchContext: MatchContext;
}) {
  const filters = {
    q: params.q,
    skillSlug: params.skill,
    lookingFor: params.looking,
    withRoom: params.room === "1",
  };

  // W talii pomijamy siebie, pominiętych i osoby, z którymi rozmowa już trwa.
  // W liście zostają — tam chodzi o przegląd, nie o decyzję.
  const exclude =
    view === "deck"
      ? [userId, ...passedIds, ...pendingInvitees]
      : [userId, ...passedIds];

  const { people, error } = await discoverPeople(supabase, filters, [
    ...new Set(exclude),
  ]);

  if (error) return <ErrorNote message={error} />;

  if (view === "deck") {
    return (
      <PeopleDeck
        people={people}
        invitableTeams={invitableTeams}
        contactContexts={contactContexts}
        conversationByProfile={conversationByProfile}
        passedCount={passedIds.length}
        resetHref={resetHref}
        matchContext={matchContext}
      />
    );
  }

  if (people.length === 0) {
    return (
      <EmptyNote
        title="Nikt nie pasuje do tych filtrów"
        description="Widoczni są tylko ci, którzy ukończyli rejestrację i zostawili siebie w wyszukiwarce."
        resetHref={resetHref}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {people.map((person) => (
        <PersonCard
          key={person.id}
          person={person}
          highlight={matchHighlight(reasonsForPerson(person, matchContext))}
          action={
            pendingInvitees.has(person.id) ? (
              <span className="text-[12px] text-[var(--text-faint)]">
                Zaproszenie wysłane
              </span>
            ) : (
              <InviteButton
                profileId={person.id}
                profileName={person.full_name ?? "tę osobę"}
                teams={invitableTeams}
                size="sm"
              />
            )
          }
        />
      ))}
    </div>
  );
}

async function TeamResults({
  supabase,
  params,
  view,
  myStartupIds,
  myPendingTeams,
  passedIds,
  atTeamLimit,
  resetHref,
  matchContext,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  params: DiscoverParams;
  view: "deck" | "list";
  myStartupIds: string[];
  myPendingTeams: Set<string>;
  passedIds: string[];
  atTeamLimit: boolean;
  resetHref: string;
  matchContext: MatchContext;
}) {
  const filters = {
    q: params.q,
    category: params.category,
    hiringOnly: params.hiring === "1",
  };

  const exclude =
    view === "deck"
      ? [...myStartupIds, ...passedIds, ...myPendingTeams]
      : [...myStartupIds, ...passedIds];

  const { teams, error } = await discoverTeams(supabase, filters, [
    ...new Set(exclude),
  ]);

  if (error) return <ErrorNote message={error} />;

  if (view === "deck") {
    return (
      <TeamsDeck
        teams={teams}
        passedCount={passedIds.length}
        atTeamLimit={atTeamLimit}
        resetHref={resetHref}
        matchContext={matchContext}
      />
    );
  }

  if (teams.length === 0) {
    return (
      <EmptyNote
        title="Żaden team nie pasuje do tych filtrów"
        description="Widoczne są tylko aktywne startupy, które włączyły profil publiczny."
        resetHref={resetHref}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {teams.map((team) => (
        <TeamCard
          key={team.id}
          team={team}
          highlight={matchHighlight(reasonsForTeam(team, matchContext))}
          action={
            <ApplyButton
              startupId={team.id}
              startupName={team.name}
              openRoles={team.open_roles ?? []}
              size="sm"
              blockedReason={
                myPendingTeams.has(team.id)
                  ? "Zgłoszenie wysłane"
                  : atTeamLimit
                    ? `Masz już ${MAX_STARTUPS} teamy`
                    : null
              }
            />
          }
        />
      ))}
    </div>
  );
}

/** Czy ustawione jest cokolwiek POZA samym szukaniem — decyduje, czy pasek
 * „Zawęź" ma być otwarty od razu. Otwieranie go z powodu wpisanej frazy
 * byłoby myleniem dwóch różnych rzeczy. */
function hasNarrowingFilter(params: DiscoverParams) {
  return Boolean(
    params.skill || params.looking || params.room || params.category || params.hiring
  );
}

function hasActiveFilter(params: DiscoverParams) {
  return Boolean(
    params.q || params.skill || params.looking || params.category ||
      params.room === "1" || params.hiring === "1"
  );
}

function EmptyNote({
  title,
  description,
  resetHref,
}: {
  title: string;
  description: string;
  resetHref: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 px-6 py-12 text-center">
      <p className="font-heading text-[17px] font-semibold text-white">{title}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-[var(--text-subtle)]">
        {description}
      </p>
      <div className="mt-5 flex justify-center">
        <Button href={resetHref} variant="secondary">
          Wyczyść filtry
        </Button>
      </div>
    </div>
  );
}

function ErrorNote({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-[var(--warning)]/30 bg-[var(--warning)]/8 px-4 py-3 text-[13px] text-[var(--warning)]">
      {message}
    </p>
  );
}

/**
 * Przełącznik sposobu wyświetlania — sama ikona.
 *
 * Wygląda inaczej niż pozycja menu celowo: „Szukam ludzi / Szukam projektu"
 * zmienia to, czego szukasz, „Pojedynczo / Lista" tylko to, jak to leży na
 * ekranie. Jednakowy wygląd sugerowałby dwa równorzędne wybory.
 */
function ViewLink({
  href,
  active,
  label,
  children,
}: {
  href: string;
  active: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      title={label}
      aria-current={active ? "true" : undefined}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-lg transition-colors sm:size-8",
        active
          ? "bg-white/10 text-white"
          : "text-[var(--text-subtle)] hover:text-white"
      )}
    >
      {children}
      <span className="sr-only">{label}</span>
    </Link>
  );
}

function Select({
  name,
  label,
  defaultValue,
  options,
}: {
  name: string;
  label: string;
  defaultValue: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="min-w-[160px]">
      <span className="mb-1.5 block text-[12.5px] font-medium text-[var(--text-muted)]">
        {label}
      </span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="h-11 w-full rounded-xl border border-white/10 bg-[var(--surface-2)] px-3 text-[14px] text-white outline-none transition-colors hover:border-white/16 focus:border-[var(--vairo)]/70"
      >
        <option value="">Wszystkie</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Checkbox({
  name,
  label,
  checked,
}: {
  name: string;
  label: string;
  checked: boolean;
}) {
  return (
    <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-[var(--surface-2)] px-3.5 text-[13.5px] text-[var(--text-muted)] transition-colors hover:border-white/16">
      <input
        type="checkbox"
        name={name}
        value="1"
        defaultChecked={checked}
        className="size-4 accent-[var(--vairo)]"
      />
      {label}
    </label>
  );
}
