"use server";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveStartupId } from "@/lib/active-team";
import { translateDbError } from "@/lib/db-errors";
import { getStartupRole } from "@/lib/permissions";
import { isProofKind, parseRequirement, proofMatches } from "@/lib/proof";
import { canAssignToOthers, canChangeOwnWork, type StartupRole } from "@/types/startup";
import type {
  GoalStatus,
  ProofDraft,
  ProofRequirement,
  ProofSnapshot,
  TaskEvent,
  TaskStatus,
} from "@/types/goals";
import { notAMember, sessionExpired } from "@/lib/server-errors";

import { getT } from "@/i18n/server";
import type { MessageKey } from "@/i18n/messages";
import type { Translate } from "@/i18n/translator";
type Result = { error: string | null; id?: string };

function refresh() {
  revalidatePath("/app");
  // `layout` obejmuje też podstrony: szczegół celu i kreator.
  revalidatePath("/app/goals", "layout");
  revalidatePath("/app/tasks");
  revalidatePath("/app/workflows", "layout");
  revalidatePath("/app/stage");
}

type Gate =
  | { ok: false; error: string }
  | { ok: true; supabase: SupabaseClient; user: User; role: StartupRole };

async function context(startupId: string): Promise<Gate> {
  const t = await getT("goals");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: await sessionExpired() };

  const active = await getActiveStartupId();
  if (active && active !== startupId) {
    return { ok: false, error: t("actions.przelaczZespolISprobuj") };
  }

  const role = await getStartupRole(supabase, startupId, user.id);
  if (!role) return { ok: false, error: await notAMember() };

  return { ok: true, supabase, user, role };
}

