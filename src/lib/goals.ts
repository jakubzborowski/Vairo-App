import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { goalQualifies, parseRequirement, parseSnapshot } from "@/lib/proof";
import type {
  GoalConditionRef,
  GoalEvent,
  GoalItem,
  GoalMaterial,
  GoalStatus,
  GoalTask,
  GoalTypeOption,
  LibraryPick,
  MilestoneCondition,
  SubpointGoalCondition,
  TaskStatus,
  TeamMemberOption,
  WorkflowPick,
} from "@/types/goals";

function missingRelation(message: string) {
  return (
    message.includes("does not exist") ||
    message.includes("schema cache") ||
    message.includes("Could not find")
  );
}

/** `cache()`: layout (menu) i dashboard pytają o to samo w jednym żądaniu. */
export const isExecutionUnlocked = cache(async function isExecutionUnlocked(
  supabase: SupabaseClient,
  startupId: string
) {
  const { data, error } = await supabase
    .from("startups")
    .select("execution_unlocked_at")
    .eq("id", startupId)
    .maybeSingle();

  if (error) return false;
  return Boolean(data?.execution_unlocked_at);
});

export async function loadGoalTypes(
  supabase: SupabaseClient
): Promise<GoalTypeOption[]> {
  const { data, error } = await supabase
    .from("goal_types")
    .select("id, label, description")
    .order("position", { ascending: true });

  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id as string,
    label: row.label as string,
    description: (row.description as string | null) ?? null,
  }));
}

export async function loadTeamMembers(
  supabase: SupabaseClient,
  startupId: string
): Promise<TeamMemberOption[]> {
  const { data, error } = await supabase
    .from("startup_members")
    .select("profile_id, role, profiles(full_name)")
    .eq("startup_id", startupId);

  if (error || !data) return [];

  return (data as unknown as MemberRow[]).map((row) => ({
    id: row.profile_id,
    name: row.profiles?.full_name?.trim() || "Bez imienia",
    role: row.role,
  }));
}

type MemberRow = {
  profile_id: string;
  role: TeamMemberOption["role"];
  profiles: { full_name: string | null } | null;
};

