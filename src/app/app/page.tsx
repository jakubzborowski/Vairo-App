import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  Compass,
  Eye,
  HelpCircle,
  History,
  Lock,
  Plus,
  Rocket,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserStartups, resolveActiveStartup } from "@/lib/startup";
import { getActiveStartupId } from "@/lib/active-team";
import { currentProgramEntry, loadStageProgram } from "@/lib/stage";
import { loadNextActions, type Blocker, type NextAction } from "@/lib/next-actions";
import { getTeamMembers } from "@/lib/social";
import { StageProgress } from "@/components/app/stage-progress";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardBody } from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";
import { scoreProfile } from "@/lib/profile-completeness";
import { cn, plural } from "@/lib/utils";
import { ROLE_LABELS, canEditStageData, canManageTeam } from "@/types/startup";
import type { TeamMember } from "@/lib/social";

export const metadata = { title: "Dashboard — Vairo" };
export const dynamic = "force-dynamic";

export default async function AppPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/register?next=/app");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, headline, weekly_focus, looking_for")
    .eq("id", user.id)
    .maybeSingle();

  const firstName =
    profile?.full_name?.trim().split(/\s+/)[0] || user.email?.split("@")[0] || "";

  const [startups, activeTeamId] = await Promise.all([
    getUserStartups(supabase, user.id),
    getActiveStartupId(),
  ]);
  const active = resolveActiveStartup(startups, activeTeamId);

  const greeting = firstName ? `Cześć, ${firstName}` : "Cześć";

  // Bez teamu user ma wyłącznie warstwę Social — i to jest normalny stan,
  // nie błąd. Dlatego zamiast pustych kafelków dostaje dwa konkretne wyjścia.
  if (!active) {
    return (
      <div className="page">
        <h1 className="font-heading text-[1.65rem] font-semibold tracking-tight text-white sm:text-[1.85rem]">
          {greeting}
        </h1>
        <p className="mt-1 text-[14px] text-[var(--text-subtle)]">
          Nie należysz jeszcze do żadnego teamu.
        </p>

        <Card className="mt-6">
          <CardBody className="pt-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--vairo)]/12 text-[var(--vairo)]">
                <Rocket className="size-6" strokeWidth={1.5} />
              </span>
              <div className="min-w-0">
                <h2 className="font-heading text-[19px] font-semibold text-white">
                  Dołącz do teamu albo stwórz własny startup
                </h2>
                <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[var(--text-muted)]">
                  Dashboard i walidacja pomysłu działają w kontekście konkretnego
                  startupu. Dopóki nie jesteś w żadnym teamie, korzystasz
                  z warstwy Social — tam poznajesz ludzi i znajdujesz projekty,
                  do których możesz dołączyć.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button href="/app/startups/new">
                    <Rocket className="size-4" />
                    Stwórz startup
                  </Button>
                  <Button href="/app/social/discover" variant="secondary">
                    <Compass className="size-4" />
                    Znajdź team
                  </Button>
                  <Button href="/app/program" variant="ghost">
                    <HelpCircle className="size-4" />
                    Jak to działa?
                  </Button>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Pasek etapów czyta `stage_templates`, nie listę zaszytą w kodzie — dodanie
  // etapu to migracja, nie zmiana w trzech komponentach.
  const program = await loadStageProgram(supabase, active.id);
  const current = currentProgramEntry(program);
  const stage = active.stage;
  const percent =
    stage && stage.total > 0 ? Math.round((stage.done / stage.total) * 100) : 0;
  // „2 z 5" w karcie i klocek numer 2 na pasku to ta sama informacja podana
  // dwa razy — i o to chodzi. Pasek pokazuje kształt drogi, karta nazywa
  // miejsce na niej słowami.
  const stepNumber = program.findIndex((item) => item.key === current?.key) + 1;
  const canEdit = canEditStageData(active.role);

  const { actions, blocker } = await loadNextActions(supabase, {
    userId: user.id,
    active,
    program,
    current,
  });

  // Liczby do paneli. Każda pochodzi z bazy — panel z wymyśloną metryką
  // („wynik gotowości: 72") wyglądałby mądrze i nie znaczyłby nic.
  const [{ count: memberCount }, { count: waitingCount }, { count: skillCount }] =
    await Promise.all([
      supabase
        .from("startup_members")
        .select("profile_id", { count: "exact", head: true })
        .eq("startup_id", active.id),
      canManageTeam(active.role)
        ? supabase
            .from("startup_join_requests")
            .select("id", { count: "exact", head: true })
            .eq("startup_id", active.id)
            .eq("status", "pending")
            .eq("direction", "application")
        : Promise.resolve({ count: 0 }),
      supabase
        .from("profile_skills")
        .select("skill_id", { count: "exact", head: true })
        .eq("profile_id", user.id),
    ]);

  // Skład zespołu — „kto za co odpowiada" z guidelines, sekcja 9. Na razie
  // odpowiedzialność wyraża rola i stanowisko; przypisania pracy dojdą razem
  // z Goals w Execution.
  const members = await getTeamMembers(supabase, active.id);

  const completeness = scoreProfile({
    full_name: profile?.full_name,
    avatar_url: profile?.avatar_url,
    headline: profile?.headline,
    weekly_focus: profile?.weekly_focus,
    looking_for: profile?.looking_for,
    skillCount: skillCount ?? 0,
  });

  const doneStages = program.filter((item) => item.status === "completed").length;

  return (
    <div className="page-wide">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-heading text-[1.65rem] font-semibold tracking-tight text-white sm:text-[1.85rem]">
            {greeting}
          </h1>
          <p className="mt-1 text-[14px] text-[var(--text-subtle)]">{active.name}</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white/6 px-3 py-1.5 text-[12.5px] text-[var(--text-muted)]">
          {canEdit ? (
            <Users className="size-3.5" />
          ) : (
            <Eye className="size-3.5 text-[var(--info)]" />
          )}
          Twoja rola: {ROLE_LABELS[active.role]}
        </span>
      </header>

      <StageProgress
        program={program}
        currentKey={current?.key ?? null}
        className="mt-6"
      />

      <p className="mt-2">
        <Link
          href="/app/program"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--text-subtle)] underline-offset-2 transition-colors hover:text-white hover:underline"
        >
          <HelpCircle className="size-3.5" />
          Jak działa program?
        </Link>
      </p>

      {/* Dashboard jako SIATKA paneli, nie jedna kolumna kart.
          Kolumna narzuca czytanie po kolei, jakby wszystko było tak samo
          ważne i tak samo pilne. Siatka pozwala postawić jedną rzecz jako
          główną (bieżący etap na całą szerokość), a resztę jako trzy krótkie
          odpowiedzi obok siebie — każda na inne pytanie z guidelines:
          gdzie jestem, kto jest w zespole, jak wyglądam na zewnątrz.

          `panels` daje im wejście po kolei, co 70 ms. Kolejność pojawiania
          się jest tą samą informacją co kolejność w siatce. */}
      <div className="panels mt-4 grid gap-3 md:grid-cols-6">
        {stage ? (
          <Card className="topo md:col-span-6" interactive>
            <CardBody className="pt-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--text-subtle)]">
                    {stage.status === "completed" ? "Etap domknięty" : "Bieżący etap"}
                    {stepNumber > 0 ? (
                      <span className="tabular font-normal normal-case tracking-normal">
                        · {stepNumber} z {program.length}
                      </span>
                    ) : null}
                  </p>
                  <h2 className="mt-1 font-heading text-[20px] font-semibold text-white">
                    {stage.title}
                  </h2>
                  {/* Podtytuł etapu leżał w bazie nieużywany, a to jedyne
                      zdanie, które mówi, PO CO jest ten etap. Sama nazwa
                      „Idea Stage" nie znaczy nic dla kogoś, kto pierwszy raz
                      słyszy o walidacji. */}
                  {current?.subtitle ? (
                    <p className="mt-1 text-[14px] text-[var(--text-muted)]">
                      {current.subtitle}
                    </p>
                  ) : null}
                </div>
                <Button href="/app/stage">
                  {stage.status === "completed" || !canEdit ? "Przejrzyj" : "Kontynuuj"}
                  <ArrowRight className="size-4" />
                </Button>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/8">
                  <div
                    className="grow-bar h-full rounded-full bg-[var(--vairo)]"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="tabular shrink-0 text-[12.5px] text-[var(--text-subtle)]">
                  {stage.status === "completed"
                    ? canEdit
                      ? "Możesz tu wrócić i poprawić odpowiedzi"
                      : "Tylko do odczytu"
                    : `${stage.done} z ${stage.total}`}
                </span>
              </div>
            </CardBody>
          </Card>
        ) : null}

        <StatPanel
          href="/app/program"
          icon={Rocket}
          label="Program"
          value={`${doneStages} z ${program.length}`}
          hint="etapów domkniętych"
        />

        <StatPanel
          href="/app/team"
          icon={Users}
          label="Team"
          value={<CountUp value={memberCount ?? 0} />}
          hint={plural(memberCount ?? 0, "osoba w zespole", "osoby w zespole", "osób w zespole")}
          badge={
            waitingCount && waitingCount > 0
              ? `${waitingCount} czeka na decyzję`
              : undefined
          }
          action={
            canManageTeam(active.role)
              ? { href: "/app/team/profile", label: "Profil publiczny" }
              : undefined
          }
        />

        <StatPanel
          href="/app/social/me"
          icon={Target}
          label="Twój profil publiczny"
          value={<CountUp value={completeness.score} suffix="%" delayMs={280} />}
          hint={completeness.missing.length === 0 ? "komplet" : "gotowe"}
          badge={
            completeness.missing.length > 0
              ? `${completeness.missing.length} ${plural(
                  completeness.missing.length,
                  "brak",
                  "braki",
                  "braków"
                )}`
              : undefined
          }
          progress={completeness.score}
        />

      </div>

      {blocker ? <BlockerNote blocker={blocker} /> : null}

      {/* Układ z guidelines, sekcja 9: „Po lewej: Next Actions. Po prawej:
          najbliższy Goal i odpowiedzialności zespołu. Na dole: ostatnia
          aktywność oraz kontekstowe Opportunities."

          Dokument mówi też, że układ dashboardu jest STAŁY przez wszystkie
          etapy — nie chowamy sekcji zależnie od Stage. Dlatego miejsca, które
          napełnią się dopiero w Execution, stoją tu od razu, ale **puste
          i podpisane**: mówią, czego będą dotyczyć i kiedy się odblokują.
          To nie jest fake UI — nie pokazują wymyślonych danych, tylko własną
          nieobecność. */}
      <div className="panels mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
        <NextActions actions={actions} />

        <div className="flex flex-col gap-3">
          <TeamPanel members={members} canManage={canEdit} />
          <LockedPanel
            icon={Target}
            title="Najbliższy cel"
            note="Cele (Goals) i ich terminy odblokowują się w Execution Stage."
          />
        </div>
      </div>

      <div className="panels mt-3 grid gap-3 md:grid-cols-2">
        <LockedPanel
          icon={History}
          title="Ostatnia aktywność"
          note="Log zmian w zespole pojawi się razem z trackerem w Execution Stage."
        />
        <LockedPanel
          icon={Sparkles}
          title="Możliwości"
          note="Programy, konkursy i partnerzy dopasowani do etapu — po MVP Stage."
        />
      </div>

      <p className="mt-4 text-[12.5px] text-[var(--text-faint)]">
        Taski, cele, dokumenty i workflow odblokują się po domknięciu Idea Stage.
      </p>
    </div>
  );
}

