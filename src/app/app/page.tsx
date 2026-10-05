import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronRight,
  Compass,
  Eye,
  HelpCircle,
  Lock,
  Minus,
  Rocket,
  Target,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserStartups, resolveActiveStartup } from "@/lib/startup";
import { getActiveStartupId } from "@/lib/active-team";
import { currentProgramEntry, loadStageProgram } from "@/lib/stage";
import { loadNextActions, type Blocker, type NextAction } from "@/lib/next-actions";
import { isExecutionUnlocked } from "@/lib/goals";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ROLE_LABELS, canEditStageData } from "@/types/startup";
import type { StageProgramEntry } from "@/lib/stage";

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
    .select("full_name")
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
      <div className="mx-auto w-full max-w-4xl">
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
  const canEdit = canEditStageData(active.role);

  const { error: dueError } = await supabase.rpc("notify_upcoming_deadlines", {
    p_startup_id: active.id,
  });
  if (dueError && !dueError.message.includes("notify_upcoming_deadlines")) {
    console.error("[notify_upcoming_deadlines]", dueError.message);
  }

  const { actions, blocker } = await loadNextActions(supabase, {
    userId: user.id,
    active,
    program,
    current,
  });
  const trackerOpen = await isExecutionUnlocked(supabase, active.id);

  return (
    <div className="mx-auto w-full max-w-5xl">
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

      <StageBar program={program} currentKey={current?.key ?? null} />

      {program.some((item) => item.key === "mvp" && item.status === "completed") ? (
        <Card className="mt-4">
          <CardBody className="pt-5">
            <h2 className="font-heading text-[18px] font-semibold text-white">
              Program jest domknięty
            </h2>
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[var(--text-muted)]">
              Wyniki, cele i materiały zostają do odczytu. Dalsze prowadzenie po MVP
              Stage to osobna rozmowa o współpracy. Ukończenie programu nie oznacza,
              że firma jest już potwierdzonym sukcesem.
            </p>
          </CardBody>
        </Card>
      ) : null}

      <p className="mt-2">
        <Link
          href="/app/program"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--text-subtle)] underline-offset-2 transition-colors hover:text-white hover:underline"
        >
          <HelpCircle className="size-3.5" />
          Jak działa program?
        </Link>
      </p>

      {stage ? (
        <Card className="mt-4">
          <CardBody className="pt-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">
                  {stage.status === "completed" ? "Etap domknięty" : "Bieżący etap"}
                </p>
                <h2 className="mt-1 font-heading text-[20px] font-semibold text-white">
                  {stage.title}
                </h2>
                <p className="mt-1.5 text-[13.5px] text-[var(--text-muted)]">
                  {stage.status === "completed"
                    ? canEdit
                      ? "Możesz tu wrócić i poprawić odpowiedzi."
                      : "Możesz przejrzeć wszystko, co zespół uzupełnił."
                    : `Uzupełnione ${stage.done} z ${stage.total} podpunktów.`}
                </p>
              </div>
              <Button href="/app/stage">
                {stage.status === "completed" || !canEdit ? "Przejrzyj" : "Kontynuuj"}
                <ArrowRight className="size-4" />
              </Button>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-[var(--vairo)] transition-[width] duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          </CardBody>
        </Card>
      ) : null}

      <NextActions actions={actions} />

      {blocker ? <BlockerNote blocker={blocker} /> : null}

      <p className="mt-4 text-[12.5px] text-[var(--text-faint)]">
        {trackerOpen ? (
          <>
            <Link href="/app/goals" className="text-[var(--text-subtle)] underline-offset-2 hover:text-white hover:underline">
              Otwórz tracker celów
            </Link>
            . Przypisania, terminy i dowody są osobnym narzędziem — układ tej strony zostaje taki sam.
          </>
        ) : (
          "Tracker celów otworzy się po domknięciu Preparation."
        )}
      </p>
    </div>
  );
}


