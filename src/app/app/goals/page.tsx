import { redirect } from "next/navigation";
import { GoalsScreen, type GoalsView } from "@/components/goals/goals-screen";
import { GoalsUnavailable } from "@/components/goals/goals-unavailable";
import { loadGoalsContext } from "./load";

export const metadata = { title: "Cele — Vairo" };
export const dynamic = "force-dynamic";

export default async function GoalsPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    goal?: string;
    condition?: string;
    new?: string;
    link?: string;
    from?: string;
  }>;
}) {
  const params = await searchParams;

  // Stare adresy (z powiadomień, terminów i dashboardu sprzed redesignu)
  // mają dalej prowadzić tam, gdzie prowadziły: szczegół był oknem nad listą,
  // a teraz jest osobną stroną.
  if (params.goal) redirect(`/app/goals/${params.goal}`);
  if (params.new === "1") {
    const query = new URLSearchParams();
    if (params.condition) query.set("condition", params.condition);
    if (params.from) query.set("from", params.from);
    const suffix = query.toString();
    redirect(`/app/goals/new${suffix ? `?${suffix}` : ""}`);
  }

  const { user, active, workspace } = await loadGoalsContext("/app/goals");

  if (!workspace.ready || workspace.loadError) {
    return <GoalsUnavailable missingMigration={!workspace.ready} />;
  }

  const view: GoalsView =
    params.view === "all" || params.view === "stage" ? params.view : "now";
  const linkConditionId =
    params.link === "1" && params.condition &&
    workspace.conditions.some((condition) => condition.id === params.condition)
      ? params.condition
      : null;

  return (
    <GoalsScreen
      startupId={active.id}
      userId={user.id}
      role={active.role}
      members={workspace.members}
      goals={workspace.goals}
      conditions={workspace.conditions}
      initialView={view}
      initialLinkConditionId={linkConditionId}
    />
  );
}
