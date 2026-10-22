import type { SupabaseClient } from "@supabase/supabase-js";
import { loadTeamMembers } from "@/lib/goals";

/**
 * Pliki startupu z dwóch źródeł: biblioteka (`startup_files`) i odpowiedzi
 * w etapach (`stage_answers` z polem typu „files"). Każdy plik pamięta, skąd
 * jest — plik z etapu zna etap i pytanie, przy którym go dodano.
 */
export type DriveFile = {
  id: string;
  name: string;
  path: string;
  size: number;
  source: "library" | "stage";
  uploadedBy: string | null;
  uploaderName: string | null;
  createdAt: string | null;
  stageTitle: string | null;
  stagePosition: number | null;
  question: string | null;
  /** Własny folder (030). `null` = luzem w „Od zespołu". */
  folderId: string | null;
};

export type DriveFolder = {
  id: string;
  name: string;
  parentId: string | null;
  createdBy: string | null;
};

type StoredFile = { path?: string; name?: string; size?: number };

function filesIn(value: unknown): StoredFile[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) =>
      item && typeof item === "object" && "path" in item && "name" in item
        ? [item as StoredFile]
        : filesIn(item)
    );
  }
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap(filesIn);
  }
  return [];
}

/**
 * Własne foldery (030). Bez migracji zwraca `available: false` — UI chowa
 * wtedy „Nowy folder" i „Przenieś do…", zamiast pokazywać przyciski, które
 * nic nie zapiszą.
 */
export async function loadDriveFolders(
  supabase: SupabaseClient,
  startupId: string
): Promise<{ available: boolean; folders: DriveFolder[] }> {
  const { data, error } = await supabase
    .from("startup_file_folders")
    .select("id, name, parent_id, created_by")
    .eq("startup_id", startupId)
    .order("name", { ascending: true });
  if (error) return { available: false, folders: [] };
  return {
    available: true,
    folders: (data ?? []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      parentId: (row.parent_id as string | null) ?? null,
      createdBy: (row.created_by as string | null) ?? null,
    })),
  };
}

async function loadLibrary(supabase: SupabaseClient, startupId: string) {
  const base = "id, name, storage_path, size_bytes, uploaded_by, created_at";
  const withFolder = await supabase
    .from("startup_files")
    .select(`${base}, folder_id`)
    .eq("startup_id", startupId)
    .order("created_at", { ascending: false });
  if (!withFolder.error) return withFolder.data ?? [];
  const plain = await supabase
    .from("startup_files")
    .select(base)
    .eq("startup_id", startupId)
    .order("created_at", { ascending: false });
  return (plain.data ?? []) as Record<string, unknown>[];
}

export async function loadDriveFiles(
  supabase: SupabaseClient,
  startupId: string
): Promise<DriveFile[]> {
  const [library, { data: stages }, members] = await Promise.all([
    loadLibrary(supabase, startupId),
    supabase
      .from("startup_stages")
      .select("id, stage_templates(title, position)")
      .eq("startup_id", startupId),
    loadTeamMembers(supabase, startupId),
  ]);
  const names = new Map(members.map((member) => [member.id, member.name]));

  type StageRow = { id: string; stage_templates: { title: string; position: number } | null };
  const stageRows = (stages ?? []) as unknown as StageRow[];
  const stageById = new Map(stageRows.map((row) => [row.id, row.stage_templates]));

  const stageFiles: DriveFile[] = [];
  if (stageRows.length > 0) {
    const { data: answers } = await supabase
      .from("stage_answers")
      .select("startup_stage_id, answer_key, value, answered_by, updated_at")
      .in(
        "startup_stage_id",
        stageRows.map((row) => row.id)
      );

    const withFiles = (answers ?? []).filter((answer) => filesIn(answer.value).length > 0);
    const keys = [...new Set(withFiles.map((answer) => answer.answer_key as string))];
    const questions = new Map<string, string>();
    if (keys.length > 0) {
      const { data: fields } = await supabase
        .from("stage_fields")
        .select("answer_key, question")
        .in("answer_key", keys);
      for (const field of fields ?? []) {
        if (!questions.has(field.answer_key as string)) {
          questions.set(field.answer_key as string, field.question as string);
        }
      }
    }

    const seen = new Set<string>();
    for (const answer of withFiles) {
      const stage = stageById.get(answer.startup_stage_id as string) ?? null;
      for (const file of filesIn(answer.value)) {
        if (!file.path || !file.name || seen.has(file.path)) continue;
        seen.add(file.path);
        stageFiles.push({
          id: file.path,
          name: file.name,
          path: file.path,
          size: file.size ?? 0,
          source: "stage",
          uploadedBy: (answer.answered_by as string | null) ?? null,
          uploaderName: names.get(answer.answered_by as string) ?? null,
          createdAt: (answer.updated_at as string | null) ?? null,
          stageTitle: stage?.title ?? "Etap",
          stagePosition: stage?.position ?? 0,
          question: questions.get(answer.answer_key as string) ?? null,
          folderId: null,
        });
      }
    }
  }

  return [
    ...library.map((row) => ({
      id: row.id as string,
      name: row.name as string,
      path: row.storage_path as string,
      size: Number(row.size_bytes ?? 0),
      source: "library" as const,
      uploadedBy: (row.uploaded_by as string | null) ?? null,
      uploaderName: names.get(row.uploaded_by as string) ?? null,
      createdAt: (row.created_at as string | null) ?? null,
      stageTitle: null,
      stagePosition: null,
      question: null,
      folderId: ((row as Record<string, unknown>).folder_id as string | null | undefined) ?? null,
    })),
    ...stageFiles,
  ];
}
