import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, FileText } from "lucide-react";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { getActiveStartupId } from "@/lib/active-team";
import { getUserStartups, resolveActiveStartup } from "@/lib/startup";
import { currentProgramEntry, loadStageProgram, loadStageTree } from "@/lib/stage";
import { AnswerView } from "@/components/stage/answer-view";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { hasAnswer } from "@/types/stage";
import { canEditStageData } from "@/types/startup";
import { getT } from "@/i18n/server";

export async function generateMetadata() {
  const t = await getT("stage");
  return { title: t("summary.metaTitle") };
}
export const dynamic = "force-dynamic";

/**
 * Wszystko, co zespół ustalił w jednym etapie, w jednym kawałku.
 *
 * Po siedemdziesięciu kilku podpunktach człowiek ma komplet przemyśleń o swoim
 * startupie i — do tej pory — żadnego sposobu, żeby to zobaczyć razem ani
 * komukolwiek pokazać. Ten ekran zamyka etap poczuciem, że coś z niego
 * powstało, i jest tym samym miejscem, do którego prowadzi domknięcie Ambition.
 */
export default async function StageSummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; next?: string }>;
}) {
  const t = await getT("stage");
  const tc = await getT("common");
  const { stage: requestedStage, next } = await searchParams;

  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) redirect("/register?next=/app/stage/summary");

  const [startups, activeTeamId] = await Promise.all([
    getUserStartups(supabase, user.id),
    getActiveStartupId(),
  ]);
  const active = resolveActiveStartup(startups, activeTeamId);
  if (!active) redirect("/app");

  const program = await loadStageProgram(supabase, active.id);
  const entry =
    (requestedStage
      ? program.find((item) => item.key === requestedStage && item.hasContent)
      : null) ?? currentProgramEntry(program);

  const tree =
    entry?.startupStageId && entry.hasContent
      ? await loadStageTree(supabase, {
          startupStageId: entry.startupStageId,
          activeCategories: active.categories,
          role: active.role,
        })
      : null;

  if (!tree) {
    return (
      <div className="page">
        <EmptyState
          icon={FileText}
          title={t("summary.nothingTitle")}
          description={t("summary.nothingBody")}
          action={
            <Button href="/app/stage" variant="secondary">
              {t("summary.backToStage")}
            </Button>
          }
        />
      </div>
    );
  }

  // Do podsumowania bierzemy tylko to, na co ktoś odpowiedział. Lista pustych
  // pytań nie jest podsumowaniem, tylko drugą kopią formularza.
  const filled = tree.categories
    .map((category) => ({
      ...category,
      points: category.points
        .map((point) => ({
          ...point,
          subpoints: point.subpoints
            .map((subpoint) => ({
              ...subpoint,
              fields: subpoint.fields.filter((field) =>
                hasAnswer(tree.answers[field.answerKey])
              ),
            }))
            .filter((subpoint) => subpoint.fields.length > 0),
        }))
        .filter((point) => point.subpoints.length > 0),
    }))
    .filter((category) => category.points.length > 0);

  const goesToCategories = next === "categories";
  const canEdit = canEditStageData(active.role);

  return (
    <div className="page">
      <Link
        href="/app/stage"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-[var(--text-subtle)] transition-colors hover:text-white"
      >
        <ArrowLeft className="size-4" />
        {t("summary.backToStage")}
      </Link>

      <header className="rounded-2xl border border-[var(--vairo)]/25 bg-[var(--vairo)]/6 px-5 py-5 sm:px-6">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--vairo)]">
          {goesToCategories ? t("summary.firstOutline") : t("summary.eyebrow")}
        </p>
        <h1 className="mt-1.5 font-heading text-[1.5rem] font-semibold tracking-tight text-white">
          {goesToCategories
            ? t("summary.justDecided")
            : t("summary.allDecided", { stage: tree.title })}
        </h1>
        <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[var(--text-muted)]">
          {goesToCategories
            ? t("summary.justDecidedBody")
            : t("summary.allDecidedBody")}
        </p>

        <p className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white/8 px-3 py-1.5 text-[12.5px] text-[var(--text-muted)]">
          <Check className="size-3.5 text-[var(--success)]" />
          {t("summary.progress", { done: tree.done, total: tree.total })}
        </p>
      </header>

      {filled.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={FileText}
            title={t("summary.emptyTitle")}
            description={t("summary.emptyBody")}
            action={
              <Button href="/app/stage">{t("summary.backToStage")}</Button>
            }
          />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-8">
          {filled.map((category) => (
            <section key={category.id}>
              {tree.showCategories ? (
                <h2 className="mb-4 border-b border-white/[0.07] pb-2 font-heading text-[19px] font-semibold text-white">
                  {category.title}
                </h2>
              ) : null}

              <div className="flex flex-col gap-6">
                {category.points.map((point) => (
                  <article key={point.id}>
                    <h3 className="text-[12px] font-semibold uppercase tracking-wide text-[var(--vairo)]">
                      {point.title}
                    </h3>

                    <div className="mt-3 flex flex-col gap-5">
                      {point.subpoints.map((subpoint) => (
                        <div
                          key={subpoint.id}
                          className="rounded-2xl border border-white/[0.07] bg-[var(--surface)] px-5 py-4"
                        >
                          <p className="text-[14.5px] font-medium text-white">
                            {subpoint.title}
                          </p>
                          <div className="mt-3 flex flex-col gap-4">
                            {subpoint.fields.map((field) => (
                              <AnswerView
                                key={field.id}
                                field={field}
                                value={tree.answers[field.answerKey]}
                                answerHref={
                                  canEdit
                                    ? `/app/stage?stage=${tree.templateKey}&subpoint=${subpoint.id}`
                                    : null
                                }
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <footer className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/[0.07] bg-[var(--surface)] px-5 py-4">
        <p className="min-w-0 text-[13px] text-[var(--text-subtle)]">
          {goesToCategories
            ? t("summary.nextCategories")
            : t("summary.canChange")}
        </p>

        {/* Przycisk tylko tam, gdzie jest DALSZY krok. Przy zwykłym podglądzie
            „Wróć do etapu" stało tu jako czwarte wystąpienie tej samej akcji
            na jednym ekranie: link u góry, akcja w pustym stanie, zdanie
            w stopce i ten przycisk. Powtórzone wyjście nie jest ułatwieniem,
            tylko pytaniem, czym te cztery drogi się różnią. */}
        {goesToCategories ? (
          <Button href="/app/stage/categories" size="lg">
            {tc("actions.next")}
            <ArrowRight className="size-4" />
          </Button>
        ) : null}
      </footer>
    </div>
  );
}
