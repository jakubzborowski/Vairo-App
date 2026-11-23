import { redirect } from "next/navigation";
import { CalendarClock, Database, Rocket, SkipForward } from "lucide-react";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { getUserStartups, resolveActiveStartup } from "@/lib/startup";
import { getActiveStartupId } from "@/lib/active-team";
import {
  currentProgramEntry,
  ensureStartupStage,
  loadStageProgram,
  loadStageTree,
} from "@/lib/stage";
import { StageScreen } from "@/components/stage/stage-screen";
import { AiProvider } from "@/components/ai/ai-context";
import { advanceSkeletonStage, openStage } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { canEditStageData, canManageTeam } from "@/types/startup";
import { getActiveInviteLink } from "@/lib/invites";
import { getT } from "@/i18n/server";

export async function generateMetadata() {
  const t = await getT("stage");
  return { title: t("page.metaTitle") };
}
export const dynamic = "force-dynamic";

/**
 * `?stage=<key>` pozwala wrocic do domknietego etapu. Strony — inaczej niz
 * layouty — dostaja searchParams, wiec tutaj mozemy na nim polegac.
 */
export default async function StagePage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; subpoint?: string }>;
}) {
  const t = await getT("stage");
  const tc = await getT("common");
  const { stage: requestedStage, subpoint } = await searchParams;
  const supabase = await createClient();
  const user = await getCurrentUser();

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
          title={t("page.noContentTitle")}
          description={t("page.noContentBody")}
          action={
            <Button href="/app" variant="secondary">
              {tc("backToDashboard")}
            </Button>
          }
        />
      </div>
    );
  }

  const current = currentProgramEntry(program);
  // Wolno wejść w etap rozpoczęty albo leżący PRZED bieżącym (pominięty).
  // Etap z przyszłości z ręcznie wpisanego `?stage=` pokazywał ekran
  // „pominięty" z „Uzupełnij mimo to" — a to zakładało instancję i program
  // przeskakiwał etapy po drodze. Taki adres prowadzi do bieżącego.
  const requested = requestedStage
    ? (program.find(
        (item) =>
          item.key === requestedStage &&
          item.hasContent &&
          (item.startupStageId !== null ||
            (current !== null && item.position < current.position))
      ) ?? null)
    : null;
  const entry = requested ?? current;

  // Etap bez treści = szkielet. Mówimy to wprost, zamiast pokazywać puste
  // kolumny. Gdy poprzedni etap jest domknięty, Founder/Admin może przejść
  // dalej przyciskiem finish_label (np. Execution → MVP).
  if (!entry || !entry.hasContent) {
    const done = program.filter((item) => item.status === "completed");
    const entryIndex = entry ? program.findIndex((item) => item.key === entry.key) : -1;
    const previous =
      entryIndex > 0
        ? program[entryIndex - 1]
        : done.length > 0
          ? done.at(-1)!
          : null;
    const previousDone = previous?.status === "completed";
    const canAdvance =
      Boolean(entry) &&
      previousDone &&
      entry!.status !== "completed" &&
      canEditStageData(active.role);
    const nextWithContent = entry
      ? program.find(
          (item) => item.position > entry.position && item.hasContent
        )
      : null;

    return (
      <div className="page">
        <Card>
          <CardBody className="pt-6 text-center">
            <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-[var(--vairo)]/12 text-[var(--vairo)]">
              <CalendarClock className="size-6" strokeWidth={1.5} />
            </span>
            <h1 className="mt-4 font-heading text-[1.4rem] font-semibold text-white">
              {t("page.preparing", { stage: entry ? entry.title : t("page.nextStage") })}
            </h1>
            <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-[var(--text-muted)]">
              {entry?.intro ??
                t("page.noQuestions")}
            </p>
            {done.length > 0 ? (
              <p className="mt-4 text-[13px] text-[var(--text-subtle)]">
                {t("page.closedStages")}{" "}
                <span className="text-white">
                  {done.map((item) => item.title).join(", ")}
                </span>
                . {t("page.closedStagesHint")}
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {canAdvance && entry ? (
                <form action={advanceSkeletonStage}>
                  <input type="hidden" name="stage_key" value={entry.key} />
                  <Button type="submit">
                    {entry.finishLabel ??
                      (nextWithContent
                        ? t("page.goTo", { stage: nextWithContent.title })
                        : t("page.goOn"))}
                  </Button>
                </form>
              ) : null}
              {done.length > 0 ? (
                <Button href={`/app/stage?stage=${done.at(-1)!.key}`} variant="secondary">
                  {t("page.review", { stage: done.at(-1)!.title })}
                </Button>
              ) : null}
              <Button href="/app" variant="ghost">
                {tc("backToDashboard")}
              </Button>
            </div>
            {canAdvance && nextWithContent ? (
              <p className="mt-4 text-[12.5px] text-[var(--text-subtle)]">
                {t("page.skeletonHint", { stage: nextWithContent.title })}
              </p>
            ) : null}
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
    const canOpen = canEditStageData(active.role);

    return (
      <div className="page">
        <Card>
          <CardBody className="pt-6 text-center">
            <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-white/6 text-[var(--text-subtle)]">
              <SkipForward className="size-6" strokeWidth={1.5} />
            </span>
            <h1 className="mt-4 font-heading text-[1.4rem] font-semibold text-white">
              {t("page.skippedTitle", { stage: requested.title })}
            </h1>
            <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-[var(--text-muted)]">
              {t("page.skippedBody")}
              {requested.subtitle ? ` ${requested.subtitle}.` : ""}{" "}
              {t("page.skippedOptional")}
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {canOpen ? (
                <form action={openStage}>
                  <input type="hidden" name="stage_key" value={requested.key} />
                  <Button type="submit" variant="secondary">
                    {t("page.fillAnyway")}
                  </Button>
                </form>
              ) : null}

              {current && current.key !== requested.key ? (
                <Button href="/app/stage">{t("screen.backTo", { stage: current.title })}</Button>
              ) : (
                <Button href="/app">{tc("backToDashboard")}</Button>
              )}
            </div>

            {!canOpen ? (
              <p className="mt-4 text-[12.5px] text-[var(--text-subtle)]">
                {t("page.skippedManagers")}
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
          title={t("page.notOpenTitle")}
          description={t("page.notOpenBody")}
          action={
            <Button href="/app" variant="secondary">
              {tc("backToDashboard")}
            </Button>
          }
        />
      </div>
    );
  }

  // Zachęta do zaproszenia (Idea i punkt o pomocy w Preparation) potrzebuje
  // tylko liczby osób i tego, czy link już czeka — razem z drzewem etapu.
  const canInvite = canManageTeam(active.role);
  const [tree, { count: memberCount }, inviteLink] = await Promise.all([
    loadStageTree(supabase, {
      startupStageId: stageId,
      activeCategories: active.categories,
      role: active.role,
    }),
    supabase
      .from("startup_members")
      .select("profile_id", { count: "exact", head: true })
      .eq("startup_id", active.id),
    canInvite ? getActiveInviteLink(supabase, active.id) : Promise.resolve(null),
  ]);

  if (!tree || tree.total === 0) {
    return (
      <div className="page">
        <EmptyState
          icon={Rocket}
          title={t("page.emptyTitle")}
          description={t("page.emptyBody")}
          action={
            <Button href="/app" variant="secondary">
              {tc("backToDashboard")}
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <AiProvider enabled={Boolean(process.env.ANTHROPIC_API_KEY)}>
      <StageScreen
        tree={tree}
        role={active.role}
        isCurrent={current?.key === entry.key}
        currentTitle={current?.title ?? null}
        initialSubpointId={subpoint ?? null}
        team={{
          canInvite,
          members: memberCount ?? 1,
          hasLink: Boolean(inviteLink && inviteLink.useCount === 0),
        }}
      />
    </AiProvider>
  );
}