function cleanRequirement(
  t: Translate<MessageKey<"goals">>,
  input: ProofRequirement
): { error: string } | { requirement: ProofRequirement } {
  if (!isProofKind(input.kind)) return { error: t("actions.wybierzCzymPokazeszUkonczenie") };
  const label = input.label.trim();
  if (label.length < 2) return { error: t("actions.napiszCzegoBedzieDowodem") };

  if (input.kind === "select") {
    const options = (input.options ?? [])
      .map((option) => ({
        value: option.value.trim(),
        label: option.label.trim(),
      }))
      .filter((option) => option.value && option.label);
    if (options.length < 2) return { error: t("actions.listaWyboruPotrzebujeCo") };
    return { requirement: { kind: "select", label, options } };
  }

  if (input.kind === "scale") {
    const min = input.min ?? 1;
    const max = input.max ?? 5;
    if (min >= max) return { error: t("actions.skalaMusiMiecPoczatek") };
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
  const t = await getT("goals");
  const ctx = await context(input.startupId);
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, role } = ctx;

  const title = input.title.trim();
  if (title.length < 3) return { error: t("actions.napiszCoMaByc") };
  if (!input.dueDate) return { error: t("actions.ustalTerminDaSie") };

  const built = cleanRequirement(t, input.proofRequirement);
  if ("error" in built) return { error: built.error };

  let ownerId = input.ownerId || user.id;
  if (!canAssignToOthers(role)) ownerId = user.id;

  let condition: {
    id: string;
    goal_type_id: string;
    proof_kind: string | null;
    match_any_type?: boolean | null;
  } | null = null;
  if (input.conditionId) {
    const { data } = await supabase
      .from("startup_goal_conditions")
      .select("id, goal_type_id, proof_kind, match_any_type, startup_id")
      .eq("id", input.conditionId)
      .eq("startup_id", input.startupId)
      .maybeSingle();
    if (!data) return { error: t("actions.nieMaTakiegoWarunku") };
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

  // Warunek z `match_any_type` przyjmuje cel każdego rodzaju — wtedy wygrywa
  // wybór z kreatora. Wcześniej rodzaj z warunku nadpisywał go po cichu:
  // „Wynik budowy” w podsumowaniu, „Własny cel” w bazie.
  const goalTypeId =
    condition && !condition.match_any_type ? condition.goal_type_id : input.goalTypeId;
  if (!goalTypeId) return { error: t("actions.wybierzTypCelu") };
  if (condition?.proof_kind && built.requirement.kind !== condition.proof_kind) {
    return { error: t("actions.tenPunktProgramuOczekuje") };
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

  if (error || !created) return { error: await translateDbError(error?.message) };

  if (condition) {
    const { error: linkError } = await supabase.from("goal_condition_links").insert({
      condition_id: condition.id,
      goal_id: created.id,
      created_by: user.id,
    });
    if (linkError) return { error: await translateDbError(linkError.message), id: created.id };
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
  const t = await getT("goals");
  const ctx = await context(input.startupId);
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, role } = ctx;

  const goal = await loadGoal(supabase, input.startupId, input.goalId);
  if (!goal) return { error: t("actions.nieMaTakiegoCelu") };
  if (!canChangeOwnWork(role, user.id, goal.owner_id)) {
    return { error: t("actions.tenCelProwadziKtos") };
  }
  if (input.status === "completed") {
    return { error: t("actions.celKonczySieDowodem") };
  }

  const patch: Record<string, unknown> = {};

  if (input.title !== undefined) {
    const title = input.title.trim();
    if (title.length < 3) return { error: t("actions.tytulJestZaKrotki") };
    patch.title = title;
  }
  if (input.description !== undefined) patch.description = input.description?.trim() || null;
  if (input.note !== undefined) patch.note = input.note?.trim() || null;
  if (input.dueDate) patch.due_date = input.dueDate;
  if (input.goalTypeId) patch.goal_type_id = input.goalTypeId;

  if (input.ownerId) {
    if (input.ownerId !== goal.owner_id && !canAssignToOthers(role)) {
      return { error: t("actions.przypisacPraceKomusInnemu") };
    }
    patch.owner_id = input.ownerId;
  }

  if (input.proofRequirement) {
    const built = cleanRequirement(t, input.proofRequirement);
    if ("error" in built) return { error: built.error };
    patch.proof_requirement = built.requirement;
  }

  if (input.status) {
    patch.status = input.status;
    if (input.status === "blocked") {
      const note = (input.blockerNote ?? "").trim();
      if (!note) return { error: t("actions.napiszCoBlokujePrace") };
      patch.blocker_note = note;
    }
  }
  if (input.blockerNote !== undefined && input.status !== "blocked") {
    patch.blocker_note = input.blockerNote?.trim() || null;
  }

  const { error } = await supabase.from("goals").update(patch).eq("id", goal.id);
  if (error) return { error: await translateDbError(error.message) };

  refresh();
  return { error: null, id: goal.id };
}

export async function completeGoal(input: {
  startupId: string;
  goalId: string;
  proof: ProofDraft;
}): Promise<Result> {
  const t = await getT("goals");
  const ctx = await context(input.startupId);
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, role } = ctx;

  const goal = await loadGoal(supabase, input.startupId, input.goalId);
  if (!goal) return { error: t("actions.nieMaTakiegoCelu") };
  if (goal.archived_at) return { error: t("actions.zarchiwizowanegoCeluNieDa") };
  if (!canChangeOwnWork(role, user.id, goal.owner_id)) {
    return { error: t("actions.tenCelKonczyOsoba") };
  }

  const requirement = parseRequirement(goal.proof_requirement);
  if (input.proof.kind !== requirement.kind) {
    return { error: t("actions.dowodMusiBycW") };
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

  if (error) return { error: await translateDbError(error.message) };
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
  const t = await getT("goals");
  const base = { kind: requirement.kind, captured_at: new Date().toISOString(), captured_by: userId };

  if (proof.kind === "sentence" || proof.kind === "long_text") {
    // Tekst wstawiony z Dokumentów pamięta, skąd przyszedł (`ref_id`) —
    // półka pokaże przy nim znacznik dowodu. Sama kopia tekstu i tak jest
    // w dowodzie, więc późniejsza edycja dokumentu niczego nie podmienia.
    let source: { ref_id: string; title: string; module: string } | null = null;
    if (proof.docId) {
      const { data: doc } = await supabase
        .from("startup_documents")
        .select("id, title")
        .eq("id", proof.docId)
        .eq("startup_id", startupId)
        .maybeSingle();
      if (doc) source = { ref_id: doc.id as string, title: doc.title as string, module: "document" };
    }
    const snapshot = { ...base, text: proof.text.trim(), ...(source ?? {}) };
    return proofMatches(requirement, snapshot)
      ? { snapshot }
      : { error: proof.kind === "sentence" ? t("actions.wpiszJednoZdanieBez") : t("actions.describeResult") };
  }

  if (proof.kind === "select") {
    const snapshot = { ...base, option: proof.option };
    return proofMatches(requirement, snapshot)
      ? { snapshot }
      : { error: t("actions.wybierzJednaZOpcji") };
  }

  if (proof.kind === "scale") {
    const snapshot = { ...base, scale: proof.scale };
    return proofMatches(requirement, snapshot) ? { snapshot } : { error: t("actions.zaznaczWartoscNaSkali") };
  }

  if (proof.kind === "link") {
    const snapshot = { ...base, url: proof.url.trim(), note: proof.note.trim() };
    return proofMatches(requirement, snapshot)
      ? { snapshot }
      : { error: t("actions.podajAdresZaczynajacySie") };
  }

  if (proof.kind === "file") {
    const file = await resolveFile(supabase, startupId, proof);
    if ("error" in file) return file;
    const snapshot = { ...base, file: file.file };
    return proofMatches(requirement, snapshot)
      ? { snapshot }
      : { error: t("actions.wybierzPlikZTego") };
  }

  if (proof.kind === "module_result") {
    const { data: flow } = await supabase
      .from("workflows")
      .select("id, title, version, nodes, edges")
      .eq("id", proof.workflowId)
      .eq("startup_id", startupId)
      .maybeSingle();
    if (!flow) return { error: t("actions.nieMaTakiejRozpiski") };

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
      : { error: t("actions.najpierwZapiszRozpiske") };
  }

  if (proof.kind === "goal_set") {
    const ids = [...new Set(proof.goalIds)];
    const snapshot = { ...base, goal_ids: ids };
    if (!proofMatches(requirement, snapshot)) {
      return { error: t("actions.wskazWystarczajacaLiczbeRoznych") };
    }
    return { snapshot };
  }

  return { error: t("actions.tegoFormatuDowoduNie") };
}

async function resolveFile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  startupId: string,
  proof: Extract<ProofDraft, { kind: "file" }>
): Promise<{ error: string } | { file: { id: string | null; path: string; name: string; size: number } }> {
  const t = await getT("goals");
  if (proof.fileId) {
    const { data } = await supabase
      .from("startup_files")
      .select("id, name, storage_path, size_bytes")
      .eq("id", proof.fileId)
      .eq("startup_id", startupId)
      .maybeSingle();
    if (!data) return { error: t("actions.nieMaTakiegoPliku") };
    return {
      file: {
        id: data.id,
        path: data.storage_path,
        name: data.name,
        size: Number(data.size_bytes ?? 0),
      },
    };
  }

  if (!proof.path || !proof.name) return { error: t("actions.wybierzPlik") };
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
    return { error: t("actions.tenPlikNieNalezy") };
  }
  return {
    file: { id: null, path: proof.path, name: proof.name, size: proof.size ?? 0 },
  };
}

