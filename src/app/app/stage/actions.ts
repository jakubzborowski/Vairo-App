"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  currentProgramEntry,
  ensureStartupStage,
  loadStageProgram,
  loadStageTree,
} from "@/lib/stage";
import { getActiveStartupId } from "@/lib/active-team";
import { getUserStartups, resolveActiveStartup } from "@/lib/startup";
import {
  getStageRole,
  getStartupRole,
  stageWriteError,
} from "@/lib/permissions";
import { translateDbError } from "@/lib/db-errors";
import { fieldAnswered, hasAnswer, type FieldConfig, type FieldKind, type StageDecision } from "@/types/stage";
import {
  VALIDATION_CATEGORIES,
  canTransferOwnership,
  type ValidationCategory,
} from "@/types/startup";

type Result = { error: string | null };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/**
 * Bramka zapisu dla wszystkiego, co dotyka treści etapu.
 *
 * Zwykły członek teamu czyta odpowiedzi, ale ich nie zmienia — tak samo mówi
 * RLS. Sprawdzamy to również tutaj, żeby zamiast błędu bazy wrócił komunikat,
 * z którego człowiek zrozumie, o co chodzi.
 */
async function guardStageWrite(
  supabase: Awaited<ReturnType<typeof createClient>>,
  startupStageId: string,
  userId: string
) {
  const { role } = await getStageRole(supabase, startupStageId, userId);
  return stageWriteError(role);
}

/**
 * Zapisuje odpowiedzi jednego podpunktu.
 *
 * Klucz to `answer_key`, nie `field_id` — dzięki temu pytanie powtórzone
 * w kilku kategoriach ma jedną wspólną odpowiedź, a nie kopie.
 * Pustą odpowiedź kasujemy, żeby trigger cofnął status podpunktu.
 */
export async function saveSubpointAnswers(input: {
  startupStageId: string;
  subpointId: string;
  answers: Record<string, unknown>;
}): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Sesja wygasła — zaloguj się ponownie." };

  // Uprawnienia i definicje pól nie zależą od siebie — jedna fala zamiast dwóch.
  const [{ role, startupId }, { data: fieldRows }] = await Promise.all([
    getStageRole(supabase, input.startupStageId, user.id),
    supabase
      .from("stage_fields")
      .select("answer_key, kind, config")
      .eq("subpoint_id", input.subpointId),
  ]);
  const denied = stageWriteError(role);
  if (denied) return { error: denied };

  const byKey = new Map(
    (fieldRows ?? []).map((row) => [
      row.answer_key as string,
      {
        kind: row.kind as FieldKind,
        config: (row.config ?? {}) as FieldConfig,
      },
    ])
  );

  const isFilled = (key: string, value: unknown) => {
    const field = byKey.get(key);
    return field ? fieldAnswered(field, value) : hasAnswer(value);
  };

  const entries = Object.entries(input.answers);

  // Pliki usunięte z pola znikają ze Storage dopiero po zapisie odpowiedzi.
  // Wcześniej „Usuń" w modalu kasował plik od razu — po anulowaniu okna
  // odpowiedź wskazywała plik, którego już nie było.
  const fileKeys = entries
    .map(([key]) => key)
    .filter((key) => byKey.get(key)?.kind === "files");
  const { data: previousFiles } =
    fileKeys.length > 0
      ? await supabase
          .from("stage_answers")
          .select("answer_key, value")
          .eq("startup_stage_id", input.startupStageId)
          .in("answer_key", fileKeys)
      : { data: [] as { answer_key: string; value: unknown }[] };

  const toUpsert = entries.filter(([key, value]) => isFilled(key, value));
  const toDelete = entries
    .filter(([key, value]) => !isFilled(key, value))
    .map(([key]) => key);

  if (toUpsert.length > 0) {
    const { error } = await supabase.from("stage_answers").upsert(
      toUpsert.map(([answer_key, value]) => ({
        startup_stage_id: input.startupStageId,
        answer_key,
        value,
        answered_by: user.id,
      })),
      { onConflict: "startup_stage_id,answer_key" }
    );
    if (error) return { error: translateDbError(error.message) };
  }

  if (toDelete.length > 0) {
    const { error } = await supabase
      .from("stage_answers")
      .delete()
      .eq("startup_stage_id", input.startupStageId)
      .in("answer_key", toDelete);
    if (error) return { error: translateDbError(error.message) };
  }

  const filePaths = (value: unknown) =>
    Array.isArray(value)
      ? value
          .map((item) => (item as { path?: unknown })?.path)
          .filter((path): path is string => typeof path === "string")
      : [];
  const kept = new Set(fileKeys.flatMap((key) => filePaths(input.answers[key])));
  const orphaned = (previousFiles ?? [])
    .flatMap((row) => filePaths(row.value))
    // Tylko pliki tego etapu — ścieżka zaczyna się od id instancji.
    .filter((path) => !kept.has(path) && path.startsWith(`${input.startupStageId}/`));
  if (orphaned.length > 0) {
    await supabase.storage.from("stage-files").remove(orphaned);
  }

  await Promise.all([
    // Zapamiętujemy, gdzie user skończył — wejście w /app wraca dokładnie tutaj.
    supabase
      .from("startup_stages")
      .update({ last_subpoint_id: input.subpointId })
      .eq("id", input.startupStageId),
    startupId
      ? syncStartupName(supabase, startupId, byKey, input.answers)
      : Promise.resolve(),
  ]);

  // Odpowiedź akcji niesie już przerenderowaną stronę — klient nie musi
  // dodatkowo wołać `router.refresh()`.
  revalidatePath("/app/stage");
  revalidatePath("/app");
  return { error: null };
}