/**
 * Kto jest w zespole i z jakimi uprawnieniami.
 *
 * Guidelines wymagają na dashboardzie odpowiedzi na pytanie „kto za co
 * odpowiada". Dopóki nie ma Goals ani zadań, jedyna prawdziwa odpowiedź to
 * rola i stanowisko — i tyle pokazujemy. Dopisanie tu wymyślonych „3 zadania
 * w toku" byłoby liczbą bez pokrycia w bazie.
 */
function TeamPanel({
  members,
  canManage,
}: {
  members: TeamMember[];
  canManage: boolean;
}) {
  // Rząd awatarów zamiast listy wierszy — tak jak na dostarczonych mockupach.
  // Przy zespole do sześciu osób (a limit i tak jest niski) rząd twarzy czyta
  // się jednym spojrzeniem, a lista wymaga przebiegnięcia w dół. Pod każdą
  // twarzą stoi stanowisko albo rola, bo samo zdjęcie nie mówi, kto za co
  // odpowiada — a to jest pytanie, na które ten panel ma odpowiadać.
  const shown = members.slice(0, 6);
  const hidden = members.length - shown.length;

  return (
    <Card className="overflow-hidden">
      <CardBody className="pt-5">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--text-subtle)]">
            <Users className="size-3.5" />
            Zespół
          </p>
          <Link
            href="/app/team"
            className="inline-flex items-center gap-1 text-[12px] text-[var(--text-subtle)] underline-offset-2 transition-colors hover:text-white hover:underline"
          >
            {canManage ? "Zarządzaj" : "Zobacz"}
            <ChevronRight className="size-3.5" />
          </Link>
        </div>

        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-4">
          {shown.map((member) => (
            <li
              key={member.profileId}
              className="flex w-[64px] flex-col items-center text-center"
            >
              <Avatar src={member.avatarUrl} name={member.fullName} size="md" />
              <span className="mt-1.5 line-clamp-2 text-[11px] leading-tight text-[var(--text-subtle)]">
                {member.jobTitle ?? ROLE_LABELS[member.role]}
              </span>
            </li>
          ))}

          {hidden > 0 ? (
            <li className="flex w-[64px] flex-col items-center text-center">
              <span className="tabular inline-flex size-10 items-center justify-center rounded-full bg-white/[0.06] text-[13px] font-medium text-[var(--text-muted)]">
                +{hidden}
              </span>
              <span className="mt-1.5 text-[11px] leading-tight text-[var(--text-subtle)]">
                {plural(hidden, "osoba", "osoby", "osób")}
              </span>
            </li>
          ) : null}

          {/* „Otwarta rola" z mockupu — ale tylko dla kogoś, kto może ją
              dodać. Dla Członka byłby to przycisk prowadzący pod zamknięte
              drzwi. */}
          {canManage ? (
            <li className="flex w-[64px] flex-col items-center text-center">
              <Link
                href="/app/team"
                aria-label="Dodaj otwartą rolę"
                className="inline-flex size-10 items-center justify-center rounded-full border border-dashed border-white/20 text-[var(--text-subtle)] transition-colors hover:border-[var(--vairo)]/60 hover:text-white"
              >
                <Plus className="size-4" />
              </Link>
              <span className="mt-1.5 text-[11px] leading-tight text-[var(--text-subtle)]">
                Otwarta rola
              </span>
            </li>
          ) : null}
        </ul>
      </CardBody>
    </Card>
  );
}

