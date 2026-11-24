import { notFound, redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { currentProgramEntry, loadStageProgram, type StageProgramEntry } from "@/lib/stage";
import { isPlatformTester, type TesterStartupRow } from "@/lib/tester";
import { TesterPanel, type TesterStartup } from "@/components/tester/tester-panel";
import { getT } from "@/i18n/server";

export async function generateMetadata() {
  const t = await getT("tester");
  return { title: t("page.metaTitle") };
}
export const dynamic = "force-dynamic";

/**
 * Panel testowy — przeskakiwanie etapów w dowolnym startupie.
 *
 * Osoba spoza `platform_testers` dostaje 404, a nie stronę z komunikatem
 * „brak dostępu”: zwykły użytkownik nie powinien w ogóle wiedzieć, że taki
 * adres istnieje. Prawdziwą bramką jest baza — każda funkcja panelu sama
 * sprawdza `is_platform_tester()`.
 */
export default async function TestPanelPage() {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/app/test-panel");

  if (!(await isPlatformTester(supabase))) notFound();

  const [program, { data, error }] = await Promise.all([
    loadStageProgram(supabase, null),
    supabase.rpc("tester_startups"),
  ]);

  const rows = (error ? [] : (data ?? [])) as TesterStartupRow[];

  const startups: TesterStartup[] = rows.map((row) => {
    const withStatus: StageProgramEntry[] = program.map((entry) => ({
      ...entry,
      status: row.stages?.[entry.key] ?? "not_started",
    }));
    const allDone =
      withStatus.length > 0 && withStatus.every((entry) => entry.status === "completed");
    const current = currentProgramEntry(withStatus);
    return {
      id: row.id,
      name: row.name,
      status: row.status,
      memberCount: row.member_count,
      isMember: row.is_member,
      currentKey: allDone ? null : (current?.key ?? null),
      allDone,
      started: withStatus.filter((entry) => entry.status !== "not_started").map((e) => e.key),
    };
  });

  return (
    <div className="page-wide">
      <TesterPanel
        stages={program.map((entry) => ({ key: entry.key, title: entry.title }))}
        startups={startups}
        loadFailed={Boolean(error)}
      />
    </div>
  );
}
