import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getActiveStartupId } from "@/lib/active-team";
import { getUserStartups, resolveActiveStartup } from "@/lib/startup";
import { currentProgramEntry, loadStageProgram, loadStageTree } from "@/lib/stage";
import { AnswerView } from "@/components/stage/answer-view";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { hasAnswer } from "@/types/stage";

export const metadata = { title: "Podsumowanie etapu — Vairo" };
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
  const { stage: requestedStage, next } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
          title="Nie ma jeszcze czego podsumować"
          description="Ten etap nie został otwarty albo nie ma wgranej treści."
          action={
            <Button href="/app/stage" variant="secondary">
              Wróć do etapu
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

  return (
    <div className="page">
      <Link
        href="/app/stage"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-[var(--text-subtle)] transition-colors hover:text-white"
      >
        <ArrowLeft className="size-4" />
        Wróć do etapu
      </Link>

      <header className="rounded-2xl border border-[var(--vairo)]/25 bg-[var(--vairo)]/6 px-5 py-5 sm:px-6">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--vairo)]">
          {goesToCategories ? "Masz pierwszy zarys projektu" : "Podsumowanie"}
        </p>
        <h1 className="mt-1.5 font-heading text-[1.5rem] font-semibold tracking-tight text-white">
          {goesToCategories
            ? "Oto, co właśnie zostało ustalone"
            : `${tree.title} — wszystko, co ustaliliście`}
        </h1>
        <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[var(--text-muted)]">
          {goesToCategories
            ? "To Twoje własne odpowiedzi, zebrane w jednym miejscu. Przeczytaj je na spokojnie — za chwilę dobierzemy do nich pytania w kolejnym etapie."
            : "Wszystkie odpowiedzi zespołu w jednym kawałku. Możesz to przeczytać, wydrukować albo pokazać komuś z zewnątrz."}
        </p>

        <p className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white/8 px-3 py-1.5 text-[12.5px] text-[var(--text-muted)]">
          <Check className="size-3.5 text-[var(--success)]" />
          {tree.done} z {tree.total} podpunktów uzupełnionych
        </p>
      </header>

      {filled.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={FileText}
            title="Nic jeszcze nie zostało uzupełnione"
            description="Wróć do etapu i odpowiedz na pierwsze pytanie — pojawi się tutaj od razu."
            action={
              <Button href="/app/stage">Wróć do etapu</Button>
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
            ? "Następny krok: powiemy Vairo, co budujesz i komu to sprzedajesz."
            : "Te odpowiedzi możesz zmieniać w każdej chwili."}
        </p>

        {/* Przycisk tylko tam, gdzie jest DALSZY krok. Przy zwykłym podglądzie
            „Wróć do etapu" stało tu jako czwarte wystąpienie tej samej akcji
            na jednym ekranie: link u góry, akcja w pustym stanie, zdanie
            w stopce i ten przycisk. Powtórzone wyjście nie jest ułatwieniem,
            tylko pytaniem, czym te cztery drogi się różnią. */}
        {goesToCategories ? (
          <Button href="/app/stage/categories" size="lg">
            Dalej
            <ArrowRight className="size-4" />
          </Button>
        ) : null}
      </footer>
    </div>
  );
}
