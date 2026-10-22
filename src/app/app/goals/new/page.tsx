import { GoalWizard } from "@/components/goals/goal-wizard";
import { GoalsUnavailable } from "@/components/goals/goals-unavailable";
import { loadGoalsContext } from "../load";

export const metadata = { title: "Nowy cel — Vairo" };
export const dynamic = "force-dynamic";

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

export default async function NewGoalPage({
  searchParams,
}: {
  searchParams: Promise<{ condition?: string; from?: string }>;
}) {
  const params = await searchParams;
  const { supabase, user, active, workspace } = await loadGoalsContext("/app/goals/new");

  if (!workspace.ready || workspace.loadError) {
    return <GoalsUnavailable missingMigration={!workspace.ready} />;
  }

  const preset =
    workspace.conditions.find((condition) => condition.id === params.condition) ?? null;

  // Wejście z Preparation: lista zadań MVP z odpowiedzi staje się pierwszym
  // celem — pierwsza linijka tytułem, reszta opisem.
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
    <GoalWizard
      startupId={active.id}
      userId={user.id}
      role={active.role}
      members={workspace.members}
      goalTypes={workspace.goalTypes}
      preset={preset}
      initialTitle={initialTitle}
      initialDescription={initialDescription}
    />
  );
}
