import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fieldAnswered,
  matchesSkip,
  type FieldConfig,
  type FieldKind,
  type SkipWhen,
  type StageCategory,
  type StagePoint,
  type StageSubpoint,
  type StageTree,
} from "@/types/stage";
import {
  CATEGORY_LABELS,
  canEditStageData,
  type StartupRole,
  type ValidationCategory,
} from "@/types/startup";
import { loadSubpointGoalConditions } from "@/lib/goals";

type RawField = {
  id: string;
  key: string;
  kind: FieldKind;
  question: string;
  help: string | null;
  example: string | null;
  is_required: boolean;
  shared_key: string | null;
  answer_key: string;
  config: FieldConfig | null;
  position: number;
};

type RawSubpoint = {
  id: string;
  key: string;
  title: string;
  description: string | null;
  is_optional: boolean;
  shared_key: string | null;
  skip_when: SkipWhen | null;
  depends_on: string[] | null;
  position: number;
  fields: RawField[] | null;
};

type RawPoint = {
  id: string;
  key: string;
  title: string;
  description: string | null;
  duration_hint: string | null;
  guide_body: string | null;
  guide_sources: string[] | null;
  guide_source_label: string | null;
  position: number;
  subpoints: RawSubpoint[] | null;
};

type RawCategory = {
  id: string;
  key: string;
  title: string;
  intro: string | null;
  position: number;
  points: RawPoint[] | null;
};

const byPosition = <T extends { position: number }>(a: T, b: T) =>
  a.position - b.position;

/**
 * Zakłada etap dla startupu, jeśli jeszcze go nie ma.
 * Zwraca id wiersza `startup_stages` albo null, gdy szablon nie jest wgrany.
 */
export async function ensureStartupStage(
  supabase: SupabaseClient,
  startupId: string,
  templateKey: string
): Promise<string | null> {
  const { data: template } = await supabase
    .from("stage_templates")
    .select("id")
    .eq("key", templateKey)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!template) return null;

  const { data: existing } = await supabase
    .from("startup_stages")
    .select("id")
    .eq("startup_id", startupId)
    .eq("template_id", template.id)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("startup_stages")
    .insert({ startup_id: startupId, template_id: template.id })
    .select("id")
    .single();

  if (error) {
    console.error("[ensureStartupStage]", error.message);
    return null;
  }
  return created.id;
}

/**
 * Składa całe drzewo etapu dla konkretnego startupu:
 * kategorie (tylko aktywne) → punkty → podpunkty → pola, z odpowiedziami
 * i policzonym postępem.
 *
 * Duplikaty (to samo pytanie w kilku kategoriach) zwijamy tutaj, a nie przy
 * imporcie — która kategoria „wygrywa", zależy od tego, jakie kategorie ma
 * dany startup.
 */