type GoalRow = {
  id: string;
  title: string;
  description: string | null;
  goal_type_id: string;
  owner_id: string | null;
  due_date: string;
  status: GoalStatus;
  proof_requirement: unknown;
  proof_snapshot: unknown;
  note: string | null;
  blocker_note: string | null;
  needs_reassign: boolean;
  archived_at: string | null;
  completed_at: string | null;
  created_by: string | null;
  goal_types: { label: string } | null;
  profiles: { full_name: string | null } | null;
  tasks: {
    id: string;
    title: string;
    owner_id: string | null;
    status: TaskStatus;
    due_date: string | null;
    needs_reassign: boolean;
    created_by: string | null;
    created_at: string;
    note?: string | null;
    blocker_note?: string | null;
    completed_at?: string | null;
    profiles: { full_name: string | null } | null;
  }[];
  goal_materials: {
    id: string;
    kind: GoalMaterial["kind"];
    file_name: string | null;
    file_path: string | null;
    url: string | null;
    body: string | null;
  }[];
  goal_events: {
    id: string;
    kind: string;
    payload: Record<string, unknown> | null;
    created_at: string;
    actor_id: string | null;
  }[];
  goal_condition_links: {
    condition_id: string;
    startup_goal_conditions: {
      id: string;
      startup_id: string;
      goal_type_id: string;
      min_count: number;
      proof_kind: string | null;
      stage_subpoints: { title: string } | null;
    } | null;
  }[];
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function nameOf(
  members: TeamMemberOption[],
  id: string | null,
  fallback?: string | null
) {
  if (!id) return "Do przypisania";
  return members.find((member) => member.id === id)?.name || fallback?.trim() || "Była osoba w teamie";
}

export async function loadGoalsWorkspace(
  supabase: SupabaseClient,
  startupId: string
): Promise<{
  ready: boolean;
  loadError: string | null;
  goals: GoalItem[];
  conditions: MilestoneCondition[];
  files: LibraryPick[];
  workflows: WorkflowPick[];
  goalTypes: GoalTypeOption[];
  members: TeamMemberOption[];
}> {
  const empty = {
    ready: false,
    loadError: null as string | null,
    goals: [] as GoalItem[],
    conditions: [] as MilestoneCondition[],
    files: [] as LibraryPick[],
    workflows: [] as WorkflowPick[],
    goalTypes: [] as GoalTypeOption[],
    members: [] as TeamMemberOption[],
  };

  const { error: ensureError } = await supabase.rpc("ensure_goal_condition_snapshots", {
    p_startup_id: startupId,
  });
  if (ensureError && !missingRelation(ensureError.message)) {
    console.error("[ensure_goal_condition_snapshots]", ensureError.message);
  }

  // Szczegóły zadań (notatka, powód blokady, data ukończenia) przychodzą
  // z migracją 029. Bez niej `select` z tymi kolumnami kończy się błędem —
  // wtedy pytamy jeszcze raz bez nich, zamiast wywracać cały tracker.
  const selectGoals = (withTaskDetails: boolean) =>
    supabase
        .from("goals")
        .select(
          `id, title, description, goal_type_id, owner_id, due_date, status,
           proof_requirement, proof_snapshot, note, blocker_note, needs_reassign,
           archived_at, completed_at, created_by,
           goal_types(label),
           profiles!goals_owner_id_fkey(full_name),
           tasks(id, title, owner_id, created_by, status, due_date, needs_reassign, created_at${withTaskDetails ? ", note, blocker_note, completed_at" : ""}, profiles!tasks_owner_id_fkey(full_name)),
           goal_materials(id, kind, file_name, file_path, url, body),
           goal_events(id, kind, payload, created_at, actor_id),
           goal_condition_links(
             condition_id,
             startup_goal_conditions(
               id, startup_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type,
               stage_subpoints(title)
             )
           )`
        )
        .eq("startup_id", startupId)
        .order("due_date", { ascending: true });

  const [types, members, goalsFirst, conditionsResult, filesResult, flowsResult] =
    await Promise.all([
      loadGoalTypes(supabase),
      loadTeamMembers(supabase, startupId),
      selectGoals(true),
      supabase
        .from("startup_goal_conditions")
        .select(
          `id, subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, startup_id,
           goal_types(label),
           startup_stages(stage_templates(key, title, position)),
           stage_subpoints(title, position, stage_points(position, stage_categories(position))),
           goal_condition_links(
             goal_id,
             goals(
               id, startup_id, goal_type_id, owner_id, due_date, status, archived_at,
               proof_requirement, proof_snapshot
             )
           )`
        )
        .eq("startup_id", startupId),
      supabase
        .from("startup_files")
        .select("id, name, storage_path, size_bytes")
        .eq("startup_id", startupId)
        .order("created_at", { ascending: false }),
      supabase
        .from("workflows")
        .select("id, title, version")
        .eq("startup_id", startupId)
        .order("updated_at", { ascending: false }),
    ]);

  let goalsResult = goalsFirst;
  if (goalsResult.error && goalsResult.error.message.includes("column")) {
    goalsResult = await selectGoals(false);
  }
  if (goalsResult.error && missingRelation(goalsResult.error.message)) {
    return empty;
  }
  if (goalsResult.error) {
    console.error("[loadGoalsWorkspace]", goalsResult.error.message);
    return { ...empty, goalTypes: types, members, ready: true, loadError: goalsResult.error.message };
  }

  const conditionDone = new Map<string, { done: number; label: string; subpoint: string }>();

  type CondRow = {
    id: string;
    subpoint_id: string;
    goal_type_id: string;
    min_count: number;
    proof_kind: string | null;
    counts_when?: "completed" | "defined" | null;
    match_any_type?: boolean | null;
    startup_id: string;
    goal_types: { label: string } | null;
    startup_stages: { stage_templates: { key: string; title: string; position: number } | null } | null;
    stage_subpoints: {
      title: string;
      position: number | null;
      stage_points: {
        position: number | null;
        stage_categories: { position: number | null } | null;
      } | null;
    } | null;
    goal_condition_links: {
      goal_id: string;
      goals: {
        id: string;
        startup_id: string;
        goal_type_id: string;
        owner_id?: string | null;
        due_date?: string | null;
        status: string;
        archived_at: string | null;
        proof_requirement: unknown;
        proof_snapshot: unknown;
      } | null;
    }[];
  };

  const conditions: MilestoneCondition[] = [];
  for (const row of (conditionsResult.data ?? []) as unknown as CondRow[]) {
    const linked = row.goal_condition_links ?? [];
    const ids = new Set<string>();
    for (const link of linked) {
      const goal = link.goals;
      if (!goal) continue;
      if (
        goalQualifies(
          {
            startupId: goal.startup_id,
            goalTypeId: goal.goal_type_id,
            status: goal.status,
            archivedAt: goal.archived_at,
            ownerId: "owner_id" in goal ? goal.owner_id : null,
            dueDate: "due_date" in goal ? goal.due_date : null,
            proofRequirement: parseRequirement(goal.proof_requirement),
            proofSnapshot: parseSnapshot(goal.proof_snapshot),
          },
          {
            startupId: row.startup_id,
            goalTypeId: row.goal_type_id,
            proofKind: row.proof_kind,
            countsWhen: "counts_when" in row && row.counts_when === "defined" ? "defined" : "completed",
            matchAnyType: "match_any_type" in row && Boolean(row.match_any_type),
          }
        )
      ) {
        ids.add(goal.id);
      }
    }
    const label = row.goal_types?.label ?? row.goal_type_id;
    const subpoint = row.stage_subpoints?.title ?? "Podpunkt";
    const point = row.stage_subpoints?.stage_points;
    conditionDone.set(row.id, { done: ids.size, label, subpoint });
    conditions.push({
      stageTitle: row.startup_stages?.stage_templates?.title ?? "Etap",
      stageKey: row.startup_stages?.stage_templates?.key ?? null,
      stagePosition: row.startup_stages?.stage_templates?.position ?? 0,
      order:
        (point?.stage_categories?.position ?? 0) * 1_000_000 +
        (point?.position ?? 0) * 1_000 +
        (row.stage_subpoints?.position ?? 0),
      matchAnyType: "match_any_type" in row && Boolean(row.match_any_type),
      countsWhen: "counts_when" in row && row.counts_when === "defined" ? "defined" : "completed",
      linkedGoalIds: linked
        .map((link) => link.goals?.id ?? link.goal_id)
        .filter((id): id is string => Boolean(id)),
      id: row.id,
      subpointId: row.subpoint_id,
      subpointTitle: subpoint,
      goalTypeId: row.goal_type_id,
      goalTypeLabel: label,
      minCount: row.min_count,
      done: ids.size,
      proofKind: (row.proof_kind as MilestoneCondition["proofKind"]) ?? null,
    });
  }

  const today = todayIso();
  const goals = ((goalsResult.data ?? []) as unknown as GoalRow[]).map((row) => {
    const requirement = parseRequirement(row.proof_requirement);
    const snapshot = parseSnapshot(row.proof_snapshot);
    const conditionsForGoal: GoalConditionRef[] = [];

    for (const link of row.goal_condition_links ?? []) {
      const condition = link.startup_goal_conditions;
      if (!condition) continue;
      const stats = conditionDone.get(condition.id);
      const counts = goalQualifies(
        {
          startupId,
          goalTypeId: row.goal_type_id,
          status: row.status,
          archivedAt: row.archived_at,
          proofRequirement: requirement,
          proofSnapshot: snapshot,
        },
        {
          startupId: condition.startup_id,
          goalTypeId: condition.goal_type_id,
          proofKind: condition.proof_kind,
        }
      );
      conditionsForGoal.push({
        id: condition.id,
        label: stats?.label ?? condition.goal_type_id,
        subpointTitle: condition.stage_subpoints?.title ?? stats?.subpoint ?? "Podpunkt",
        minCount: condition.min_count,
        done: stats?.done ?? 0,
        counts,
      });
    }

    const tasks: GoalTask[] = (row.tasks ?? []).map((task) => ({
      id: task.id,
      title: task.title,
      ownerId: task.owner_id,
      ownerName: nameOf(members, task.owner_id, task.profiles?.full_name),
      status: task.status,
      dueDate: task.due_date,
      needsReassign: task.needs_reassign,
      createdBy: task.created_by,
      createdAt: task.created_at,
      // `undefined` = kolumny nie ma (brak 029) — UI chowa wtedy te pola.
      note: task.note,
      blockerNote: task.blocker_note,
      completedAt: task.completed_at,
    }));

    const materials: GoalMaterial[] = (row.goal_materials ?? []).map((item) => ({
      id: item.id,
      kind: item.kind,
      fileName: item.file_name,
      filePath: item.file_path,
      url: item.url,
      body: item.body,
    }));

    const events: GoalEvent[] = (row.goal_events ?? [])
      .slice()
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .slice(0, 8)
      .map((event) => ({
        id: event.id,
        kind: event.kind,
        createdAt: event.created_at,
        actorName: event.actor_id
          ? nameOf(members, event.actor_id)
          : null,
        payload: event.payload ?? {},
      }));

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      goalTypeId: row.goal_type_id,
      goalTypeLabel: row.goal_types?.label ?? row.goal_type_id,
      ownerId: row.owner_id,
      ownerName: nameOf(members, row.owner_id, row.profiles?.full_name),
      dueDate: row.due_date,
      status: row.status,
      proofRequirement: requirement,
      proofSnapshot: snapshot,
      note: row.note,
      blockerNote: row.blocker_note,
      needsReassign: row.needs_reassign,
      archivedAt: row.archived_at,
      completedAt: row.completed_at,
      createdBy: row.created_by,
      tasks,
      materials,
      conditions: conditionsForGoal,
      events,
      overdue: row.status !== "completed" && !row.archived_at && row.due_date < today,
    } satisfies GoalItem;
  });

  const files: LibraryPick[] = (filesResult.data ?? []).map((file) => ({
    id: file.id as string,
    name: file.name as string,
    path: file.storage_path as string,
    size: Number(file.size_bytes ?? 0),
  }));

  const workflows: WorkflowPick[] = (flowsResult.data ?? []).map((flow) => ({
    id: flow.id as string,
    title: flow.title as string,
    version: flow.version as number,
  }));

  conditions.sort(
    (a, b) => a.stagePosition - b.stagePosition || a.order - b.order
  );

  return {
    ready: true,
    goals,
    conditions,
    files,
    workflows,
    goalTypes: types,
    members,
    loadError: null,
  };
}

