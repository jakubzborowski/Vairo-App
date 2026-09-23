import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  StartupContext,
  StartupRole,
  StartupStatus,
  ValidationCategory,
} from "@/types/startup";

type MemberRow = {
  role: StartupRole;
  startups: {
    id: string;
    name: string;
    logo_url: string | null;
    status: StartupStatus;
  } | null;
};

/**
 * Wszystkie startupy zalogowanego usera wraz z rolą, kategoriami i postępem
 * bieżącego etapu. Jedno zapytanie na listę członkostw + po jednym na
 * kategorie i etapy — bez N+1.
 */
export async function getUserStartups(
  supabase: SupabaseClient,
  userId: string
): Promise<StartupContext[]> {
  const { data: memberRows, error } = await supabase
    .from("startup_members")
    .select("role, startups(id, name, logo_url, status)")
    .eq("profile_id", userId)
    .order("joined_at", { ascending: true });

  if (error) {
    // Przed migracją 003 tabela nie istnieje — nie wywracamy przez to aplikacji.
    if (!isMissingRelation(error.message)) {
      console.error("[getUserStartups]", error.message);
    }
    return [];
  }

  const rows = (memberRows ?? []) as unknown as MemberRow[];
  const startups = rows
    .map((row) => (row.startups ? { ...row.startups, role: row.role } : null))
    .filter(Boolean) as (MemberRow["startups"] & { role: StartupRole })[];

  if (startups.length === 0) return [];

  const ids = startups.map((s) => s.id);

  const [{ data: categoryRows }, { data: stageRows }] = await Promise.all([
    supabase
      .from("startup_categories")
      .select("startup_id, category")
      .in("startup_id", ids),
    supabase
      .from("startup_stages")
      .select(
        "id, startup_id, status, stage_templates(key, title, position)"
      )
      .in("startup_id", ids),
  ]);

  const categoriesByStartup = new Map<string, ValidationCategory[]>();
  for (const row of categoryRows ?? []) {
    const list = categoriesByStartup.get(row.startup_id) ?? [];
    list.push(row.category as ValidationCategory);
    categoriesByStartup.set(row.startup_id, list);
  }

  // Bieżący etap = pierwszy nieukończony, a gdy wszystkie zamknięte — ostatni.
  type StageRow = {
    id: string;
    startup_id: string;
    status: "in_progress" | "completed";
    stage_templates: { key: string; title: string; position: number } | null;
  };
  const stagesByStartup = new Map<string, StageRow[]>();
  for (const row of (stageRows ?? []) as unknown as StageRow[]) {
    const list = stagesByStartup.get(row.startup_id) ?? [];
    list.push(row);
    stagesByStartup.set(row.startup_id, list);
  }

  const progressByStage = await countProgress(
    supabase,
    (stageRows ?? []) as unknown as StageRow[],
    categoriesByStartup
  );

  return startups.map((startup) => {
    const stages = (stagesByStartup.get(startup.id) ?? []).sort(
      (a, b) => (a.stage_templates?.position ?? 0) - (b.stage_templates?.position ?? 0)
    );
    // Ta sama reguła co w `currentProgramEntry`: liczy się najdalszy
    // rozpoczęty etap. Powrót do wcześniejszego nie cofa całego programu.
    const started = stages.filter((s) => s.status === "in_progress" || s.status === "completed");
    const furthest = started.at(-1);
    const current =
      furthest && furthest.status === "completed"
        ? (stages[stages.indexOf(furthest) + 1] ?? furthest)
        : (furthest ?? stages.at(-1));

    return {
      id: startup.id,
      name: startup.name,
      logoUrl: startup.logo_url,
      status: startup.status,
      role: startup.role,
      categories: categoriesByStartup.get(startup.id) ?? ["general"],
      stage: current?.stage_templates
        ? {
            key: current.stage_templates.key,
            title: current.stage_templates.title,
            status: current.status,
            done: progressByStage.get(current.id)?.done ?? 0,
            total: progressByStage.get(current.id)?.total ?? 0,
          }
        : null,
    };
  });
}