export async function loadStageTree(
  supabase: SupabaseClient,
  params: {
    startupStageId: string;
    activeCategories: ValidationCategory[];
    /** Rola w teamie decyduje, czy ekran jest edytowalny czy tylko do odczytu. */
    role: StartupRole | null;
  }
): Promise<StageTree | null> {
  type StageRow = {
    id: string;
    startup_id: string;
    status: "in_progress" | "completed";
    last_subpoint_id: string | null;
    template_id: string;
    stage_templates: {
      key: string;
      title: string;
      subtitle: string | null;
      intro: string | null;
      finish_label: string | null;
    } | null;
  };

  const { data: stageRow } = await supabase
    .from("startup_stages")
    .select(
      "id, startup_id, status, last_subpoint_id, template_id, " +
        "stage_templates(key, title, subtitle, intro, finish_label)"
    )
    .eq("id", params.startupStageId)
    .maybeSingle();

  const stage = stageRow as unknown as StageRow | null;
  if (!stage) return null;

  const template = stage.stage_templates;
  const [goalConditions, { data: progressRows }] = await Promise.all([
    loadSubpointGoalConditions(supabase, stage.startup_id, stage.id),
    supabase
      .from("stage_subpoint_progress")
      .select("subpoint_id, is_complete")
      .eq("startup_stage_id", stage.id),
  ]);
  const storedComplete = new Map(
    (progressRows ?? []).map((row) => [row.subpoint_id as string, Boolean(row.is_complete)])
  );

  const treeSelect = (withSkip: boolean, withDepends = withSkip) =>
    supabase
      .from("stage_categories")
      .select(
        `id, key, title, intro, position,
         points:stage_points(
           id, key, title, description, duration_hint,
           guide_body, guide_sources, guide_source_label, position,
           subpoints:stage_subpoints(
             id, key, title, description, is_optional, shared_key, ${
               withSkip ? `skip_when, ${withDepends ? "depends_on, " : ""}` : ""
             }position,
             fields:stage_fields(
               id, key, kind, question, help, example,
               is_required, shared_key, answer_key, config, position
             )
           )
         )`
      )
      .eq("template_id", stage.template_id)
      .in("key", params.activeCategories);

  const [categoryResult, { data: answerRows }] = await Promise.all([
    treeSelect(true),
    supabase
      .from("stage_answers")
      .select("answer_key, value")
      .eq("startup_stage_id", params.startupStageId),
  ]);

  // Kolumna skip_when powstaje w migracji 016. Zanim ktoś ją odpali,
  // etapy Ambition i Idea mają się dalej otwierać.
  const categoryRows = categoryResult.error?.message.includes("depends_on")
    ? (await treeSelect(true, false)).data
    : categoryResult.error?.message.includes("skip_when")
      ? (await treeSelect(false)).data
      : categoryResult.data;

  const answers: Record<string, unknown> = {};
  for (const row of answerRows ?? []) answers[row.answer_key] = row.value;

  const raw = ((categoryRows ?? []) as unknown as RawCategory[]).sort(byPosition);

  // Zwijanie duplikatów: pierwsza kategoria w kolejności wygrywa,
  // pozostałe tylko dopisują się do etykiety „dotyczy też".
  const seenSubpoints = new Map<string, StageSubpoint>();

  const categories: StageCategory[] = raw.map((rawCategory) => {
    const points: StagePoint[] = (rawCategory.points ?? [])
      .sort(byPosition)
      .map((rawPoint) => {
        const subpoints: StageSubpoint[] = [];

        for (const rawSubpoint of (rawPoint.subpoints ?? []).sort(byPosition)) {
          if (rawSubpoint.shared_key) {
            const existing = seenSubpoints.get(rawSubpoint.shared_key);
            if (existing) {
              const label = CATEGORY_LABELS[rawCategory.key as ValidationCategory];
              if (label && !existing.alsoIn.includes(label)) {
                existing.alsoIn.push(label);
              }
              continue;
            }
          }

          const fields = (rawSubpoint.fields ?? []).sort(byPosition).map((f) => ({
            id: f.id,
            key: f.key,
            kind: f.kind,
            question: f.question,
            help: f.help,
            example: f.example,
            isRequired: f.is_required,
            answerKey: f.answer_key,
            config: f.config ?? {},
          }));

          const skipped = matchesSkip(rawSubpoint.skip_when, answers);
          const hasRequired = fields.some((f) => f.isRequired);
          const fieldsOk = fields
            .filter((f) => f.isRequired)
            .every((f) => fieldAnswered(f, answers[f.answerKey]));
          const conds = goalConditions.get(rawSubpoint.id) ?? [];
          const goalsOk = conds.every((condition) => condition.done >= condition.minCount);
          const liveComplete = skipped || ((hasRequired ? fieldsOk : true) && goalsOk);
          // Zamknięty etap trzyma swój wynik. Późniejsza zmiana celu
          // nie odbiera mu odhaczenia zapisanego przy zamknięciu.
          const frozen =
            stage.status === "completed" && storedComplete.get(rawSubpoint.id) === true;
          const shownConditions = frozen
            ? conds.map((condition) => ({
                ...condition,
                done: Math.max(condition.done, condition.minCount),
              }))
            : conds;

          const subpoint: StageSubpoint = {
            id: rawSubpoint.id,
            key: rawSubpoint.key,
            title: rawSubpoint.title,
            description: rawSubpoint.description,
            isOptional: rawSubpoint.is_optional,
            sharedKey: rawSubpoint.shared_key,
            fields,
            goalConditions: shownConditions,
            dependsOn: rawSubpoint.depends_on ?? [],
            waitingOn: null,
            isComplete:
              stage.status === "completed" && storedComplete.has(rawSubpoint.id)
                ? skipped || storedComplete.get(rawSubpoint.id) === true
                : liveComplete,
            skipped,
            skipWhen: rawSubpoint.skip_when,
            alsoIn: [],
          };

          if (rawSubpoint.shared_key) {
            seenSubpoints.set(rawSubpoint.shared_key, subpoint);
          }
          subpoints.push(subpoint);
        }

        const counted = subpoints.filter((s) => !s.isOptional && !s.skipped);

        return {
          id: rawPoint.id,
          key: rawPoint.key,
          title: rawPoint.title,
          description: rawPoint.description,
          durationHint: rawPoint.duration_hint,
          guideBody: rawPoint.guide_body,
          guideSources: rawPoint.guide_sources ?? [],
          guideSourceLabel: rawPoint.guide_source_label,
          subpoints,
          done: counted.filter((s) => s.isComplete).length,
          total: counted.length,
          isComplete: counted.every((s) => s.isComplete),
        };
      });

    const done = points.reduce((sum, p) => sum + p.done, 0);
    const total = points.reduce((sum, p) => sum + p.total, 0);

    return {
      id: rawCategory.id,
      key: rawCategory.key,
      title: rawCategory.title,
      intro: rawCategory.intro,
      points,
      done,
      total,
      isComplete: total > 0 && done === total,
    };
  });

  const byRef = new Map<string, StageSubpoint>();
  for (const category of categories) {
    for (const point of category.points) {
      for (const subpoint of point.subpoints) {
        byRef.set(`${point.key}.${subpoint.key}`, subpoint);
      }
    }
  }
  const baseComplete = new Map(
    [...byRef.values()].map((subpoint) => [subpoint.id, subpoint.isComplete])
  );
  for (let pass = 0; pass < 8; pass += 1) {
    let changed = false;
    for (const [ref, subpoint] of byRef) {
      if (subpoint.skipped) continue;
      const waiting = subpoint.dependsOn.filter((dep) => {
        const earlier = byRef.get(dep);
        return earlier ? !earlier.isComplete && !earlier.skipped : false;
      });
      const next = Boolean(baseComplete.get(subpoint.id)) && waiting.length === 0;
      if (next !== subpoint.isComplete) {
        subpoint.isComplete = next;
        changed = true;
      }
      subpoint.waitingOn =
        waiting.length > 0 ? "Czeka na wcześniejszy wynik" : null;
      void ref;
    }
    if (!changed) break;
  }
  for (const category of categories) {
    let categoryDone = 0;
    let categoryTotal = 0;
    for (const point of category.points) {
      const counted = point.subpoints.filter((subpoint) => !subpoint.isOptional && !subpoint.skipped);
      point.done = counted.filter((subpoint) => subpoint.isComplete).length;
      point.total = counted.length;
      point.isComplete = counted.length > 0 && point.done === counted.length;
      categoryDone += point.done;
      categoryTotal += point.total;
    }
    category.done = categoryDone;
    category.total = categoryTotal;
    category.isComplete = categoryTotal > 0 && categoryDone === categoryTotal;
  }

  const done = categories.reduce((sum, c) => sum + c.done, 0);
  const total = categories.reduce((sum, c) => sum + c.total, 0);

  return {
    startupStageId: stage.id,
    templateKey: template?.key ?? "",
    title: template?.title ?? "Etap",
    subtitle: template?.subtitle ?? null,
    intro: template?.intro ?? null,
    finishLabel: template?.finish_label ?? null,
    status: stage.status,
    showCategories: categories.length > 1,
    categories,
    answers,
    lastSubpointId: stage.last_subpoint_id,
    done,
    total,
    canFinish: total > 0 && done === total,
    canEdit: params.role ? canEditStageData(params.role) : false,
  };
}