/**
 * Pole z `syncs_startup_name` nadaje nazwę startupowi — w Ambition Stage
 * robi to punkt „Nadaj projektowi roboczą nazwę".
 *
 * Definicje pól i `startup_id` przychodzą od wywołującego — wcześniej ta
 * funkcja pobierała je drugi raz, dwa zapytania po kolei przy każdym zapisie.
 */
async function syncStartupName(
  supabase: Awaited<ReturnType<typeof createClient>>,
  startupId: string,
  fields: Map<string, { config: FieldConfig }>,
  answers: Record<string, unknown>
) {
  const syncKey = Object.keys(answers).find(
    (key) =>
      (fields.get(key)?.config as { syncs_startup_name?: boolean } | undefined)
        ?.syncs_startup_name
  );
  if (!syncKey) return;

  const value = answers[syncKey];
  if (typeof value !== "string" || value.trim().length < 2) return;

  await supabase
    .from("startups")
    .update({ name: value.trim().slice(0, 80) })
    .eq("id", startupId);
}

/** Zapamiętuje ostatnio otwarty podpunkt (bez zapisu odpowiedzi). */
export async function rememberSubpoint(startupStageId: string, subpointId: string) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  if (await guardStageWrite(supabase, startupStageId, user.id)) return;
  await supabase
    .from("startup_stages")
    .update({ last_subpoint_id: subpointId })
    .eq("id", startupStageId);
}

/**
 * Domyka etap wraz z decyzją.
 *
 * Guidelines (10.5): zamknięcie zapisuje snapshot odpowiedzi i decyzję, a
 * dopiero potem odblokowuje kolejny etap. Cztery warianty:
 *   • continue — idziemy dalej,
 *   • pivot    — zmieniamy kierunek, etap zostaje otwarty, wskazane podpunkty
 *                wracają do wypełnienia (poprzednie odpowiedzi zostają
 *                w snapshocie),
 *   • pause    — startup na pauzie,
 *   • archive  — startup do archiwum.
 *
 * Cała zmiana dzieje się w jednej transakcji w bazie (`close_stage`), więc nie
 * ma stanu, w którym etap jest zamknięty, a decyzja nie została zapisana.
 */
export async function closeStage(input: {
  startupStageId: string;
  decision: StageDecision;
  note?: string;
  reopenSubpointIds?: string[];
}): Promise<Result & { next?: string }> {
  return runCloseStage(input, { requireReady: true });
}

