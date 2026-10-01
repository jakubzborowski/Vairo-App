import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveStartupId } from "@/lib/active-team";
import { loadGoalsWorkspace } from "@/lib/goals";
import { getUserStartups, resolveActiveStartup } from "@/lib/startup";
import {
  RozpiskaEditor,
  type RozpiskaRecord,
  type RozpiskaVersion,
} from "@/components/workflows/rozpiska-editor";
import type { RozpiskaEdge, RozpiskaNode } from "@/app/app/workflows/actions";

export const metadata = { title: "Rozpiska — Vairo" };
export const dynamic = "force-dynamic";

function asNodes(value: unknown): RozpiskaNode[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is RozpiskaNode =>
      Boolean(item) &&
      typeof item === "object" &&
      "id" in item &&
      "label" in item &&
      "x" in item &&
      "y" in item
  );
}

function asEdges(value: unknown): RozpiskaEdge[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is RozpiskaEdge =>
      Boolean(item) && typeof item === "object" && "from" in item && "to" in item && "id" in item
  );
}

export default async function WorkflowsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/register?next=/app/workflows");

  const [startups, activeTeamId] = await Promise.all([
    getUserStartups(supabase, user.id),
    getActiveStartupId(),
  ]);
  const active = resolveActiveStartup(startups, activeTeamId);
  if (!active) redirect("/app");

  const [{ data, error }, workspace] = await Promise.all([
    supabase
      .from("workflows")
      .select("id, title, goal_id, version, nodes, edges")
      .eq("startup_id", active.id)
      .order("updated_at", { ascending: false }),
    loadGoalsWorkspace(supabase, active.id),
  ]);

  if (error && (error.message.includes("does not exist") || error.message.includes("schema cache"))) {
    return (
      <div className="mx-auto w-full max-w-xl">
        <h1 className="font-heading text-[1.6rem] font-semibold text-white">Rozpiska</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-[var(--text-muted)]">
          Brakuje migracji 018. Odpal ją w Supabase → SQL Editor.
        </p>
      </div>
    );
  }

  const diagrams: RozpiskaRecord[] = (data ?? []).map((row) => ({
    id: row.id as string,
    title: row.title as string,
    goalId: (row.goal_id as string | null) ?? null,
    version: row.version as number,
    nodes: asNodes(row.nodes),
    edges: asEdges(row.edges),
  }));

  const workflowIds = diagrams.map((item) => item.id);
  const versionsResult =
    workflowIds.length === 0
      ? { data: [] }
      : await supabase
          .from("workflow_versions")
          .select("workflow_id, version, title, nodes, edges, created_at")
          .in("workflow_id", workflowIds)
          .order("version", { ascending: false });

  const versions: RozpiskaVersion[] = (versionsResult.data ?? []).map((row) => ({
    workflowId: row.workflow_id as string,
    version: row.version as number,
    title: row.title as string,
    nodes: asNodes(row.nodes),
    edges: asEdges(row.edges),
    createdAt: row.created_at as string,
  }));

  return (
    <RozpiskaEditor
      startupId={active.id}
      diagrams={diagrams}
      versions={versions}
      goals={workspace.goals}
      initialId={diagrams[0]?.id ?? null}
    />
  );
}