/** Liczniki warunków przy podpunktach — ten sam qualifikator co tracker. */
export async function loadSubpointGoalConditions(
  supabase: SupabaseClient,
  startupId: string,
  startupStageId: string
): Promise<Map<string, SubpointGoalCondition[]>> {
  const map = new Map<string, SubpointGoalCondition[]>();

  const { error: ensureError } = await supabase.rpc("ensure_goal_condition_snapshots", {
    p_startup_id: startupId,
  });
  if (ensureError && missingRelation(ensureError.message)) return map;

  const { data, error } = await supabase
    .from("startup_goal_conditions")
    .select(
      `id, subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, startup_id,
       goal_types(label),
       goal_condition_links(
         goals(id, startup_id, goal_type_id, owner_id, due_date, status, archived_at, proof_requirement, proof_snapshot)
       )`
    )
    .eq("startup_stage_id", startupStageId);

  if (error || !data) return map;

  type Row = {
    id: string;
    subpoint_id: string;
    goal_type_id: string;
    min_count: number;
    proof_kind: string | null;
    counts_when: "completed" | "defined" | null;
    match_any_type: boolean | null;
    startup_id: string;
    goal_types: { label: string } | null;
    goal_condition_links: {
      goals: {
        id: string;
        startup_id: string;
        goal_type_id: string;
        owner_id: string | null;
        due_date: string | null;
        status: string;
        archived_at: string | null;
        proof_requirement: unknown;
        proof_snapshot: unknown;
      } | null;
    }[];
  };

  for (const row of data as unknown as Row[]) {
    const ids = new Set<string>();
    for (const link of row.goal_condition_links ?? []) {
      const goal = link.goals;
      if (!goal) continue;
      if (
        goalQualifies(
          {
            startupId: goal.startup_id,
            goalTypeId: goal.goal_type_id,
            status: goal.status,
            archivedAt: goal.archived_at,
            ownerId: "owner_id" in goal ? goal.owner_id : null,
            dueDate: "due_date" in goal ? goal.due_date : null,
            proofRequirement: parseRequirement(goal.proof_requirement),
            proofSnapshot: parseSnapshot(goal.proof_snapshot),
          },
          {
            startupId: row.startup_id,
            goalTypeId: row.goal_type_id,
            proofKind: row.proof_kind,
            countsWhen: "counts_when" in row && row.counts_when === "defined" ? "defined" : "completed",
            matchAnyType: "match_any_type" in row && Boolean(row.match_any_type),
          }
        )
      ) {
        ids.add(goal.id);
      }
    }

    const list = map.get(row.subpoint_id) ?? [];
    const countsWhen = row.counts_when === "defined" ? "defined" : "completed";
    list.push({
      id: row.id,
      goalTypeId: row.goal_type_id,
      label: row.match_any_type
        ? countsWhen === "defined"
          ? "Cel zapisany"
          : "Cel ukończony"
        : (row.goal_types?.label ?? row.goal_type_id),
      minCount: row.min_count,
      done: ids.size,
      proofKind: row.proof_kind,
      countsWhen,
    });
    map.set(row.subpoint_id, list);
  }

  return map;
}

