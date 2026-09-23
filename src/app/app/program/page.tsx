import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Check, Circle, Minus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getActiveStartupId } from "@/lib/active-team";
import { getUserStartups, resolveActiveStartup } from "@/lib/startup";
import { currentProgramEntry, loadStageProgram } from "@/lib/stage";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = { title: "Jak działa Vairo — Vairo" };
export const dynamic = "force-dynamic";

/**
 * „Co to w ogóle jest i jak to działa".
 *
 * Do tej pory nigdzie w aplikacji nie było odpowiedzi na to pytanie — ani
 * w onboardingu, ani po zalogowaniu. Ktoś, kto pierwszy raz słyszy o walidacji
 * pomysłu, dostawał od razu pasek pięciu etapów i musiał się domyślać.
 *
 * Treść etapów czytamy z bazy, nie z kodu — jeden etap dopisany migracją
 * pojawia się tu sam, razem z właściwym opisem.
 */
export default async function ProgramPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/register?next=/app/program");

  const [startups, activeTeamId] = await Promise.all([
    getUserStartups(supabase, user.id),
    getActiveStartupId(),
  ]);
  const active = resolveActiveStartup(startups, activeTeamId);

  // Bez teamu pokazujemy sam program, bez znaczników postępu — opis etapów
  // jest wtedy tak samo potrzebny, tylko nie ma czego zaznaczać.
  const program = await loadStageProgram(supabase, active?.id ?? null);
  const current = active ? currentProgramEntry(program) : null;
  const currentIndex = program.findIndex((item) => item.key === current?.key);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Link
        href="/app"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-[var(--text-subtle)] transition-colors hover:text-white"
      >
        <ArrowLeft className="size-4" />
        Wróć na dashboard
      </Link>

      <header>
        <h1 className="font-heading text-[1.65rem] font-semibold tracking-tight text-white">
          Jak działa Vairo
        </h1>
        <p className="mt-2 max-w-xl text-[14.5px] leading-relaxed text-[var(--text-muted)]">
          Vairo prowadzi startup przez pięć etapów — od pierwszego pomysłu do
          wypuszczenia produktu. Każdy etap to zestaw pytań i podpowiedzi;
          odpowiadasz własnymi słowami, a Vairo pilnuje kolejności i tego, czego
          jeszcze brakuje.
        </p>
        <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[var(--text-subtle)]">
          Nie musisz się na niczym znać przed startem. Nie ma złych odpowiedzi
          ani punktów za szybkość — wszystko zapisuje się na bieżąco i wszystko
          da się później poprawić.
        </p>
      </header>

      <ol className="mt-8 flex flex-col">
        {program.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 px-5 py-6 text-center text-[13px] text-[var(--text-subtle)]">
            Treść etapów nie jest jeszcze wgrana do bazy.
          </p>
        ) : null}

        {program.map((item, index) => {
          const isDone = item.status === "completed";
          const isCurrent = index === currentIndex;
          const isOpen = item.status === "in_progress" && !isCurrent;
          const isSkipped =
            item.status === "not_started" &&
            currentIndex >= 0 &&
            index < currentIndex;
          const isLast = index === program.length - 1;

          return (
            <li key={item.key} className="flex gap-4">
              {/* Oś czasu: kropka plus kreska do następnego etapu. */}
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "inline-flex size-8 shrink-0 items-center justify-center rounded-full border",
                    isDone
                      ? "border-[var(--success)] bg-[var(--success)] text-black"
                      : isCurrent
                        ? "border-[var(--vairo)] bg-[var(--vairo)]/15 text-[var(--vairo)]"
                        : "border-white/15 text-[var(--text-faint)]"
                  )}
                >
                  {isDone ? (
                    <Check className="size-4" strokeWidth={3} />
                  ) : isSkipped ? (
                    <Minus className="size-4" />
                  ) : (
                    <Circle className="size-2.5 fill-current" />
                  )}
                </span>
                {!isLast ? (
                  <span
                    className={cn(
                      "w-px flex-1",
                      isDone ? "bg-[var(--success)]/40" : "bg-white/10"
                    )}
                  />
                ) : null}
              </div>

              <div className={cn("min-w-0 flex-1", isLast ? "pb-0" : "pb-8")}>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-heading text-[18px] font-semibold text-white">
                    {item.title}
                  </h2>
                  {isCurrent ? (
                    <span className="rounded-md bg-[var(--vairo)]/15 px-2 py-0.5 text-[11.5px] font-medium text-[var(--vairo)]">
                      tu jesteś
                    </span>
                  ) : isDone ? (
                    <span className="rounded-md bg-[var(--success)]/15 px-2 py-0.5 text-[11.5px] font-medium text-[var(--success)]">
                      domknięty
                    </span>
                  ) : isOpen ? (
                    <span className="rounded-md bg-white/8 px-2 py-0.5 text-[11.5px] font-medium text-white">
                      otwarty
                    </span>
                  ) : isSkipped ? (
                    <span className="rounded-md bg-white/8 px-2 py-0.5 text-[11.5px] font-medium text-[var(--text-subtle)]">
                      pominięty
                    </span>
                  ) : null}
                  {!item.hasContent ? (
                    <span className="rounded-md bg-white/8 px-2 py-0.5 text-[11.5px] text-[var(--text-faint)]">
                      w przygotowaniu
                    </span>
                  ) : null}
                </div>

                {item.subtitle ? (
                  <p className="mt-0.5 text-[13.5px] text-[var(--text-subtle)]">
                    {item.subtitle}
                  </p>
                ) : null}
                {item.intro ? (
                  <p className="mt-2 text-[14px] leading-relaxed text-[var(--text-muted)]">
                    {item.intro}
                  </p>
                ) : null}

                {isCurrent && item.hasContent ? (
                  <Button href="/app/stage" size="sm" className="mt-3">
                    Przejdź do tego etapu
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      <section className="mt-8 rounded-2xl border border-white/[0.07] bg-[var(--surface)] px-5 py-4">
        <h2 className="text-[15px] font-semibold text-white">
          Nie musisz robić tego sam
        </h2>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--text-muted)]">
          Równolegle do etapów działa warstwa Social: znajdujesz tam ludzi do
          zespołu albo projekt, do którego chcesz dołączyć. Jedno konto może
          należeć do trzech teamów naraz.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button href="/app/social/discover" variant="secondary" size="sm">
            Odkrywaj
          </Button>
          <Button href="/app/social/me" variant="ghost" size="sm">
            Mój profil publiczny
          </Button>
        </div>
      </section>

      <p className="mt-5 text-[12.5px] leading-relaxed text-[var(--text-faint)]">
        Etapy oznaczone „w przygotowaniu” są już w programie, ale nie mają
        jeszcze wgranych pytań. Nie blokują niczego, co robisz wcześniej.
      </p>
    </div>
  );
}
