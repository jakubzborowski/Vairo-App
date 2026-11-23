import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CheckCircle2, Flag, ListTodo, MessageCircle } from "lucide-react";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { getActiveStartupId } from "@/lib/active-team";
import { loadOpenWork } from "@/lib/goals";
import { getUserStartups, resolveActiveStartup } from "@/lib/startup";
import { loadStageProgram } from "@/lib/stage";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { getT } from "@/i18n/server";

export async function generateMetadata() {
  const t = await getT("stage");
  return { title: t("complete.metaTitle") };
}
export const dynamic = "force-dynamic";

/**
 * Ekran po domknięciu MVP Stage (§1C CTO).
 * Pokazuje zapisane wyniki i prostą ofertę dalszej współpracy — bez płatności.
 */
export default async function StageCompletePage() {
  const t = await getT("stage");
  const tc = await getT("common");
  const supabase = await createClient();
  const user = await getCurrentUser();
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
          {t("complete.title")}
        </h1>
        <p className="mx-auto mt-2 max-w-lg text-[14px] leading-relaxed text-[var(--text-muted)]">
          {t("complete.body")}
        </p>
      </div>

      <Card className="mt-8">
        <CardBody className="flex flex-col gap-4 pt-5">
          <p className="text-[12px] font-medium tracking-wide text-[var(--text-subtle)] uppercase">
            {t("complete.whatRemains")}
          </p>
          <ul className="flex flex-col gap-3">
            <li className="flex items-start gap-3 text-[14px] text-[var(--text-muted)]">
              <Flag className="mt-0.5 size-4 shrink-0 text-[var(--vairo)]" />
              <span>
                {t("complete.goalsWithProof", { count: completedGoals ?? 0 })}
              </span>
            </li>
            <li className="flex items-start gap-3 text-[14px] text-[var(--text-muted)]">
              <ListTodo className="mt-0.5 size-4 shrink-0 text-[var(--vairo)]" />
              <span>
                {t("complete.openForYou", { goals: openGoals, tasks: openTasks })}
              </span>
            </li>
          </ul>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button href="/app/stage/summary?stage=mvp" variant="secondary">
              {t("complete.fullAnswers")}
            </Button>
            <Button href="/app/goals" variant="ghost">
              {t("complete.openTracker")}
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card className="mt-4">
        <CardBody className="pt-5">
          <p className="text-[12px] font-medium tracking-wide text-[var(--text-subtle)] uppercase">
            {t("complete.whatNext")}
          </p>
          <h2 className="mt-2 font-heading text-[1.15rem] font-semibold text-white">
            {t("complete.furtherTitle")}
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-[var(--text-muted)]">
            {t("complete.furtherBody")}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button href={contactUrl}>
              <MessageCircle className="size-4" />
              {t("complete.talk")}
            </Button>
            <Button href="/app" variant="secondary">
              {tc("notFound.backToStart")}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </CardBody>
      </Card>

      <p className="mt-6 text-center text-[12.5px] text-[var(--text-subtle)]">
        {t("complete.stillWorks")}{" "}
        <Link href="/app/program" className="text-[var(--text-muted)] underline-offset-2 hover:text-white hover:underline">
          {t("complete.seeProgram")}
        </Link>
        .
      </p>
    </div>
  );
}
