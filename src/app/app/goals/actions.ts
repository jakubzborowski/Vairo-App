"use server";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveStartupId } from "@/lib/active-team";
import { translateDbError } from "@/lib/db-errors";
import { NOT_A_MEMBER, getStartupRole } from "@/lib/permissions";
import { isProofKind, parseRequirement, proofMatches } from "@/lib/proof";
import { canAssignToOthers, canChangeOwnWork, type StartupRole } from "@/types/startup";
import type {
  GoalStatus,
  ProofDraft,
  ProofRequirement,
  ProofSnapshot,
  TaskStatus,
} from "@/types/goals";

type Result = { error: string | null; id?: string };

function refresh() {
  revalidatePath("/app");
  revalidatePath("/app/goals");
  revalidatePath("/app/tasks");
  revalidatePath("/app/workflows");
  revalidatePath("/app/stage");
}

type Gate =
  | { ok: false; error: string }
  | { ok: true; supabase: SupabaseClient; user: User; role: StartupRole };

async function context(startupId: string): Promise<Gate> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Musisz być zalogowany." };

  const active = await getActiveStartupId();
  if (active && active !== startupId) {
    return { ok: false, error: "Przełącz team i spróbuj ponownie." };
  }

  const role = await getStartupRole(supabase, startupId, user.id);
  if (!role) return { ok: false, error: NOT_A_MEMBER };

  return { ok: true, supabase, user, role };
}

function cleanRequirement(input: ProofRequirement): { error: string } | { requirement: ProofRequirement } {
  if (!isProofKind(input.kind)) return { error: "Wybierz, czym pokażesz ukończenie." };
  const label = input.label.trim();
  if (label.length < 2) return { error: "Napisz, czego będzie dowodem. Na przykład: link do wersji testowej." };

  if (input.kind === "select") {
    const options = (input.options ?? [])
      .map((option) => ({
        value: option.value.trim(),
        label: option.label.trim(),
      }))
      .filter((option) => option.value && option.label);
    if (options.length < 2) return { error: "Lista wyboru potrzebuje co najmniej dwóch opcji." };
    return { requirement: { kind: "select", label, options } };
  }

  if (input.kind === "scale") {
    const min = input.min ?? 1;
    const max = input.max ?? 5;
    if (min >= max) return { error: "Skala musi mieć początek niższy niż koniec." };
    return { requirement: { kind: "scale", label, min, max } };
  }

  if (input.kind === "goal_set") {
    const minCount = Math.max(input.min_count ?? 1, 1);
    return { requirement: { kind: "goal_set", label, min_count: minCount } };
  }

  if (input.kind === "module_result") {
    return { requirement: { kind: "module_result", label, module: "workflow" } };
  }

  return { requirement: { kind: input.kind, label } };
}

async function loadGoal(
  supabase: Awaited<ReturnType<typeof createClient>>,
  startupId: string,
  goalId: string
) {
  const { data } = await supabase
    .from("goals")
    .select(
      "id, startup_id, owner_id, status, goal_type_id, proof_requirement, proof_snapshot, archived_at, title"
    )
    .eq("id", goalId)
    .eq("startup_id", startupId)
    .maybeSingle();
  return data;
}