export async function reopenGoal(startupId: string, goalId: string): Promise<Result> {
  const t = await getT("goals");
  const ctx = await context(startupId);
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, role } = ctx;

  const goal = await loadGoal(supabase, startupId, goalId);
  if (!goal) return { error: t("actions.nieMaTakiegoCelu") };
  if (!canChangeOwnWork(role, user.id, goal.owner_id)) {
    return { error: t("actions.tenCelMozeOtworzyc") };
  }

  const { error } = await supabase
    .from("goals")
    .update({ status: "in_progress" })
    .eq("id", goalId);

  if (error) return { error: await translateDbError(error.message) };
  refresh();
  return { error: null, id: goalId };
}

export async function archiveGoal(startupId: string, goalId: string): Promise<Result> {
  const t = await getT("goals");
  const ctx = await context(startupId);
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, role } = ctx;

  const goal = await loadGoal(supabase, startupId, goalId);
  if (!goal) return { error: t("actions.nieMaTakiegoCelu") };
  if (!canChangeOwnWork(role, user.id, goal.owner_id)) {
    return { error: t("actions.archiwizujeWlascicielFounderAlbo") };
  }

  const { error } = await supabase
    .from("goals")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", goalId);

  if (error) return { error: await translateDbError(error.message) };
  refresh();
  return { error: null };
}