/**
 * Miejsce, które jeszcze nie ma danych — i mówi to wprost.
 *
 * Guidelines wymagają stałego układu dashboardu przez wszystkie etapy, więc
 * te sekcje nie mogą pojawiać się i znikać. Zasada „zero fake UI" mówi z kolei,
 * że liczba bez pokrycia w bazie nie istnieje. Jedyne wyjście, które spełnia
 * oba warunki naraz: miejsce stoi, jest wyraźnie nieaktywne i **nazywa, czego
 * będzie dotyczyć oraz kiedy się odblokuje**. Nic tu nie udaje danych.
 */
function LockedPanel({
  icon: Icon,
  title,
  note,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  note: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/[0.09] px-5 py-4">
      <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--text-subtle)]">
        <Icon className="size-3.5" />
        {title}
        <Lock className="ml-auto size-3.5 text-[var(--text-faint)]" />
      </p>
      <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--text-faint)]">
        {note}
      </p>
    </div>
  );
}

/**
 * Mały panel z jedną liczbą.
 *
 * Liczba jest duża, podpis mały, a cały kafelek jest linkiem — bo liczba bez
 * możliwości pójścia dalej to tylko ciekawostka. Każda wartość pochodzi
 * z zapytania do bazy; panel, który nie ma czego pokazać, po prostu nie
 * dostaje danych i nie istnieje.
 */