export async function createGoal(input: {
  startupId: string;
  title: string;
  description?: string;
  goalTypeId: string;
  ownerId: string;
  dueDate: string;
  proofRequirement: ProofRequirement;
  note?: string;
  conditionId?: string | null;
  addAnother?: boolean;
}): Promise<Result> {
  const ctx = await context(input.startupId);
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, role } = ctx;

  const title = input.title.trim();
  if (title.length < 3) return { error: "Napisz, co ma być gotowe. Jedno zdanie wystarczy." };
  if (!input.dueDate) return { error: "Ustal termin. Da się go później zmienić." };

  const built = cleanRequirement(input.proofRequirement);
  if ("error" in built) return { error: built.error };

  let ownerId = input.ownerId || user.id;
  if (!canAssignToOthers(role)) ownerId = user.id;

  let condition: { id: string; goal_type_id: string; proof_kind: string | null } | null = null;
  if (input.conditionId) {
    const { data } = await supabase
      .from("startup_goal_conditions")
      .select("id, goal_type_id, proof_kind, startup_id")
      .eq("id", input.conditionId)
      .eq("startup_id", input.startupId)
      .maybeSingle();
    if (!data) return { error: "Nie ma takiego warunku w tym startupie." };
    condition = data;

    if (!input.addAnother) {
      const { data: existing } = await supabase
        .from("goals")
        .select("id")
        .eq("created_for_condition_id", condition.id)
        .is("archived_at", null)
        .maybeSingle();
      if (existing) return { error: null, id: existing.id };
    }
  }

  const goalTypeId = condition ? condition.goal_type_id : input.goalTypeId;
  if (!goalTypeId) return { error: "Wybierz typ celu." };
  if (condition?.proof_kind && built.requirement.kind !== condition.proof_kind) {
    return { error: "Ten punkt programu oczekuje innego formatu dowodu." };
  }

  const { data: created, error } = await supabase
    .from("goals")
    .insert({
      startup_id: input.startupId,
      title,
      description: input.description?.trim() || null,
      goal_type_id: goalTypeId,
      owner_id: ownerId,
      due_date: input.dueDate,
      status: "todo",
      proof_requirement: built.requirement,
      note: input.note?.trim() || null,
      created_by: user.id,
      created_for_condition_id: condition && !input.addAnother ? condition.id : null,
    })
    .select("id")
    .single();

  if (error || !created) return { error: translateDbError(error?.message) };

  if (condition) {
    const { error: linkError } = await supabase.from("goal_condition_links").insert({
      condition_id: condition.id,
      goal_id: created.id,
      created_by: user.id,
    });
    if (linkError) return { error: translateDbError(linkError.message), id: created.id };
  }

  refresh();
  return { error: null, id: created.id };
}

export async function updateGoal(input: {
  startupId: string;
  goalId: string;
  title?: string;
  description?: string | null;
  goalTypeId?: string;
  ownerId?: string;
  dueDate?: string;
  status?: GoalStatus;
  proofRequirement?: ProofRequirement;
  note?: string | null;
  blockerNote?: string | null;
}): Promise<Result> {
  const ctx = await context(input.startupId);
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, role } = ctx;

  const goal = await loadGoal(supabase, input.startupId, input.goalId);
  if (!goal) return { error: "Nie ma takiego celu." };
  if (!canChangeOwnWork(role, user.id, goal.owner_id)) {
    return { error: "Ten cel prowadzi ktoś inny. Poproś Foundera albo Admina." };
  }
  if (input.status === "completed") {
    return { error: "Cel kończy się dowodem, nie samą zmianą statusu." };
  }

  const patch: Record<string, unknown> = {};

  if (input.title !== undefined) {
    const title = input.title.trim();
    if (title.length < 3) return { error: "Tytuł jest za krótki." };
    patch.title = title;
  }
  if (input.description !== undefined) patch.description = input.description?.trim() || null;
  if (input.note !== undefined) patch.note = input.note?.trim() || null;
  if (input.dueDate) patch.due_date = input.dueDate;
  if (input.goalTypeId) patch.goal_type_id = input.goalTypeId;

  if (input.ownerId) {
    if (input.ownerId !== goal.owner_id && !canAssignToOthers(role)) {
      return { error: "Przypisać pracę komuś innemu może Founder albo Admin." };
    }
    patch.owner_id = input.ownerId;
  }

  if (input.proofRequirement) {
    const built = cleanRequirement(input.proofRequirement);
    if ("error" in built) return { error: built.error };
    patch.proof_requirement = built.requirement;
  }

  if (input.status) {
    patch.status = input.status;
    if (input.status === "blocked") {
      const note = (input.blockerNote ?? "").trim();
      if (!note) return { error: "Napisz, co blokuje pracę." };
      patch.blocker_note = note;
    }
  }
  if (input.blockerNote !== undefined && input.status !== "blocked") {
    patch.blocker_note = input.blockerNote?.trim() || null;
  }

  const { error } = await supabase.from("goals").update(patch).eq("id", goal.id);
  if (error) return { error: translateDbError(error.message) };

  refresh();
  return { error: null, id: goal.id };
}