export type NearestGoal = {
  id: string;
  title: string;
  status: GoalStatus;
  dueDate: string;
  ownerName: string | null;
  overdue: boolean;
};

/**
 * Najbliższy otwarty cel CAŁEGO zespołu — do panelu na dashboardzie.
 *
 * `loadOpenWork` zwraca pracę jednej osoby (lista „Co teraz"). Panel
 * „Najbliższy cel" odpowiada na inne pytanie z guidelines: czym zespół zajmuje
 * się teraz i do kiedy. Dlatego bez filtra po właścicielu.
 *
 * „Po terminie" liczymy tak samo jak w `loadGoalsWorkspace` — dwie różne
 * definicje tego samego słowa na dwóch ekranach to dwie różne odpowiedzi.
 */
export async function loadNearestGoal(
  supabase: SupabaseClient,
  startupId: string
): Promise<NearestGoal | null> {
  const { data, error } = await supabase
    .from("goals")
    .select("id, title, status, due_date, profiles!goals_owner_id_fkey(full_name)")
    .eq("startup_id", startupId)
    .is("archived_at", null)
    .neq("status", "completed")
    .order("due_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as unknown as {
    id: string;
    title: string;
    status: GoalStatus;
    due_date: string;
    profiles: { full_name: string | null } | null;
  };

  return {
    id: row.id,
    title: row.title,
    status: row.status,
    dueDate: row.due_date,
    ownerName: row.profiles?.full_name ?? null,
    overdue: row.due_date < todayIso(),
  };
}

