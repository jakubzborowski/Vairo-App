import { RozpiskaEditor } from "@/components/workflows/rozpiska-editor";
import { loadWorkflowContext } from "../load";

export const metadata = { title: "Nowa rozpiska — Vairo" };
export const dynamic = "force-dynamic";

export default async function NewWorkflowPage() {
  const { active, goals } = await loadWorkflowContext("/app/workflows/new");
  return <RozpiskaEditor startupId={active.id} record={null} versions={[]} goals={goals} />;
}