export async function completeGoal(input: {
  startupId: string;
  goalId: string;
  proof: ProofDraft;
}): Promise<Result> {
  const ctx = await context(input.startupId);
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, role } = ctx;

  const goal = await loadGoal(supabase, input.startupId, input.goalId);
  if (!goal) return { error: "Nie ma takiego celu." };
  if (goal.archived_at) return { error: "Zarchiwizowanego celu nie da się ukończyć." };
  if (!canChangeOwnWork(role, user.id, goal.owner_id)) {
    return { error: "Ten cel kończy osoba, która za niego odpowiada." };
  }

  const requirement = parseRequirement(goal.proof_requirement);
  if (input.proof.kind !== requirement.kind) {
    return { error: "Dowód musi być w formacie ustalonym przy tworzeniu celu." };
  }

  const snapshot = await buildSnapshot(supabase, input.startupId, user.id, requirement, input.proof);
  if ("error" in snapshot) return { error: snapshot.error };

  if (goal.status === "completed" && proofMatches(requirement, snapshot.snapshot)) {
    return { error: null, id: goal.id };
  }

  const { error } = await supabase
    .from("goals")
    .update({
      status: "completed",
      proof_snapshot: snapshot.snapshot,
      completed_by: user.id,
    })
    .eq("id", goal.id);

  if (error) return { error: translateDbError(error.message) };
  refresh();
  return { error: null, id: goal.id };
}

async function buildSnapshot(
  supabase: Awaited<ReturnType<typeof createClient>>,
  startupId: string,
  userId: string,
  requirement: ProofRequirement,
  proof: ProofDraft
): Promise<{ error: string } | { snapshot: ProofSnapshot }> {
  const base = { kind: requirement.kind, captured_at: new Date().toISOString(), captured_by: userId };

  if (proof.kind === "sentence" || proof.kind === "long_text") {
    const snapshot = { ...base, text: proof.text.trim() };
    return proofMatches(requirement, snapshot)
      ? { snapshot }
      : { error: proof.kind === "sentence" ? "Wpisz jedno zdanie, bez enteru." : "Opisz wynik." };
  }

  if (proof.kind === "select") {
    const snapshot = { ...base, option: proof.option };
    return proofMatches(requirement, snapshot)
      ? { snapshot }
      : { error: "Wybierz jedną z opcji." };
  }

  if (proof.kind === "scale") {
    const snapshot = { ...base, scale: proof.scale };
    return proofMatches(requirement, snapshot) ? { snapshot } : { error: "Zaznacz wartość na skali." };
  }

  if (proof.kind === "link") {
    const snapshot = { ...base, url: proof.url.trim(), note: proof.note.trim() };
    return proofMatches(requirement, snapshot)
      ? { snapshot }
      : { error: "Podaj adres zaczynający się od https oraz krótki opis, co tam jest." };
  }

  if (proof.kind === "file") {
    const file = await resolveFile(supabase, startupId, proof);
    if ("error" in file) return file;
    const snapshot = { ...base, file: file.file };
    return proofMatches(requirement, snapshot)
      ? { snapshot }
      : { error: "Wybierz plik z tego startupu." };
  }

  if (proof.kind === "module_result") {
    const { data: flow } = await supabase
      .from("workflows")
      .select("id, title, version, nodes, edges")
      .eq("id", proof.workflowId)
      .eq("startup_id", startupId)
      .maybeSingle();
    if (!flow) return { error: "Nie ma takiej Rozpiski w tym startupie." };

    const { data: version } = await supabase
      .from("workflow_versions")
      .select("version, title, nodes, edges")
      .eq("workflow_id", flow.id)
      .eq("version", flow.version)
      .maybeSingle();

    const snapshot: ProofSnapshot = {
      ...base,
      module: "workflow",
      workflow_id: flow.id,
      version: version?.version ?? flow.version,
      title: version?.title ?? flow.title,
      nodes: version?.nodes ?? flow.nodes,
      edges: version?.edges ?? flow.edges,
    };
    return proofMatches(requirement, snapshot)
      ? { snapshot }
      : { error: "Najpierw zapisz Rozpiskę." };
  }

  if (proof.kind === "goal_set") {
    const ids = [...new Set(proof.goalIds)];
    const snapshot = { ...base, goal_ids: ids };
    if (!proofMatches(requirement, snapshot)) {
      return { error: "Wskaż wystarczającą liczbę różnych celów." };
    }
    return { snapshot };
  }

  return { error: "Tego formatu dowodu nie da się tu zapisać." };
}

