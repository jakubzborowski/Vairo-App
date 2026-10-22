import { notFound } from "next/navigation";
import { loadRozpiska } from "@/lib/workflows";
import { GoalsUnavailable } from "@/components/goals/goals-unavailable";
import { RozpiskaEditor } from "@/components/workflows/rozpiska-editor";
import { loadWorkflowContext } from "../load";

export const metadata = { title: "Rozpiska — Vairo" };
export const dynamic = "force-dynamic";

export default async function WorkflowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, active, goals } = await loadWorkflowContext(`/app/workflows/${id}`);
  const { missing, record, versions } = await loadRozpiska(supabase, active.id, id);

  if (missing) {
    return <GoalsUnavailable missingMigration title="Rozpiska" href="/app/workflows" />;
  }
  if (!record) notFound();

  return (
    <RozpiskaEditor
      startupId={active.id}
      record={record}
      versions={versions}
      goals={goals}
      canDelete={active.role !== "member" || record.createdBy === user.id}
    />
  );
}