/** Przywrócenie z archiwum — cel wraca na listy i znów może się liczyć. */
export async function unarchiveGoal(startupId: string, goalId: string): Promise<Result> {
  const t = await getT("goals");
  const ctx = await context(startupId);
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, role } = ctx;

  const goal = await loadGoal(supabase, startupId, goalId);
  if (!goal) return { error: t("actions.nieMaTakiegoCelu") };
  if (!canChangeOwnWork(role, user.id, goal.owner_id)) {
    return { error: t("actions.przywracaWlascicielFounderAlbo") };
  }

  const { error } = await supabase.from("goals").update({ archived_at: null }).eq("id", goalId);
  if (error) return { error: await translateDbError(error.message) };
  refresh();
  return { error: null, id: goalId };
}

export async function linkGoal(
  startupId: string,
  goalId: string,
  conditionId: string
): Promise<Result> {
  const t = await getT("goals");
  const ctx = await context(startupId);
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, role } = ctx;

  const goal = await loadGoal(supabase, startupId, goalId);
  if (!goal) return { error: t("actions.nieMaTakiegoCelu") };
  if (!canAssignToOthers(role) && goal.owner_id !== user.id) {
    return { error: t("actions.podpiacCudzyCelMoze") };
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
    return { error: await translateDbError(error.message) };
  }

  refresh();
  return { error: null, id: goalId };
}

export async function unlinkGoal(
  startupId: string,
  goalId: string,
  conditionId: string
): Promise<Result> {
  const t = await getT("goals");
  const ctx = await context(startupId);
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, role } = ctx;

  const goal = await loadGoal(supabase, startupId, goalId);
  if (!goal) return { error: t("actions.nieMaTakiegoCelu") };
  if (!canAssignToOthers(role) && goal.owner_id !== user.id) {
    return { error: t("actions.odpiacCudzyCelMoze") };
  }

  const { error } = await supabase
    .from("goal_condition_links")
    .delete()
    .eq("condition_id", conditionId)
    .eq("goal_id", goalId);

  if (error) return { error: await translateDbError(error.message) };
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
  const t = await getT("goals");
  const ctx = await context(input.startupId);
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, role } = ctx;

  const goal = await loadGoal(supabase, input.startupId, input.goalId);
  if (!goal) return { error: t("actions.najpierwWybierzCelDo") };

  const title = input.title.trim();
  if (title.length < 2) return { error: t("actions.napiszCoJestDo") };

  let ownerId = input.ownerId || user.id;
  if (!canAssignToOthers(role)) {
    if (!canChangeOwnWork(role, user.id, goal.owner_id) && ownerId !== user.id) {
      return { error: t("actions.mozeszDodacZadanieSobie") };
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

  if (error || !data) return { error: await translateDbError(error?.message) };
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
  /** Z migracją 029. */
  note?: string | null;
  blockerNote?: string | null;
}): Promise<Result> {
  const t = await getT("goals");
  const ctx = await context(input.startupId);
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, role } = ctx;

  const { data: task } = await supabase
    .from("tasks")
    .select("id, owner_id, goal_id")
    .eq("id", input.taskId)
    .eq("startup_id", input.startupId)
    .maybeSingle();

  if (!task) return { error: t("actions.nieMaTakiegoZadania") };
  if (!canChangeOwnWork(role, user.id, task.owner_id)) {
    return { error: t("actions.toZadanieNalezyDo") };
  }

  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) {
    const title = input.title.trim();
    if (title.length < 2) return { error: t("actions.tytulZadaniaJestZa") };
    patch.title = title;
  }
  if (input.status) patch.status = input.status;
  if (input.dueDate !== undefined) patch.due_date = input.dueDate || null;
  if (input.note !== undefined) patch.note = input.note?.trim().slice(0, 2000) || null;
  if (input.blockerNote !== undefined) {
    patch.blocker_note = input.blockerNote?.trim().slice(0, 300) || null;
  }
  if (input.ownerId) {
    if (input.ownerId !== task.owner_id && !canAssignToOthers(role)) {
      return { error: t("actions.przypisacZadanieKomusInnemu") };
    }
    patch.owner_id = input.ownerId;
  }

  const { error } = await supabase.from("tasks").update(patch).eq("id", task.id);
  if (error) {
    if (error.message.includes("note") && error.message.includes("column")) {
      return { error: t("actions.notatkaIPowodBlokady") };
    }
    return { error: await translateDbError(error.message) };
  }
  refresh();
  return { error: null };
}