export type DeadlineRow = {
  id: string;
  kind: "goal" | "task";
  title: string;
  due: string;
  ownerName: string | null;
  overdue: boolean;
  href: string;
};

/**
 * Najbliższe terminy zespołu (cele i zadania) — panel na dashboardzie.
 * Spóźnione otwarte terminy są na górze, bo to one wymagają ruchu.
 */
export async function loadUpcomingDeadlines(
  supabase: SupabaseClient,
  startupId: string,
  limit = 4
): Promise<DeadlineRow[]> {
  const [goals, tasks] = await Promise.all([
    supabase
      .from("goals")
      .select("id, title, due_date, profiles!goals_owner_id_fkey(full_name)")
      .eq("startup_id", startupId)
      .is("archived_at", null)
      .neq("status", "completed")
      .order("due_date", { ascending: true })
      .limit(limit),
    supabase
      .from("tasks")
      .select("id, title, due_date, goals!inner(archived_at), profiles!tasks_owner_id_fkey(full_name)")
      .eq("startup_id", startupId)
      .neq("status", "done")
      .not("due_date", "is", null)
      .is("goals.archived_at", null)
      .order("due_date", { ascending: true })
      .limit(limit),
  ]);
  const today = todayIso();
  type Row = { id: string; title: string; due_date: string; profiles: { full_name: string | null } | null };
  const rows: DeadlineRow[] = [
    ...((goals.data ?? []) as unknown as Row[]).map((row) => ({
      id: row.id,
      kind: "goal" as const,
      title: row.title,
      due: row.due_date,
      ownerName: row.profiles?.full_name ?? null,
      overdue: row.due_date < today,
      href: `/app/goals/${row.id}`,
    })),
    ...((tasks.data ?? []) as unknown as Row[]).map((row) => ({
      id: row.id,
      kind: "task" as const,
      title: row.title,
      due: row.due_date,
      ownerName: row.profiles?.full_name ?? null,
      overdue: row.due_date < today,
      href: `/app/tasks?task=${row.id}`,
    })),
  ];
  return rows.sort((a, b) => a.due.localeCompare(b.due)).slice(0, limit);
}