/**
 * Czy wszystkie wymagane podpunkty są domknięte — liczone tym samym drzewem,
 * które rysuje ekran etapu. `close_stage` w bazie tego nie sprawdza, więc bez
 * tej bramki wystarczyło wywołać akcję z pominięciem przycisku, żeby zamknąć
 * niedokończony etap i odblokować kolejny.
 */
async function stageReadyToFinish(
  supabase: Awaited<ReturnType<typeof createClient>>,
  startupStageId: string,
  startupId: string
) {
  const { data: rows } = await supabase
    .from("startup_categories")
    .select("category")
    .eq("startup_id", startupId);
  const categories = Array.from(
    new Set<ValidationCategory>([
      "general",
      ...((rows ?? []).map((row) => row.category) as ValidationCategory[]),
    ])
  );
  const tree = await loadStageTree(supabase, {
    startupStageId,
    activeCategories: categories,
    role: null,
  });
  return Boolean(tree?.canFinish);
}

// Nieeksportowana: flaga `requireReady` nie może przyjść od klienta.
// Pomija ją wyłącznie domknięcie szkieletu etapu bez treści.
async function runCloseStage(
  input: {
    startupStageId: string;
    decision: StageDecision;
    note?: string;
    reopenSubpointIds?: string[];
  },
  options: { requireReady: boolean }
): Promise<Result & { next?: string }> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Sesja wygasła — zaloguj się ponownie." };

  const { role } = await getStageRole(supabase, input.startupStageId, user.id);
  const denied = stageWriteError(role);
  if (denied) return { error: denied };
  // Archiwum to decyzja Foundera (CLAUDE.md, tabela ról) — tak samo jak
  // w ustawieniach teamu. `close_stage` w bazie wpuszcza też Admina.
  if (input.decision === "archive" && (!role || !canTransferOwnership(role))) {
    return { error: "Do archiwum może przenieść tylko Founder." };
  }

  const { data: stage } = await supabase
    .from("startup_stages")
    .select("id, startup_id, stage_templates(key)")
    .eq("id", input.startupStageId)
    .maybeSingle();

  if (!stage) return { error: "Nie znaleziono etapu." };

  const templateKey =
    (stage.stage_templates as unknown as { key: string } | null)?.key ?? "";

  // Pauza, archiwum i pivot to decyzje, które da się podjąć w każdej chwili.
  // „Idziemy dalej" wymaga domkniętych wymagań etapu.
  if (
    options.requireReady &&
    input.decision === "continue" &&
    !(await stageReadyToFinish(supabase, input.startupStageId, stage.startup_id))
  ) {
    return {
      error:
        "Ten etap ma jeszcze nieuzupełnione podpunkty. Odśwież stronę — lista pokaże, czego brakuje.",
    };
  }

  const { error } = await supabase.rpc("close_stage", {
    p_startup_stage_id: input.startupStageId,
    p_decision: input.decision,
    p_note: input.note?.trim() || null,
    p_reopen_subpoints:
      input.decision === "pivot" ? (input.reopenSubpointIds ?? []) : null,
  });

  if (error) return { error: translateStageError(error.message) };

  // Cały layout: menu boczne pokazuje Cele, Taski i Rozpiskę dopiero po
  // domknięciu Preparation, a przełącznik teamu rysuje kreski etapów.
  revalidatePath("/app", "layout");

  if (input.decision !== "continue") {
    // Pivot zostawia etap otwarty, pauza i archiwum nie otwierają kolejnego.
    return { error: null, next: "/app/stage" };
  }

  // Ambition prowadzi przez podsumowanie, a nie prosto do wyboru kategorii.
  // Bez tego nikt nie pokazywał człowiekowi, co właśnie ustalił przez pół godziny.
  if (templateKey === "ambition") {
    // Wybór kategorii tylko na wejściu w Idea. Startup, który zaczął od
    // gotowego pomysłu i uzupełnił Ambition później, ma Idea za sobą —
    // pytanie o kategorie w środku programu zmieniałoby mu wymagania.
    const { count: ideaStarted } = await supabase
      .from("startup_stages")
      .select("id, stage_templates!inner(key)", { count: "exact", head: true })
      .eq("startup_id", stage.startup_id)
      .eq("stage_templates.key", "idea");
    return {
      error: null,
      next: ideaStarted
        ? "/app/stage/summary?stage=ambition"
        : "/app/stage/summary?stage=ambition&next=categories",
    };
  }

  // MVP Stage kończy program ekranem z wynikami i prostą ofertą dalszej współpracy (§1C).
  if (templateKey === "mvp") {
    return { error: null, next: "/app/stage/complete" };
  }

  return { error: null, next: "/app" };
}