async function resolveFile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  startupId: string,
  proof: Extract<ProofDraft, { kind: "file" }>
): Promise<{ error: string } | { file: { id: string | null; path: string; name: string; size: number } }> {
  if (proof.fileId) {
    const { data } = await supabase
      .from("startup_files")
      .select("id, name, storage_path, size_bytes")
      .eq("id", proof.fileId)
      .eq("startup_id", startupId)
      .maybeSingle();
    if (!data) return { error: "Nie ma takiego pliku w bibliotece tego startupu." };
    return {
      file: {
        id: data.id,
        path: data.storage_path,
        name: data.name,
        size: Number(data.size_bytes ?? 0),
      },
    };
  }

  if (!proof.path || !proof.name) return { error: "Wybierz plik." };
  if (proof.path.split("/")[0] === startupId) {
    return {
      file: { id: null, path: proof.path, name: proof.name, size: proof.size ?? 0 },
    };
  }

  const { data: stages } = await supabase
    .from("startup_stages")
    .select("id")
    .eq("startup_id", startupId);
  const stageIds = new Set((stages ?? []).map((stage) => stage.id as string));
  if (!stageIds.has(proof.path.split("/")[0] ?? "")) {
    return { error: "Ten plik nie należy do tego startupu." };
  }
  return {
    file: { id: null, path: proof.path, name: proof.name, size: proof.size ?? 0 },
  };
}

export async function reopenGoal(startupId: string, goalId: string): Promise<Result> {
  const ctx = await context(startupId);
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, role } = ctx;

  const goal = await loadGoal(supabase, startupId, goalId);
  if (!goal) return { error: "Nie ma takiego celu." };
  if (!canChangeOwnWork(role, user.id, goal.owner_id)) {
    return { error: "Ten cel może otworzyć ponownie jego właściciel, Founder albo Admin." };
  }

  const { error } = await supabase
    .from("goals")
    .update({ status: "in_progress" })
    .eq("id", goalId);

  if (error) return { error: translateDbError(error.message) };
  refresh();
  return { error: null, id: goalId };
}

export async function archiveGoal(startupId: string, goalId: string): Promise<Result> {
  const ctx = await context(startupId);
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, role } = ctx;

  const goal = await loadGoal(supabase, startupId, goalId);
  if (!goal) return { error: "Nie ma takiego celu." };
  if (!canChangeOwnWork(role, user.id, goal.owner_id)) {
    return { error: "Archiwizuje właściciel, Founder albo Admin." };
  }

  const { error } = await supabase
    .from("goals")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", goalId);

  if (error) return { error: translateDbError(error.message) };
  refresh();
  return { error: null };
}

export async function linkGoal(
  startupId: string,
  goalId: string,
  conditionId: string
): Promise<Result> {
  const ctx = await context(startupId);
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, role } = ctx;

  const goal = await loadGoal(supabase, startupId, goalId);
  if (!goal) return { error: "Nie ma takiego celu." };
  if (!canAssignToOthers(role) && goal.owner_id !== user.id) {
    return { error: "Podpiąć cudzy cel może Founder albo Admin. Własny — jego właściciel." };
  }

  const { error } = await supabase.from("goal_condition_links").insert({
    condition_id: conditionId,
    goal_id: goalId,
    created_by: user.id,
  });

  if (error) {
    if (error.message.includes("duplicate")) {
      return { error: null, id: goalId };
    }
    return { error: translateDbError(error.message) };
  }

  refresh();
  return { error: null, id: goalId };
}

export async function unlinkGoal(
  startupId: string,
  goalId: string,
  conditionId: string
): Promise<Result> {
  const ctx = await context(startupId);
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, role } = ctx;

  const goal = await loadGoal(supabase, startupId, goalId);
  if (!goal) return { error: "Nie ma takiego celu." };
  if (!canAssignToOthers(role) && goal.owner_id !== user.id) {
    return { error: "Odpiąć cudzy cel może Founder albo Admin." };
  }

  const { error } = await supabase
    .from("goal_condition_links")
    .delete()
    .eq("condition_id", conditionId)
    .eq("goal_id", goalId);

  if (error) return { error: translateDbError(error.message) };
  refresh();
  return { error: null };
}

