import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveStartupId } from "@/lib/active-team";
import { getUserStartups, resolveActiveStartup } from "@/lib/startup";
import { canManageTeam } from "@/types/startup";
import { StageReturnBar } from "@/components/stage/stage-return-bar";
import { FileLibrary, type LibraryFile } from "./library";

export const metadata = { title: "Pliki — Vairo" };
export const dynamic = "force-dynamic";

type StoredFile = { path?: string; name?: string; size?: number };

function filesIn(value: unknown): StoredFile[] {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is StoredFile =>
        Boolean(item) && typeof item === "object" && "path" in item && "name" in item
    );
  }
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap(filesIn);
  }
  return [];
}

export default async function FilesPage({
  searchParams,
}: {
  searchParams: Promise<{ back?: string }>;
}) {
  const { back } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/register?next=/app/files");

  const [startups, activeTeamId] = await Promise.all([
    getUserStartups(supabase, user.id),
    getActiveStartupId(),
  ]);
  const active = resolveActiveStartup(startups, activeTeamId);

  if (!active) redirect("/app");

  const [{ data: library }, { data: stages }] = await Promise.all([
    supabase
      .from("startup_files")
      .select("id, name, storage_path, size_bytes, uploaded_by")
      .eq("startup_id", active.id)
      .order("created_at", { ascending: false }),
    supabase.from("startup_stages").select("id").eq("startup_id", active.id),
  ]);

  const stageIds = (stages ?? []).map((row) => row.id as string);
  const stageFiles: LibraryFile[] = [];

  if (stageIds.length > 0) {
    const { data: answers } = await supabase
      .from("stage_answers")
      .select("answer_key, value")
      .in("startup_stage_id", stageIds);

    const seen = new Set<string>();
    for (const answer of answers ?? []) {
      for (const file of filesIn(answer.value)) {
        if (!file.path || !file.name || seen.has(file.path)) continue;
        seen.add(file.path);
        stageFiles.push({
          id: file.path,
          name: file.name,
          path: file.path,
          size: file.size ?? 0,
          source: "stage",
          uploadedBy: null,
        });
      }
    }
  }

  const files: LibraryFile[] = [
    ...(library ?? []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      path: row.storage_path as string,
      size: Number(row.size_bytes ?? 0),
      source: "library" as const,
      uploadedBy: (row.uploaded_by as string | null) ?? null,
    })),
    ...stageFiles,
  ];

  return (
    <div className="mx-auto w-full max-w-3xl">
      <StageReturnBar back={back} />
      <h1 className="font-heading text-[1.6rem] font-semibold text-white">Pliki</h1>
      <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[var(--text-muted)]">
        Materiały tego startupu. Pliki dodane przy odpowiedziach w etapie też
        są tutaj, żeby dało się do nich wrócić i użyć ich jako dowodu.
      </p>
      <div className="mt-6">
        <FileLibrary
          startupId={active.id}
          userId={user.id}
          canManage={canManageTeam(active.role)}
          files={files}
        />
      </div>
    </div>
  );
}