/**
 * Domknięcie bez pytania o decyzję — dla etapów, które jej nie mają
 * (Ambition kończy się wyborem kategorii, nie oceną pomysłu).
 */
export async function finishStage(startupStageId: string) {
  return closeStage({ startupStageId, decision: "continue" });
}

function translateStageError(message: string) {
  if (message.includes("not_allowed")) {
    return "Tylko Founder i Admin mogą zamknąć etap.";
  }
  if (message.includes("stage_not_found")) return "Nie znaleziono etapu.";
  if (message.includes("close_stage") && message.includes("does not exist")) {
    return "Brakuje migracji 010 — odpal ją w Supabase → SQL Editor.";
  }
  return translateDbError(message) ?? "Nie udało się zapisać decyzji. Spróbuj jeszcze raz.";
}

/** Ponowne otwarcie domkniętego etapu — user może wrócić i poprawić. */
export async function reopenStage(startupStageId: string): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Sesja wygasła — zaloguj się ponownie." };

  const denied = await guardStageWrite(supabase, startupStageId, user.id);
  if (denied) return { error: denied };

  const { data, error } = await supabase
    .from("startup_stages")
    .update({ status: "in_progress", completed_at: null })
    .eq("id", startupStageId)
    .select("id");

  if (error) return { error: translateDbError(error.message) };
  // RLS przy braku uprawnień nie zwraca błędu, tylko zero wierszy.
  if (!data || data.length === 0) {
    return { error: "Nie udało się otworzyć etapu. Odśwież stronę i spróbuj ponownie." };
  }

  revalidatePath("/app", "layout");
  return { error: null };
}

/**
 * Wybór kategorii po Ambition Stage.
 *
 * Na starcie Ambition człowiek nie wie jeszcze, czy buduje SaaS, czy
 * urządzenie — dowiaduje się tego dopiero, wypełniając etap. Dlatego
 * kategorie wybiera dopiero tutaj, wchodząc w Idea Stage.
 */