/**
 * Pasek etapów.
 *
 * Cztery stany, nie trzy. Etap pominięty (founder, który wszedł z gotowym
 * pomysłem, przeskakuje Ambition) nie może wyglądać jak zablokowany — kłódka
 * PRZED bieżącym etapem czyta się jak awaria. Domknięte i pominięte etapy są
 * klikalne, bo do obu wolno wrócić.
 */
function StageBar({
  program,
  currentKey,
}: {
  program: StageProgramEntry[];
  currentKey: string | null;
}) {
  const currentIndex = program.findIndex((item) => item.key === currentKey);

  return (
    <div className="mt-6 flex flex-wrap items-center gap-1.5">
      {program.map((item, index) => {
        const isCurrent = index === currentIndex;
        const isDone = item.status === "completed";
        // Etap otwarty, ale nie bieżący: ktoś do niego wrócił albo otworzył
        // go z własnej woli. To NIE to samo co pominięty.
        const isOpen = item.status === "in_progress" && !isCurrent;
        const isSkipped =
          item.status === "not_started" &&
          currentIndex >= 0 &&
          index < currentIndex;
        const isLocked = !isDone && !isCurrent && !isOpen && !isSkipped;

        const label = (
          <>
            {isDone ? (
              <Check className="size-3.5" strokeWidth={2.5} />
            ) : isSkipped ? (
              <Minus className="size-3.5" />
            ) : isLocked ? (
              <Lock className="size-3" />
            ) : null}
            {item.title}
          </>
        );

        const className = cn(
          "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
          isCurrent && "bg-[var(--vairo)]/12 text-[var(--vairo)]",
          isDone && !isCurrent && "bg-[var(--success)]/10 text-[var(--success)]",
          isOpen && "text-white ring-1 ring-inset ring-white/15",
          isSkipped && "text-[var(--text-subtle)] ring-1 ring-inset ring-white/10",
          isLocked && "text-[var(--text-faint)]"
        );

        // Do etapu bez treści nie ma po co wchodzić — tam czeka tylko ekran
        // „w przygotowaniu".
        if (item.hasContent && (isDone || isSkipped || isOpen)) {
          return (
            <Link
              key={item.key}
              href={`/app/stage?stage=${item.key}`}
              title={
                isSkipped
                  ? "Etap pominięty — możesz go uzupełnić, ale nie musisz"
                  : isOpen
                    ? "Etap otwarty — możesz do niego wrócić"
                    : "Etap domknięty — możesz przejrzeć odpowiedzi"
              }
              className={cn(className, "hover:bg-white/[0.06] hover:text-white")}
            >
              {label}
            </Link>
          );
        }

        return (
          <div
            key={item.key}
            title={
              item.hasContent
                ? undefined
                : "Etap jest w programie, treść jeszcze w przygotowaniu"
            }
            className={className}
          >
            {label}
          </div>
        );
      })}
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
    <Card className="mt-4">
      <CardBody className="pt-5">
        <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">
          <Target className="size-3.5" />
          Co teraz
        </p>

        <ul className="mt-3 flex flex-col gap-1.5">
          {actions.map((action) => (
            <li key={action.key}>
              <Link
                href={action.href}
                className={cn(
                  "group flex items-start gap-3 rounded-xl px-3.5 py-3 transition-colors",
                  action.tone === "brand"
                    ? "bg-[var(--vairo)]/8 hover:bg-[var(--vairo)]/12"
                    : action.tone === "warning"
                      ? "bg-[var(--warning)]/8 hover:bg-[var(--warning)]/12"
                      : "hover:bg-white/[0.05]"
                )}
              >
                <span
                  className={cn(
                    "mt-[7px] size-1.5 shrink-0 rounded-full",
                    action.tone === "brand"
                      ? "bg-[var(--vairo)]"
                      : action.tone === "warning"
                        ? "bg-[var(--warning)]"
                        : "bg-white/30"
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
    <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[var(--warning)]/25 bg-[var(--warning)]/8 px-5 py-4">
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