/** Ostatnio ukończone cele — zielone miejsce na sukcesy na dashboardzie. */
export async function loadRecentlyCompleted(
  supabase: SupabaseClient,
  startupId: string,
  limit = 3
): Promise<{ id: string; title: string; completedAt: string | null }[]> {
  const { data } = await supabase
    .from("goals")
    .select("id, title, completed_at")
    .eq("startup_id", startupId)
    .eq("status", "completed")
    .is("archived_at", null)
    .order("completed_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  return (data ?? []).map((row) => ({
    id: row.id as string,
    title: row.title as string,
    completedAt: (row.completed_at as string | null) ?? null,
  }));
}

export type OpenWork = {
  goals: { id: string; title: string; status: GoalStatus; dueDate: string; ownerId: string | null }[];
  tasks: { id: string; title: string; goalId: string; ownerId: string | null; dueDate: string | null }[];
};

export async function loadOpenWork(
  supabase: SupabaseClient,
  startupId: string,
  userId: string
): Promise<OpenWork> {
  const [goals, tasks] = await Promise.all([
    supabase
      .from("goals")
      .select("id, title, status, due_date, owner_id")
      .eq("startup_id", startupId)
      .eq("owner_id", userId)
      .is("archived_at", null)
      .neq("status", "completed")
      .order("due_date", { ascending: true })
      .limit(8),
    supabase
      .from("tasks")
      .select("id, title, goal_id, owner_id, due_date, status")
      .eq("startup_id", startupId)
      .eq("owner_id", userId)
      .neq("status", "done")
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(8),
  ]);

  if (goals.error && missingRelation(goals.error.message)) {
    return { goals: [], tasks: [] };
  }

  return {
    goals: (goals.data ?? []).map((row) => ({
      id: row.id as string,
      title: row.title as string,
      status: row.status as GoalStatus,
      dueDate: row.due_date as string,
      ownerId: (row.owner_id as string | null) ?? null,
    })),
    tasks: (tasks.data ?? []).map((row) => ({
      id: row.id as string,
      title: row.title as string,
      goalId: row.goal_id as string,
      ownerId: (row.owner_id as string | null) ?? null,
      dueDate: (row.due_date as string | null) ?? null,
    })),
  };
}

export type ActivityItem = {
  id: string;
  text: string;
  actorName: string | null;
  createdAt: string;
  href: string;
};

// Bezosobowo: polszczyzna odmienia czasownik przez rodzaj, a my go nie znamy.
const GOAL_EVENT_TEXT: Record<string, string> = {
  created: "Nowy cel",
  proof: "Cel ukończony z dowodem",
  reopened: "Cel otwarty ponownie",
  archived: "Cel zarchiwizowany",
  deadline: "Nowy termin celu",
  owner: "Nowy właściciel celu",
  status: "Zmiana statusu celu",
};

/**
 * Ostatnia aktywność zespołu — z prawdziwych zdarzeń: historii celów (025)
 * i zadań (029, jeśli jest). Nie ma tu nic wyliczonego ani zgadywanego;
 * przy pustej historii panel mówi, że jeszcze nic się nie wydarzyło.
 */
