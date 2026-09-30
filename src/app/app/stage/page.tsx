import { redirect } from "next/navigation";
import { CalendarClock, Database, Rocket, SkipForward } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserStartups, resolveActiveStartup } from "@/lib/startup";
import { getActiveStartupId } from "@/lib/active-team";
import {
  currentProgramEntry,
  ensureStartupStage,
  loadStageProgram,
  loadStageTree,
} from "@/lib/stage";
import { StageScreen } from "@/components/stage/stage-screen";
import { openStage } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { canEditStageData } from "@/types/startup";

export const metadata = { title: "Etap startupu — Vairo" };
export const dynamic = "force-dynamic";

/**
 * `?stage=<key>` pozwala wrocic do domknietego etapu. Strony — inaczej niz
 * layouty — dostaja searchParams, wiec tutaj mozemy na nim polegac.
 */
export default async function StagePage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const { stage: requestedStage } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/register?next=/app/stage");
  }

  const [startups, activeTeamId] = await Promise.all([
    getUserStartups(supabase, user.id),
    getActiveStartupId(),
  ]);
  const active = resolveActiveStartup(startups, activeTeamId);

  if (!active) {
    redirect("/app");
  }

  const program = await loadStageProgram(supabase, active.id);

  if (program.length === 0) {
    return (
      <div className="page">
        <EmptyState
          icon={Database}
          title="Treść etapów nie jest jeszcze wgrana"
          description="Migracje 005–008 tworzą silnik etapów i wgrywają treść Ambition oraz Idea Stage. Odpal je w Supabase → SQL Editor, a ten ekran zacznie działać."
          action={
            <Button href="/app" variant="secondary">
              Wróć na dashboard
            </Button>
          }
        />
      </div>
    );
  }

  const requested = requestedStage
    ? program.find((item) => item.key === requestedStage && item.hasContent)
    : null;
  const entry = requested ?? currentProgramEntry(program);

  // Etap bez treści = szkielet (Preparation, Execution, MVP). Mówimy to wprost,
  // zamiast pokazywać puste kolumny albo udawać, że coś się da tu zrobić.
  if (!entry || !entry.hasContent) {
    const done = program.filter((item) => item.status === "completed");

    return (
      <div className="page">
        <Card>
          <CardBody className="pt-6 text-center">
            <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-[var(--vairo)]/12 text-[var(--vairo)]">
              <CalendarClock className="size-6" strokeWidth={1.5} />
            </span>
            <h1 className="mt-4 font-heading text-[1.4rem] font-semibold text-white">
              {entry ? entry.title : "Kolejny etap"} — w przygotowaniu
            </h1>
            <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-[var(--text-muted)]">
              {entry?.intro ??
                "Ten etap jest już w programie, ale nie ma jeszcze wgranych pytań."}
            </p>
            {done.length > 0 ? (
              <p className="mt-4 text-[13px] text-[var(--text-subtle)]">
                Domknięte etapy:{" "}
                <span className="text-white">
                  {done.map((item) => item.title).join(", ")}
                </span>
                . Możesz do nich wrócić i poprawić odpowiedzi.
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {done.length > 0 ? (
                <Button href={`/app/stage?stage=${done.at(-1)!.key}`} variant="secondary">
                  Przejrzyj {done.at(-1)!.title}
                </Button>
              ) : null}
              <Button href="/app" variant="ghost">
                Wróć na dashboard
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Etap wskazany jawnie (`?stage=`), którego nikt nigdy nie otwierał —
  // czyli pominięty. NIE zakładamy go od samego wejścia: wcześniej kliknięcie
  // w pominięty Ambition zakładało instancję i program „cofał się" do niego.
  // Otwarcie etapu to decyzja, więc pytamy o nią wprost.
  if (requested && !requested.startupStageId) {
    const current = currentProgramEntry(program);
    const canOpen = canEditStageData(active.role);

    return (
      <div className="page">
        <Card>
          <CardBody className="pt-6 text-center">
            <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-white/6 text-[var(--text-subtle)]">
              <SkipForward className="size-6" strokeWidth={1.5} />
            </span>
            <h1 className="mt-4 font-heading text-[1.4rem] font-semibold text-white">
              {requested.title} został pominięty
            </h1>
            <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-[var(--text-muted)]">
              Ten startup zaczął się od gotowego pomysłu, więc Vairo przeskoczyło ten etap.
              {requested.subtitle ? ` ${requested.subtitle}.` : ""}{" "}
              Możesz go uzupełnić, ale <strong>nie musisz</strong> — nie blokuje
              tego, co robisz teraz.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {canOpen ? (
                <form action={openStage}>
                  <input type="hidden" name="stage_key" value={requested.key} />
                  <Button type="submit" variant="secondary">
                    Uzupełnij mimo to
                  </Button>
                </form>
              ) : null}

              {current && current.key !== requested.key ? (
                <Button href="/app/stage">Wróć do {current.title}</Button>
              ) : (
                <Button href="/app">Wróć na dashboard</Button>
              )}
            </div>

            {!canOpen ? (
              <p className="mt-4 text-[12.5px] text-[var(--text-subtle)]">
                Pominięty etap może otworzyć Founder albo Admin.
              </p>
            ) : null}
          </CardBody>
        </Card>
      </div>
    );
  }

  // Wiersz instancji zakładamy dopiero tutaj — i tylko dla etapu z treścią,
  // do którego program doszedł normalną drogą. Członek bez prawa zapisu nie
  // może go założyć, więc dla niego czekamy, aż zrobi to ktoś z Founderów.
  const stageId =
    entry.startupStageId ??
    (await ensureStartupStage(supabase, active.id, entry.key));

  if (!stageId) {
    return (
      <div className="page">
        <EmptyState
          icon={Rocket}
          title="Etap nie jest jeszcze otwarty"
          description="Founder lub Admin musi wejść w ten etap jako pierwszy. Potem zobaczysz tu wszystko, co zespół uzupełnił."
          action={
            <Button href="/app" variant="secondary">
              Wróć na dashboard
            </Button>
          }
        />
      </div>
    );
  }

  const tree = await loadStageTree(supabase, {
    startupStageId: stageId,
    activeCategories: active.categories,
    role: active.role,
  });

  if (!tree || tree.total === 0) {
    return (
      <div className="page">
        <EmptyState
          icon={Rocket}
          title="Ten etap nie ma jeszcze treści"
          description="Struktura jest gotowa, ale nie wgrano do niej pytań. Uruchom migrację z treścią etapu."
          action={
            <Button href="/app" variant="secondary">
              Wróć na dashboard
            </Button>
          }
        />
      </div>
    );
  }

  const current = currentProgramEntry(program);

  return (
    <StageScreen
      tree={tree}
      role={active.role}
      isCurrent={current?.key === entry.key}
      currentTitle={current?.title ?? null}
    />
  );
}