/**
 * Historia jednego zadania (029). Bez migracji — pusta lista i `available:
 * false`, żeby panel nie pokazywał sekcji, której nie ma czym wypełnić.
 */
export async function loadTaskEvents(
  startupId: string,
  taskId: string
): Promise<{ available: boolean; events: TaskEvent[] }> {
  const ctx = await context(startupId);
  if (!ctx.ok) return { available: false, events: [] };
  const { data, error } = await ctx.supabase
    .from("task_events")
    .select("id, kind, payload, created_at, actor_id, profiles!task_events_actor_id_fkey(full_name)")
    .eq("task_id", taskId)
    .eq("startup_id", startupId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) return { available: false, events: [] };
  type Row = {
    id: string;
    kind: TaskEvent["kind"];
    payload: Record<string, unknown> | null;
    created_at: string;
    profiles: { full_name: string | null } | null;
  };
  return {
    available: true,
    events: ((data ?? []) as unknown as Row[]).map((row) => ({
      id: row.id,
      kind: row.kind,
      createdAt: row.created_at,
      actorName: row.profiles?.full_name ?? null,
      payload: row.payload ?? {},
    })),
  };
}

/**
 * Usunięcie zadania. Ta sama reguła co polityka `tasks_delete` (025):
 * Founder albo Admin, autor zadania albo osoba, która je prowadzi.
 * Zadanie nie ma nic pod sobą, więc nie ma czego kaskadować ani sprzątać.
 */
export async function deleteTask(startupId: string, taskId: string): Promise<Result> {
  const t = await getT("goals");
  const ctx = await context(startupId);
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user, role } = ctx;

  const { data: task } = await supabase
    .from("tasks")
    .select("id, owner_id, created_by")
    .eq("id", taskId)
    .eq("startup_id", startupId)
    .maybeSingle();

  if (!task) return { error: t("actions.nieMaTakiegoZadania") };
  if (
    !canAssignToOthers(role) &&
    task.owner_id !== user.id &&
    task.created_by !== user.id
  ) {
    return { error: t("actions.usunacCudzeZadanieMoze") };
  }

  const { error } = await supabase.from("tasks").delete().eq("id", task.id);
  if (error) return { error: await translateDbError(error.message) };
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
  const t = await getT("goals");
  const ctx = await context(input.startupId);
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, user } = ctx;

  const goal = await loadGoal(supabase, input.startupId, input.goalId);
  if (!goal) return { error: t("actions.nieMaTakiegoCelu") };

  if (input.kind === "note") {
    const body = input.body?.trim() ?? "";
    if (body.length < 1) return { error: t("actions.notatkaJestPusta") };
    const { error } = await supabase.from("goal_materials").insert({
      startup_id: input.startupId,
      goal_id: input.goalId,
      kind: "note",
      body,
      created_by: user.id,
    });
    if (error) return { error: await translateDbError(error.message) };
  } else if (input.kind === "link") {
    const url = input.url?.trim() ?? "";
    if (!/^https?:\/\/\S+$/i.test(url)) return { error: t("actions.linkMusiZaczynacSie") };
    const { error } = await supabase.from("goal_materials").insert({
      startup_id: input.startupId,
      goal_id: input.goalId,
      kind: "link",
      url,
      created_by: user.id,
    });
    if (error) return { error: await translateDbError(error.message) };
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
    if (error) return { error: await translateDbError(error.message) };
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

  if (error) return { error: await translateDbError(error.message) };
  refresh();
  return { error: null };
}
