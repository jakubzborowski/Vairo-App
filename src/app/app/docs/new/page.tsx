import { DocSheet } from "@/components/docs/doc-sheet";
import { loadDocsContext } from "../load";

export const metadata = { title: "Nowy dokument — Vairo" };
export const dynamic = "force-dynamic";

export default async function NewDocPage() {
  await loadDocsContext("/app/docs/new");
  return (
    <DocSheet
      docId={null}
      initialTitle=""
      initialBody=""
      updatedAt={null}
      authorName={null}
      canEdit
    />
  );
}