/**
 * Liczba ukończonych i wszystkich wymaganych podpunktów dla podanych etapów.
 *
 * Mianownik musi być liczony DOKŁADNIE tak samo jak na ekranie etapu, inaczej
 * dashboard pokazuje „4 z 77", a etap „4 z 12" — a człowiek niepewny siebie
 * czyta dwie różne liczby jako „coś jest zepsute albo ja czegoś nie rozumiem".
 *
 * Stąd dwa warunki, o których łatwo zapomnieć:
 *   • liczą się wyłącznie kategorie aktywne dla danego startupu,
 *   • pytania współdzielone (`shared_key`) to JEDNA pozycja, nie tyle, ile
 *     kategorii je powtarza.
 */
async function countProgress(
  supabase: SupabaseClient,
  stages: {
    id: string;
    startup_id: string;
    template_id?: string;
  }[],
  categoriesByStartup: Map<string, ValidationCategory[]>
) {
  const result = new Map<string, { done: number; total: number }>();
  if (stages.length === 0) return result;

  const stageIds = stages.map((s) => s.id);

  const [{ data: progressRows }, { data: stageRows }, { data: subpointRows }] =
    await Promise.all([
      supabase
        .from("stage_subpoint_progress")
        .select("startup_stage_id, subpoint_id, is_complete")
        .in("startup_stage_id", stageIds),
      supabase
        .from("startup_stages")
        .select("id, startup_id, template_id")
        .in("id", stageIds),
      supabase
        .from("stage_subpoints")
        .select(
          "id, shared_key, stage_points!inner(stage_categories!inner(key, template_id))"
        )
        .eq("is_optional", false),
    ]);

  type SubpointRow = {
    id: string;
    shared_key: string | null;
    stage_points: { stage_categories: { key: string; template_id: string } } | null;
  };

  // templateId → lista podpunktów z kategorią i kluczem logicznym
  const byTemplate = new Map<
    string,
    { id: string; key: string; category: string }[]
  >();

  for (const row of (subpointRows ?? []) as unknown as SubpointRow[]) {
    const category = row.stage_points?.stage_categories;
    if (!category) continue;
    const list = byTemplate.get(category.template_id) ?? [];
    list.push({
      id: row.id,
      key: row.shared_key ?? row.id,
      category: category.key,
    });
    byTemplate.set(category.template_id, list);
  }

  const completedBy = new Map<string, Set<string>>();
  for (const row of progressRows ?? []) {
    if (!row.is_complete) continue;
    const set = completedBy.get(row.startup_stage_id) ?? new Set<string>();
    set.add(row.subpoint_id as string);
    completedBy.set(row.startup_stage_id, set);
  }

  for (const stage of (stageRows ?? []) as {
    id: string;
    startup_id: string;
    template_id: string;
  }[]) {
    const active = new Set(categoriesByStartup.get(stage.startup_id) ?? ["general"]);
    const subpoints = (byTemplate.get(stage.template_id) ?? []).filter((s) =>
      active.has(s.category)
    );

    const completedIds = completedBy.get(stage.id) ?? new Set<string>();
    const allKeys = new Set<string>();
    const doneKeys = new Set<string>();

    for (const subpoint of subpoints) {
      allKeys.add(subpoint.key);
      if (completedIds.has(subpoint.id)) doneKeys.add(subpoint.key);
    }

    result.set(stage.id, { done: doneKeys.size, total: allKeys.size });
  }

  return result;
}

/** Aktywny workspace: ten z ?team=, a jak go nie ma — pierwszy z listy. */
export function resolveActiveStartup(
  startups: StartupContext[],
  requestedId?: string | null
) {
  if (startups.length === 0) return null;
  if (requestedId) {
    const match = startups.find((s) => s.id === requestedId);
    if (match) return match;
  }
  return startups[0] ?? null;
}

function isMissingRelation(message: string) {
  return (
    message.includes("does not exist") ||
    message.includes("schema cache") ||
    message.includes("relation")
  );
}