function StatPanel({
  href,
  icon: Icon,
  label,
  value,
  hint,
  badge,
  progress,
  action,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  hint: string;
  badge?: string;
  progress?: number;
  /** Drugie wyjście z panelu — inne niż kliknięcie całego kafelka. */
  action?: { href: string; label: string };
}) {
  return (
    // Cały kafelek jest klikalny, ale NIE jest jednym linkiem — bo wtedy nie
    // dałoby się umieścić w nim drugiego. Rozwiązuje to link rozciągnięty na
    // całą powierzchnię (`absolute inset-0`), nad którym drugi link leży
    // wyżej w stosie. Zero JavaScriptu, więc panel zostaje komponentem
    // serwerowym.
    <div className="lift-hover group relative flex flex-col justify-between rounded-2xl border border-white/[0.07] bg-[var(--surface)] p-4 lift-1 hover:border-white/15 md:col-span-2">
      <Link href={href} className="absolute inset-0 rounded-2xl">
        <span className="sr-only">{label}</span>
      </Link>

      <p className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--text-faint)]">
        <Icon className="size-3.5" />
        {label}
      </p>

      <p className="mt-3 flex items-baseline gap-2">
        <span className="tabular font-heading text-[26px] font-semibold leading-none text-white">
          {value}
        </span>
        <span className="min-w-0 truncate text-[12.5px] text-[var(--text-subtle)]">
          {hint}
        </span>
      </p>

      {typeof progress === "number" ? (
        <span className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-white/8">
          <span
            className="grow-bar h-full rounded-full bg-[var(--vairo)]"
            style={{ width: `${progress}%` }}
          />
        </span>
      ) : null}

      {badge ? (
        <p className="mt-3 inline-flex items-center gap-1.5 self-start rounded-md bg-[var(--warning)]/12 px-2 py-1 text-[11.5px] text-[var(--warning)]">
          <AlertTriangle className="size-3" />
          {badge}
        </p>
      ) : null}

      {/* Drugie wyjście z panelu. Bez niego profil publiczny teamu był
          dostępny wyłącznie przez wejście w Team i znalezienie przycisku
          w nagłówku — czyli trzy kliknięcia do rzeczy, którą pokazuje się
          obcym. */}
      {action ? (
        <Link
          href={action.href}
          className="relative z-10 mt-3 inline-flex w-fit items-center gap-1 text-[12px] text-[var(--text-subtle)] underline-offset-2 transition-colors hover:text-white hover:underline"
        >
          {action.label}
          <ChevronRight className="size-3.5" />
        </Link>
      ) : null}
    </div>
  );
}

