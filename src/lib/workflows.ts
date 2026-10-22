import type { SupabaseClient } from "@supabase/supabase-js";
import type { RozpiskaEdge, RozpiskaNode } from "@/app/app/workflows/actions";

/**
 * Odczyt Rozpisek. Bloczki i strzałki leżą w `jsonb`, więc każdy wiersz
 * przechodzi przez filtr kształtu — jeden uszkodzony element nie może
 * wywrócić płótna.
 */

export type RozpiskaRecord = {
  id: string;
  title: string;
  goalId: string | null;
  version: number;
  nodes: RozpiskaNode[];
  edges: RozpiskaEdge[];
  updatedAt: string;
  createdBy: string | null;
};

export type RozpiskaVersion = {
  workflowId: string;
  version: number;
  title: string;
  nodes: RozpiskaNode[];
  edges: RozpiskaEdge[];
  createdAt: string;
};

export function asNodes(value: unknown): RozpiskaNode[] {
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

export function asEdges(value: unknown): RozpiskaEdge[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is RozpiskaEdge =>
      Boolean(item) && typeof item === "object" && "from" in item && "to" in item && "id" in item
  );
}

export function missingTable(message: string | undefined) {
  return Boolean(message && (message.includes("does not exist") || message.includes("schema cache")));
}

type Row = {
  id: string;
  title: string;
  goal_id: string | null;
  version: number;
  nodes: unknown;
  edges: unknown;
  updated_at: string;
  created_by: string | null;
};

function toRecord(row: Row): RozpiskaRecord {
  return {
    id: row.id,
    title: row.title,
    goalId: row.goal_id ?? null,
    version: row.version,
    nodes: asNodes(row.nodes),
    edges: asEdges(row.edges),
    updatedAt: row.updated_at,
    createdBy: row.created_by ?? null,
  };
}

export async function loadRozpiski(supabase: SupabaseClient, startupId: string) {
  const { data, error } = await supabase
    .from("workflows")
    .select("id, title, goal_id, version, nodes, edges, updated_at, created_by")
    .eq("startup_id", startupId)
    .order("updated_at", { ascending: false });
  return {
    missing: missingTable(error?.message),
    error: error?.message ?? null,
    records: ((data ?? []) as Row[]).map(toRecord),
  };
}

export async function loadRozpiska(supabase: SupabaseClient, startupId: string, id: string) {
  const [{ data, error }, versionsResult] = await Promise.all([
    supabase
      .from("workflows")
      .select("id, title, goal_id, version, nodes, edges, updated_at, created_by")
      .eq("startup_id", startupId)
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("workflow_versions")
      .select("workflow_id, version, title, nodes, edges, created_at")
      .eq("workflow_id", id)
      .order("version", { ascending: false }),
  ]);

  const versions: RozpiskaVersion[] = (versionsResult.data ?? []).map((row) => ({
    workflowId: row.workflow_id as string,
    version: row.version as number,
    title: row.title as string,
    nodes: asNodes(row.nodes),
    edges: asEdges(row.edges),
    createdAt: row.created_at as string,
  }));

  return {
    missing: missingTable(error?.message),
    record: data ? toRecord(data as Row) : null,
    versions,
  };
}

/** Kolejność kroków według strzałek — widok listy na telefonie. */
export function orderedSteps(nodes: RozpiskaNode[], edges: RozpiskaEdge[]) {
  const incoming = new Map<string, number>();
  for (const node of nodes) incoming.set(node.id, 0);
  for (const edge of edges) incoming.set(edge.to, (incoming.get(edge.to) ?? 0) + 1);

  const byPosition = [...nodes].sort((a, b) => a.y - b.y || a.x - b.x);
  const queue = byPosition.filter((node) => (incoming.get(node.id) ?? 0) === 0);
  const seen = new Set<string>();
  const out: RozpiskaNode[] = [];

  while (queue.length > 0) {
    const node = queue.shift()!;
    if (seen.has(node.id)) continue;
    seen.add(node.id);
    out.push(node);
    for (const edge of edges.filter((item) => item.from === node.id)) {
      const left = (incoming.get(edge.to) ?? 0) - 1;
      incoming.set(edge.to, left);
      const target = nodes.find((item) => item.id === edge.to);
      if (target && left <= 0 && !seen.has(target.id)) queue.push(target);
    }
  }
  // Pętle i bloczki osierocone dopisujemy na końcu, w kolejności z płótna.
  for (const node of byPosition) if (!seen.has(node.id)) out.push(node);
  return out;
}