/** Pierwszy nieukończony podpunkt — do przycisku „Kontynuuj". */
export function findNextSubpoint(tree: StageTree) {
  for (const category of tree.categories) {
    for (const point of category.points) {
      for (const subpoint of point.subpoints) {
        if (!subpoint.isComplete && !subpoint.isOptional && !subpoint.skipped) {
          return { category, point, subpoint };
        }
      }
    }
  }
  return null;
}

/**
 * Program etapow widziany oczami jednego startupu.
 *
 * Kolejnosc i tytuly biora sie z tabeli `stage_templates`, nie z listy zaszytej
 * w kodzie — dzieki temu dodanie kolejnego etapu to migracja, a nie zmiana
 * w trzech komponentach. `hasContent = false` znaczy „struktura juz jest,
 * pytan jeszcze nie ma" (Preparation, Execution, MVP po migracji 008).
 */
export type StageProgramEntry = {
  templateId: string;
  key: string;
  title: string;
  subtitle: string | null;
  intro: string | null;
  finishLabel: string | null;
  position: number;
  hasContent: boolean;
  startupStageId: string | null;
  status: "not_started" | "in_progress" | "completed";
};

export async function loadStageProgram(
  supabase: SupabaseClient,
  /** null = sam program, bez postępu. Ktoś bez teamu też ma prawo go zobaczyć. */
  startupId: string | null
): Promise<StageProgramEntry[]> {
  const [{ data: templateRows }, { data: stageRows }] = await Promise.all([
    supabase
      .from("stage_templates")
      .select(
        "id, key, version, title, subtitle, intro, finish_label, position, published_at"
      )
      .order("position", { ascending: true }),
    startupId
      ? supabase
          .from("startup_stages")
          .select("id, template_id, status")
          .eq("startup_id", startupId)
      : Promise.resolve({
          data: [] as { id: string; template_id: string; status: string }[],
        }),
  ]);

  const byTemplate = new Map(
    (stageRows ?? []).map((row) => [row.template_id as string, row])
  );

  // Jeden klucz moze miec kilka wersji tresci. Pokazujemy najnowsza.
  type TemplateRow = NonNullable<typeof templateRows>[number];
  const latest = new Map<string, TemplateRow>();
  for (const row of (templateRows ?? []) as TemplateRow[]) {
    const current = latest.get(row.key);
    if (!current || row.version > current.version) latest.set(row.key, row);
  }

  return [...latest.values()]
    .sort((a, b) => a.position - b.position)
    .map((template) => {
      const instance = byTemplate.get(template.id);
      return {
        templateId: template.id,
        key: template.key,
        title: template.title,
        subtitle: template.subtitle,
        intro: template.intro,
        finishLabel: (template.finish_label as string | null) ?? null,
        position: template.position,
        hasContent: template.published_at !== null,
        startupStageId: instance?.id ?? null,
        status: instance
          ? (instance.status as "in_progress" | "completed")
          : "not_started",
      };
    });
}