/**
 * „Co teraz" — jedyne miejsce na dashboardzie, które mówi wprost, co zrobić.
 *
 * Każda pozycja ma powód pod spodem. Bez niego lista brzmi jak polecenia
 * z systemu, a nie jak podpowiedź — a to jest różnica między „wiem, co robię"
 * i „coś ode mnie chcą".
 */
function NextActions({ actions }: { actions: NextAction[] }) {
  if (actions.length === 0) return null;

  return (
    // Najważniejsza karta na ekranie, więc jedyna z włosem akcentu na krawędzi.
    <Card className="edge-accent overflow-hidden">
      <CardBody className="pt-5">
        <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--text-subtle)]">
          <Target className="size-3.5" />
          Co teraz
        </p>

        {/* Kolejność pozycji jest informacją, więc pojawiają się po kolei —
            po 40 ms. Wzrok dostaje podpowiedź, od czego zacząć czytanie. */}
        <ul className="stagger mt-3 flex flex-col gap-1.5">
          {actions.map((action) => (
            <li key={action.key}>
              <Link
                href={action.href}
                // Wiersze miały kiedyś kolorowe wypełnienia zależne od tonu.
                // Przy pięciu pozycjach dawało to dwa–trzy pomarańczowe pasy
                // obok pomarańczowego przycisku — i nagle nic nie było
                // najważniejsze. Ton niesie teraz sama kropka: to wystarczy,
                // żeby odróżnić pilne od zwykłego, i nie zabiera akcji głównej
                // jej jedynego przywileju, czyli nasycenia.
                className="group flex items-start gap-3 rounded-xl px-3.5 py-3 transition-colors duration-150 hover:bg-white/[0.05]"
              >
                <span
                  className={cn(
                    "mt-[7px] size-1.5 shrink-0 rounded-full",
                    action.tone === "brand"
                      ? "bg-[var(--vairo)] ring-4 ring-[var(--vairo)]/15"
                      : action.tone === "warning"
                        ? "bg-[var(--warning)] ring-4 ring-[var(--warning)]/15"
                        : "bg-white/25"
                  )}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-medium text-white">
                    {action.title}
                  </span>
                  <span className="mt-0.5 block text-[12.5px] leading-relaxed text-[var(--text-subtle)]">
                    {action.why}
                  </span>
                </span>
                <ChevronRight className="mt-1 size-4 shrink-0 text-[var(--text-faint)] opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}

/**
 * Przeszkoda. Pokazujemy ją tylko wtedy, gdy wynika z danych — komunikat
 * „coś Cię blokuje" bez konkretu jest gorszy niż jego brak.
 */
function BlockerNote({ blocker }: { blocker: NonNullable<Blocker> }) {
  return (
    <div className="mt-3 flex items-start gap-3 rounded-2xl border border-[var(--warning)]/25 bg-[var(--warning)]/8 px-5 py-4">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--warning)]" />
      <div className="min-w-0">
        <p className="text-[14px] font-medium text-white">{blocker.title}</p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--text-muted)]">
          {blocker.why}
        </p>
      </div>
    </div>
  );
}
