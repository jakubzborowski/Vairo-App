import { loadTeamMembers } from "@/lib/goals";
import { DocsShelf } from "@/components/docs/docs-shelf";
import { GoalsUnavailable } from "@/components/goals/goals-unavailable";
import type { DocSummary } from "@/types/docs";
import { loadDocsContext, selectDocuments } from "./load";

import { getT } from "@/i18n/server";
export async function generateMetadata() {
  const t = await getT("docs");
  return { title: t("meta.list") };
}
export const dynamic = "force-dynamic";

export default async function DocsPage() {
  const t = await getT("docs");
  const { supabase, active } = await loadDocsContext("/app/docs");

  const [{ rows, error }, members, { data: proofRows }] = await Promise.all([
    selectDocuments(supabase, active.id),
    loadTeamMembers(supabase, active.id),
    // Dokumenty użyte jako dowód: snapshot dowodu niesie `ref_id` dokumentu.
    supabase
      .from("goals")
      .select("proof_snapshot")
      .eq("startup_id", active.id)
      .eq("status", "completed"),
  ]);
  const usedAsProof = new Set(
    (proofRows ?? [])
      .map((row) => (row.proof_snapshot as { ref_id?: string; module?: string } | null))
      .filter((snap) => snap?.module === "document" && snap.ref_id)
      .map((snap) => snap!.ref_id as string)
  );

  if (error) {
    return <GoalsUnavailable missingMigration title={t("page.dokumenty")} href="/app/docs" />;
  }

  const names = new Map(members.map((member) => [member.id, member.name]));
  const documents: DocSummary[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body ?? "",
    createdBy: row.created_by,
    // Na karcie stoi ten, kto zmieniał ostatnio (031); bez migracji — autor.
    authorName: names.get(row.updated_by ?? row.created_by ?? "") ?? t("page.bylaOsobaZZespolu"),
    updatedAt: row.updated_at,
    usedAsProof: usedAsProof.has(row.id),
  }));

  return <DocsShelf documents={documents} />;
}