export async function chooseCategoriesAfterAmbition(
  formData: FormData
): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Sesja wygasła — zaloguj się ponownie." };

  const startupId = String(formData.get("startup_id") ?? "");
  if (!startupId) return { error: "Brak kontekstu teamu." };

  const role = await getStartupRole(supabase, startupId, user.id);
  const denied = stageWriteError(role);
  if (denied) return { error: denied };

  const categories = String(formData.get("categories") ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter((c): c is ValidationCategory =>
      (VALIDATION_CATEGORIES as readonly string[]).includes(c) && c !== "general"
    );

  const tagIds = String(formData.get("tag_ids") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  // Najpierw dopisujemy wybrane, potem usuwamy odznaczone. Odwrotna kolejność
  // przy błędzie zapisu zostawiała startup bez żadnej kategorii poza general.
  if (categories.length > 0) {
    const { error } = await supabase
      .from("startup_categories")
      .upsert(
        categories.map((category) => ({ startup_id: startupId, category })),
        { onConflict: "startup_id,category", ignoreDuplicates: true }
      );
    if (error) return { error: translateDbError(error.message) };
  }
  {
    let removal = supabase
      .from("startup_categories")
      .delete()
      .eq("startup_id", startupId)
      .neq("category", "general");
    if (categories.length > 0) {
      removal = removal.not("category", "in", `(${categories.join(",")})`);
    }
    const { error } = await removal;
    if (error) return { error: translateDbError(error.message) };
  }

  if (tagIds.length > 0) {
    const { error } = await supabase
      .from("startup_tags")
      .upsert(
        tagIds.map((tag_id) => ({ startup_id: startupId, tag_id })),
        { onConflict: "startup_id,tag_id", ignoreDuplicates: true }
      );
    if (error) return { error: translateDbError(error.message) };
  }
  {
    let removal = supabase.from("startup_tags").delete().eq("startup_id", startupId);
    if (tagIds.length > 0) {
      removal = removal.not("tag_id", "in", `(${tagIds.join(",")})`);
    }
    const { error } = await removal;
    if (error) return { error: translateDbError(error.message) };
  }

  const stageId = await ensureStartupStage(supabase, startupId, "idea");
  if (!stageId) {
    return { error: "Treść Idea Stage nie jest jeszcze wgrana do bazy." };
  }

  revalidatePath("/app", "layout");

  // Bez tego formularz dostawał „zapisane" i nic się nie działo — user zostawał
  // na ekranie kategorii, bo jedyną informacją zwrotną był brak błędu.
  redirect("/app/stage");
}

/**
 * Domknięcie szkieletu etapu bez treści (np. Execution zanim wjedzie JSON).
 * Zakłada instancję i od razu zamyka ją decyzją „continue”, żeby program
 * mógł przejść dalej — jawnie, przyciskiem Foundera/Admina.
 */
export async function advanceSkeletonStage(formData: FormData) {
  const stageKey = String(formData.get("stage_key") ?? "").trim();
  if (!stageKey) return;

  const { supabase, user } = await requireUser();
  if (!user) return;

  const [startups, activeTeamId] = await Promise.all([
    getUserStartups(supabase, user.id),
    getActiveStartupId(),
  ]);
  const active = resolveActiveStartup(startups, activeTeamId);
  if (!active) return;

  const denied = stageWriteError(active.role);
  if (denied) return;

  const { data: template } = await supabase
    .from("stage_templates")
    .select("id, published_at")
    .eq("key", stageKey)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Tylko szkielet — gdy treść już jest, domknięcie idzie normalną ścieżką etapu.
  if (!template || template.published_at) return;

  const stageId = await ensureStartupStage(supabase, active.id, stageKey);
  if (!stageId) return;

  await runCloseStage(
    { startupStageId: stageId, decision: "continue" },
    { requireReady: false }
  );

  // Po szkielecie zawsze wracamy do etapu — bieżący program powinien wskazać
  // kolejny z treścią (np. MVP), a nie dashboard.
  redirect("/app/stage");
}

/**
 * Jawne otwarcie pominiętego etapu.
 *
 * Wcześniej wystarczyło kliknąć w pominięty etap na pasku, żeby aplikacja
 * po cichu założyła jego instancję — a wtedy program „cofał się" i kazał
 * uzupełniać coś, czego user nigdy nie wybrał. Założenie etapu jest decyzją,
 * więc musi być osobnym kliknięciem, a nie skutkiem ubocznym oglądania.
 */
export async function openStage(formData: FormData) {
  const stageKey = String(formData.get("stage_key") ?? "").trim();
  if (!stageKey) return;

  const { supabase, user } = await requireUser();
  if (!user) return;

  const [startups, activeTeamId] = await Promise.all([
    getUserStartups(supabase, user.id),
    getActiveStartupId(),
  ]);
  const active = resolveActiveStartup(startups, activeTeamId);
  if (!active) return;

  const denied = stageWriteError(active.role);
  if (denied) return;

  // Otworzyć da się tylko etap pominięty — czyli leżący przed bieżącym.
  // Założenie instancji etapu z przyszłości przesuwałoby program do przodu
  // z pominięciem wszystkiego po drodze.
  const program = await loadStageProgram(supabase, active.id);
  const current = currentProgramEntry(program);
  const target = program.find((item) => item.key === stageKey);
  if (!target || !current || target.position >= current.position) {
    redirect("/app/stage");
  }

  await ensureStartupStage(supabase, active.id, stageKey);

  revalidatePath("/app", "layout");
  redirect(`/app/stage?stage=${stageKey}`);
}
