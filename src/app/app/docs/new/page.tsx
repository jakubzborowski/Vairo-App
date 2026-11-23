import { DocSheet } from "@/components/docs/doc-sheet";
import { loadDocsContext } from "../load";
import { getT } from "@/i18n/server";

export async function generateMetadata() {
  const t = await getT("docs");
  return { title: t("meta.new") };
}
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