export async function loadTeamActivity(
  supabase: SupabaseClient,
  startupId: string,
  limit = 5
): Promise<ActivityItem[]> {
  const [goalEvents, taskEvents, members] = await Promise.all([
    supabase
      .from("goal_events")
      .select("id, kind, created_at, actor_id, goal_id, goals(title)")
      .eq("startup_id", startupId)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("task_events")
      .select("id, kind, created_at, actor_id, task_id, tasks(title)")
      .eq("startup_id", startupId)
      .order("created_at", { ascending: false })
      .limit(limit),
    loadTeamMembers(supabase, startupId),
  ]);
  const name = (id: string | null) =>
    id ? (members.find((member) => member.id === id)?.name ?? "Była osoba z teamu") : null;

  type GoalRow = { id: string; kind: string; created_at: string; actor_id: string | null; goal_id: string; goals: { title: string } | null };
  type TaskRow = { id: string; kind: string; created_at: string; actor_id: string | null; task_id: string; tasks: { title: string } | null };

  const items: ActivityItem[] = [
    ...((goalEvents.data ?? []) as unknown as GoalRow[]).map((row) => ({
      id: `g-${row.id}`,
      text: `${GOAL_EVENT_TEXT[row.kind] ?? "Zmiana w celu"}: „${row.goals?.title ?? "cel"}”`,
      actorName: name(row.actor_id),
      createdAt: row.created_at,
      href: `/app/goals/${row.goal_id}`,
    })),
    // Bez migracji 029 tabeli nie ma — zapytanie zwraca błąd i pomijamy je.
    ...(taskEvents.error ? [] : ((taskEvents.data ?? []) as unknown as TaskRow[])).map((row) => ({
      id: `t-${row.id}`,
      text:
        row.kind === "created"
          ? `Nowe zadanie: „${row.tasks?.title ?? "zadanie"}”`
          : `Zmiana w zadaniu: „${row.tasks?.title ?? "zadanie"}”`,
      actorName: name(row.actor_id),
      createdAt: row.created_at,
      href: `/app/tasks?task=${row.task_id}`,
    })),
  ];
  return items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, limit);
}

export type StartupStatusCounts = {
  goalsDone: number;
  openBlockers: number;
  overdueTasks: number;
  /** Pierwsza otwarta przeszkoda — „główna przeszkoda" na dashboardzie. */
  mainBlocker: { title: string; note: string | null; href: string } | null;
};

/**
 * Stan startupu (wytyczne, sekcja 3): ukończone cele z dowodem, otwarte
 * przeszkody i zadania po terminie — każda liczba z zapytania, każda prowadzi
 * do rekordów źródłowych. Bez oceny „kondycji" i bez wyliczonego wyniku.
 * Przed migracją 025 zwraca `null` — wtedy pasek się nie pokazuje.
 */
export async function loadStartupStatus(
  supabase: SupabaseClient,
  startupId: string
): Promise<StartupStatusCounts | null> {
  const today = todayIso();
  const [done, blockedGoals, blockedTasks, overdue] = await Promise.all([
    supabase
      .from("goals")
      .select("id", { count: "exact", head: true })
      .eq("startup_id", startupId)
      .eq("status", "completed")
      .is("archived_at", null),
    supabase
      .from("goals")
      .select("id, title, blocker_note")
      .eq("startup_id", startupId)
      .eq("status", "blocked")
      .is("archived_at", null)
      .order("due_date", { ascending: true }),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("startup_id", startupId)
      .eq("status", "blocked"),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("startup_id", startupId)
      .neq("status", "done")
      .lt("due_date", today),
  ]);
  if (done.error && missingRelation(done.error.message)) return null;
  const firstBlocked = (blockedGoals.data ?? [])[0] as
    | { id: string; title: string; blocker_note: string | null }
    | undefined;
  return {
    goalsDone: done.count ?? 0,
    openBlockers: (blockedGoals.data?.length ?? 0) + (blockedTasks.count ?? 0),
    overdueTasks: overdue.count ?? 0,
    mainBlocker: firstBlocked
      ? { title: firstBlocked.title, note: firstBlocked.blocker_note, href: `/app/goals/${firstBlocked.id}` }
      : null,
  };
}