/** Etap, nad ktorym startup pracuje teraz: pierwszy niedomkniety z tresc. */
export function currentProgramEntry(program: StageProgramEntry[]) {
  // NAJDALSZY rozpoczęty etap, nie najwcześniejszy otwarty.
  //
  // Różnica jest istotna: do wcześniejszego etapu wolno wrócić (pominięty
  // Ambition, ponownie otwarta Idea), a to nie znaczy, że program się cofnął.
  // Przy regule „pierwszy in_progress" wejście w stary etap odbierało
  // użytkownikowi bieżący i kazało mu zaczynać od nowa.
  const started = program.filter((entry) => entry.status !== "not_started");
  const furthest = started.at(-1);

  if (!furthest) {
    return (
      program.find((entry) => entry.status === "not_started" && entry.hasContent) ??
      program.at(0) ??
      null
    );
  }

  if (furthest.status === "in_progress") return furthest;

  // Najdalszy jest domknięty — bieżącym staje się kolejny w programie.
  const next = program[program.indexOf(furthest) + 1];
  return next ?? furthest;
}

/**
 * Ile podpunktow dokłada każda kategoria — do ekranu wyboru kategorii.
 *
 * Ten wybór decyduje o różnicy między dwunastoma a siedemdziesięcioma
 * pytaniami, a do tej pory nikt tego użytkownikowi nie mówił. Liczby są
 * policzone z treści, nie oszacowane.
 */
export async function loadCategoryQuestionCounts(
  supabase: SupabaseClient,
  templateKey: string
): Promise<Record<string, number>> {
  const { data: template } = await supabase
    .from("stage_templates")
    .select("id")
    .eq("key", templateKey)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!template) return {};

  const { data } = await supabase
    .from("stage_categories")
    .select("key, stage_points(stage_subpoints(id, is_optional))")
    .eq("template_id", template.id);

  type Row = {
    key: string;
    stage_points: { stage_subpoints: { id: string; is_optional: boolean }[] }[];
  };

  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as unknown as Row[]) {
    counts[row.key] = (row.stage_points ?? []).reduce(
      (sum, point) =>
        sum +
        (point.stage_subpoints ?? []).filter((sub) => !sub.is_optional).length,
      0
    );
  }

  return counts;
}
