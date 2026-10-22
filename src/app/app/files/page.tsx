import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { getActiveStartupId } from "@/lib/active-team";
import { loadDriveFiles, loadDriveFolders } from "@/lib/files";
import { getUserStartups, resolveActiveStartup } from "@/lib/startup";
import { canManageTeam } from "@/types/startup";
import { StageReturnBar } from "@/components/stage/stage-return-bar";
import { FilesDrive } from "@/components/files/files-drive";

export const metadata = { title: "Pliki — Vairo" };
export const dynamic = "force-dynamic";

export default async function FilesPage({
  searchParams,
}: {
  searchParams: Promise<{ back?: string }>;
}) {
  const { back } = await searchParams;
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) redirect("/register?next=/app/files");

  const [startups, activeTeamId] = await Promise.all([
    getUserStartups(supabase, user.id),
    getActiveStartupId(),
  ]);
  const active = resolveActiveStartup(startups, activeTeamId);
  if (!active) redirect("/app");

  const [files, { available: foldersAvailable, folders }] = await Promise.all([
    loadDriveFiles(supabase, active.id),
    loadDriveFolders(supabase, active.id),
  ]);

  return (
    <>
      {back ? (
        <div className="page-wide">
          <StageReturnBar back={back} />
        </div>
      ) : null}
      <FilesDrive
        startupId={active.id}
        userId={user.id}
        canManage={canManageTeam(active.role)}
        files={files}
        folders={folders}
        foldersAvailable={foldersAvailable}
      />
    </>
  );
}
