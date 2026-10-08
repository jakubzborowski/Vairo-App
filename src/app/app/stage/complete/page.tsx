import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CheckCircle2, Flag, ListTodo, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getActiveStartupId } from "@/lib/active-team";
import { loadOpenWork } from "@/lib/goals";
import { getUserStartups, resolveActiveStartup } from "@/lib/startup";
import { loadStageProgram } from "@/lib/stage";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";

export const metadata = { title: "Koniec programu — Vairo" };
export const dynamic = "force-dynamic";

/**
 * Ekran po domknięciu MVP Stage (§1C CTO).
 * Pokazuje zapisane wyniki i prostą ofertę dalszej współpracy — bez płatności.
 */
export default async function StageCompletePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/register?next=/app/stage/complete");

  const [startups, activeTeamId] = await Promise.all([
    getUserStartups(supabase, user.id),
    getActiveStartupId(),
  ]);
  const active = resolveActiveStartup(startups, activeTeamId);
  if (!active) redirect("/app");

  const program = await loadStageProgram(supabase, active.id);
  const mvp = program.find((item) => item.key === "mvp");
  if (!mvp || mvp.status !== "completed") {
    redirect("/app/stage");
  }

  const [{ count: completedGoals }, openWork] = await Promise.all([
    supabase
      .from("goals")
      .select("id", { count: "exact", head: true })
      .eq("startup_id", active.id)
      .eq("status", "completed")
      .is("archived_at", null),
    loadOpenWork(supabase, active.id, user.id),
  ]);

  const openGoals = openWork.goals.length;
  const openTasks = openWork.tasks.length;
  const contactUrl =
    process.env.NEXT_PUBLIC_MVP_CONTACT_URL?.trim() ||
    "mailto:hello@vairo.pl?subject=Dalsza%20wsp%C3%B3%C5%82praca%20po%20MVP%20Stage";

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="text-center">
        <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-[var(--success)]/15 text-[var(--success)]">
          <CheckCircle2 className="size-7" strokeWidth={1.5} />
        </span>
        <h1 className="mt-4 font-heading text-[1.6rem] font-semibold text-white">
          Program Vairo jest domknięty
        </h1>
        <p className="mx-auto mt-2 max-w-lg text-[14px] leading-relaxed text-[var(--text-muted)]">
          Ukończenie MVP Stage nie oznacza potwierdzonego sukcesu firmy. To zapis
          tego, co zespół zbudował, sprawdził i poprawił — oraz punkt startu do
          dalszej pracy.
        </p>
      </div>

      <Card className="mt-8">
        <CardBody className="flex flex-col gap-4 pt-5">
          <p className="text-[12px] font-medium tracking-wide text-[var(--text-faint)] uppercase">
            Co zostało z programu
          </p>
          <ul className="flex flex-col gap-3">
            <li className="flex items-start gap-3 text-[14px] text-[var(--text-muted)]">
              <Flag className="mt-0.5 size-4 shrink-0 text-[var(--vairo)]" />
              <span>
                <span className="text-white">{completedGoals ?? 0}</span> ukończonych
                celów z dowodem
              </span>
            </li>
            <li className="flex items-start gap-3 text-[14px] text-[var(--text-muted)]">
              <ListTodo className="mt-0.5 size-4 shrink-0 text-[var(--vairo)]" />
              <span>
                Otwarte u Ciebie:{" "}
                <span className="text-white">{openGoals}</span>{" "}
                {openGoals === 1 ? "cel" : "cele"} ·{" "}
                <span className="text-white">{openTasks}</span>{" "}
                {openTasks === 1 ? "zadanie" : "zadania"}
              </span>
            </li>
          </ul>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button href="/app/stage/summary?stage=mvp" variant="secondary">
              Pełne odpowiedzi MVP Stage
            </Button>
            <Button href="/app/goals" variant="ghost">
              Otwórz tracker
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card className="mt-4">
        <CardBody className="pt-5">
          <p className="text-[12px] font-medium tracking-wide text-[var(--text-faint)] uppercase">
            Co dalej
          </p>
          <h2 className="mt-2 font-heading text-[1.15rem] font-semibold text-white">
            Dalsze prowadzenie w Vairo
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-[var(--text-muted)]">
            Możemy pomóc utrzymać rytm: kolejne cele, pierwsze skalowanie albo
            rozmowa o Premium. Cennik, udziały i płatności są poza tym ekranem —
            tu tylko umawiasz kontakt. Zapisane wyniki i materiały zostają w
            workspace.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {contactUrl.startsWith("/") ? (
              <Button href={contactUrl}>
                <MessageCircle className="size-4" />
                Porozmawiaj o współpracy
              </Button>
            ) : (
              <a
                href={contactUrl}
                className="relative inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--vairo-strong)] px-4 py-2.5 text-[14px] font-medium text-white shadow-[0_2px_12px_rgba(238,95,28,.25)] transition-[background-color,transform] duration-150 hover:bg-[var(--vairo)] active:scale-[.98]"
              >
                <MessageCircle className="size-4" />
                Porozmawiaj o współpracy
              </a>
            )}
            <Button href="/app" variant="secondary">
              Wróć na Start
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </CardBody>
      </Card>

      <p className="mt-6 text-center text-[12.5px] text-[var(--text-faint)]">
        Tracker, team i pliki działają jak wcześniej.{" "}
        <Link href="/app/program" className="text-[var(--text-subtle)] underline-offset-2 hover:text-white hover:underline">
          Zobacz cały program
        </Link>
        .
      </p>
    </div>
  );
}