export async function createTask(input: {
  startupId: string;
  goalId: string;
  title: string;
  ownerId: string;
  dueDate?: string | null;
}): Promise<Result> {
  const ctx = await context(input.startupId);
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, role } = ctx;

  const goal = await loadGoal(supabase, input.startupId, input.goalId);
  if (!goal) return { error: "Najpierw wybierz cel, do którego należy zadanie." };

  const title = input.title.trim();
  if (title.length < 2) return { error: "Napisz, co jest do zrobienia." };

  let ownerId = input.ownerId || user.id;
  if (!canAssignToOthers(role)) {
    if (!canChangeOwnWork(role, user.id, goal.owner_id) && ownerId !== user.id) {
      return { error: "Możesz dodać zadanie sobie. Przypisanie komuś innemu zostaw Founderowi." };
    }
    ownerId = user.id;
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      startup_id: input.startupId,
      goal_id: input.goalId,
      title,
      owner_id: ownerId,
      due_date: input.dueDate || null,
      status: "todo",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) return { error: translateDbError(error?.message) };
  refresh();
  return { error: null, id: data.id };
}

export async function updateTask(input: {
  startupId: string;
  taskId: string;
  title?: string;
  ownerId?: string;
  status?: TaskStatus;
  dueDate?: string | null;
}): Promise<Result> {
  const ctx = await context(input.startupId);
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, role } = ctx;

  const { data: task } = await supabase
    .from("tasks")
    .select("id, owner_id, goal_id")
    .eq("id", input.taskId)
    .eq("startup_id", input.startupId)
    .maybeSingle();

  if (!task) return { error: "Nie ma takiego zadania." };
  if (!canChangeOwnWork(role, user.id, task.owner_id)) {
    return { error: "To zadanie należy do kogoś innego." };
  }

  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) {
    const title = input.title.trim();
    if (title.length < 2) return { error: "Tytuł zadania jest za krótki." };
    patch.title = title;
  }
  if (input.status) patch.status = input.status;
  if (input.dueDate !== undefined) patch.due_date = input.dueDate || null;
  if (input.ownerId) {
    if (input.ownerId !== task.owner_id && !canAssignToOthers(role)) {
      return { error: "Przypisać zadanie komuś innemu może Founder albo Admin." };
    }
    patch.owner_id = input.ownerId;
  }

  const { error } = await supabase.from("tasks").update(patch).eq("id", task.id);
  if (error) return { error: translateDbError(error.message) };
  refresh();
  return { error: null };
}

export async function addGoalMaterial(input: {
  startupId: string;
  goalId: string;
  kind: "note" | "link" | "file";
  body?: string;
  url?: string;
  fileId?: string;
}): Promise<Result> {
  const ctx = await context(input.startupId);
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user } = ctx;

  const goal = await loadGoal(supabase, input.startupId, input.goalId);
  if (!goal) return { error: "Nie ma takiego celu." };

  if (input.kind === "note") {
    const body = input.body?.trim() ?? "";
    if (body.length < 1) return { error: "Notatka jest pusta." };
    const { error } = await supabase.from("goal_materials").insert({
      startup_id: input.startupId,
      goal_id: input.goalId,
      kind: "note",
      body,
      created_by: user.id,
    });
    if (error) return { error: translateDbError(error.message) };
  } else if (input.kind === "link") {
    const url = input.url?.trim() ?? "";
    if (!/^https?:\/\/\S+$/i.test(url)) return { error: "Link musi zaczynać się od https." };
    const { error } = await supabase.from("goal_materials").insert({
      startup_id: input.startupId,
      goal_id: input.goalId,
      kind: "link",
      url,
      created_by: user.id,
    });
    if (error) return { error: translateDbError(error.message) };
  } else {
    const file = await resolveFile(supabase, input.startupId, {
      kind: "file",
      fileId: input.fileId,
    });
    if ("error" in file) return file;
    const { error } = await supabase.from("goal_materials").insert({
      startup_id: input.startupId,
      goal_id: input.goalId,
      kind: "file",
      file_id: file.file.id,
      file_path: file.file.path,
      file_name: file.file.name,
      created_by: user.id,
    });
    if (error) return { error: translateDbError(error.message) };
  }

  refresh();
  return { error: null };
}

export async function removeGoalMaterial(startupId: string, materialId: string): Promise<Result> {
  const ctx = await context(startupId);
  if (!ctx.ok) return { error: ctx.error };

  const { error } = await ctx.supabase
    .from("goal_materials")
    .delete()
    .eq("id", materialId)
    .eq("startup_id", startupId);

  if (error) return { error: translateDbError(error.message) };
  refresh();
  return { error: null };
}
