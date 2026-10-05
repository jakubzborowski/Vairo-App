import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveStartupId } from "@/lib/active-team";
import { loadGoalsWorkspace } from "@/lib/goals";
import { getUserStartups, resolveActiveStartup } from "@/lib/startup";
import { GoalsTracker } from "@/components/goals/goals-tracker";

function answerLines(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? "").trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }
  if (value && typeof value === "object" && "items" in value) {
    return answerLines((value as { items: unknown }).items);
  }
  return [];
}

export const metadata = { title: "Cele — Vairo" };
export const dynamic = "force-dynamic";

export default async function GoalsPage({
  searchParams,
}: {
  searchParams: Promise<{
    goal?: string;
    condition?: string;
    new?: string;
    link?: string;
    from?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/register?next=/app/goals");

  const [startups, activeTeamId] = await Promise.all([
    getUserStartups(supabase, user.id),
    getActiveStartupId(),
  ]);
  const active = resolveActiveStartup(startups, activeTeamId);
  if (!active) redirect("/app");

  const workspace = await loadGoalsWorkspace(supabase, active.id);

  if (!workspace.ready) {
    return (
      <div className="mx-auto w-full max-w-xl">
        <h1 className="font-heading text-[1.6rem] font-semibold text-white">Cele</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-[var(--text-muted)]">
          Brakuje migracji 018. Wklej ją w Supabase → SQL Editor, po migracji 017.
          Dopiero wtedy da się zapisywać cele, dowody i zadania.
        </p>
      </div>
    );
  }

  if (workspace.loadError) {
    return (
      <div className="mx-auto w-full max-w-xl">
        <h1 className="font-heading text-[1.6rem] font-semibold text-white">Cele</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-[var(--text-muted)]">
          Nie udało się wczytać celów tego startupu. Odśwież stronę. Jeśli komunikat
          wraca, sprawdź, czy migracja 018 jest odpalona w całości.
        </p>
      </div>
    );
  }

  const initialMode = params.new === "1" ? "create" : params.link === "1" ? "link" : null;
  let initialTitle = "";
  let initialDescription = "";
  if (params.from === "preparation") {
    const { data: answer } = await supabase
      .from("stage_answers")
      .select("value, startup_stages!inner(startup_id)")
      .eq("answer_key", "preparation.scope.tasks.mvp_tasks")
      .eq("startup_stages.startup_id", active.id)
      .maybeSingle();
    const lines = answerLines(answer?.value);
    initialTitle = lines[0] ?? "";
    initialDescription = lines.slice(1).join("\n");
  }

  return (
    <GoalsTracker
      startupId={active.id}
      userId={user.id}
      role={active.role}
      members={workspace.members}
      goals={workspace.goals}
      conditions={workspace.conditions}
      files={workspace.files}
      workflows={workspace.workflows}
      goalTypes={workspace.goalTypes}
      initialGoalId={params.goal ?? null}
      initialConditionId={params.condition ?? null}
      initialMode={initialMode}
      initialTitle={initialTitle}
      initialDescription={initialDescription}
    />
  );
}
