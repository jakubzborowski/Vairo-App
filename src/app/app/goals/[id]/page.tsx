import { notFound } from "next/navigation";
import { GoalDetail } from "@/components/goals/goal-detail";
import { GoalsUnavailable } from "@/components/goals/goals-unavailable";
import { loadGoalsContext } from "../load";
import { selectDocuments } from "@/app/app/docs/load";

export const dynamic = "force-dynamic";

export const metadata = { title: "Cel — Vairo" };

export default async function GoalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, active, workspace } = await loadGoalsContext(`/app/goals/${id}`);

  if (!workspace.ready || workspace.loadError) {
    return <GoalsUnavailable missingMigration={!workspace.ready} />;
  }

  // Cel z innego teamu (albo nieistniejący) wygląda tak samo — RLS i tak go
  // nie odda, a „nie masz dostępu" zdradzałoby, że coś pod tym adresem jest.
  const goal = workspace.goals.find((item) => item.id === id);
  if (!goal) notFound();

  const { rows: docs } = await selectDocuments(supabase, active.id);

  return (
    <GoalDetail
      goal={goal}
      goals={workspace.goals}
      conditions={workspace.conditions}
      files={workspace.files}
      workflows={workspace.workflows}
      documents={docs.map((doc) => ({ id: doc.id, title: doc.title, body: doc.body ?? "" }))}
      members={workspace.members}
      goalTypes={workspace.goalTypes}
      startupId={active.id}
      userId={user.id}
      role={active.role}
    />
  );
}
