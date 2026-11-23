import { RozpiskaEditor } from "@/components/workflows/rozpiska-editor";
import { loadWorkflowContext } from "../load";
import { getT } from "@/i18n/server";

export async function generateMetadata() {
  const t = await getT("workflows");
  return { title: t("meta.new") };
}
export const dynamic = "force-dynamic";

export default async function NewWorkflowPage() {
  const { active, goals } = await loadWorkflowContext("/app/workflows/new");
  return <RozpiskaEditor startupId={active.id} record={null} versions={[]} goals={goals} />;
}
