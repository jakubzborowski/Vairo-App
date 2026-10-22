import { notFound } from "next/navigation";
import { loadTeamMembers } from "@/lib/goals";
import { DocSheet } from "@/components/docs/doc-sheet";
import { canEditStageData } from "@/types/startup";
import { loadDocsContext, selectDocuments } from "../load";

export const metadata = { title: "Dokument — Vairo" };
export const dynamic = "force-dynamic";

export default async function DocPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, active } = await loadDocsContext(`/app/docs/${id}`);

  const [{ rows }, members] = await Promise.all([
    selectDocuments(supabase, active.id, id),
    loadTeamMembers(supabase, active.id),
  ]);
  const data = rows[0];
  if (!data) notFound();

  const author = members.find((member) => member.id === data.created_by);
  const editor = members.find((member) => member.id === (data.updated_by ?? data.created_by));
  // Ta sama reguła co polityka `startup_documents_update` (026): autor albo
  // Founder/Admin. Pozostali czytają.
  const canEdit = data.created_by === user.id || canEditStageData(active.role);

  return (
    <DocSheet
      docId={data.id as string}
      initialTitle={data.title as string}
      initialBody={(data.body as string) ?? ""}
      updatedAt={data.updated_at as string}
      authorName={author?.name ?? null}
      editorName={editor?.name ?? null}
      canEdit={canEdit}
    />
  );
}
