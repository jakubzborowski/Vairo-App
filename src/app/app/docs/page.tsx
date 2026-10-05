import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveStartupId } from "@/lib/active-team";
import { getUserStartups, resolveActiveStartup } from "@/lib/startup";
import { DocsEditor, type DocItem } from "./editor";

export const metadata = { title: "Dokumenty — Vairo" };
export const dynamic = "force-dynamic";

export default async function DocsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/register?next=/app/docs");

  const [startups, activeTeamId] = await Promise.all([
    getUserStartups(supabase, user.id),
    getActiveStartupId(),
  ]);
  const active = resolveActiveStartup(startups, activeTeamId);
  if (!active) redirect("/app");

  const { data, error } = await supabase
    .from("startup_documents")
    .select("id, title, body")
    .eq("startup_id", active.id)
    .order("updated_at", { ascending: false });

  const documents: DocItem[] = error
    ? []
    : (data ?? []).map((row) => ({
        id: row.id as string,
        title: row.title as string,
        body: (row.body as string) ?? "",
      }));

  return (
    <div className="mx-auto w-full max-w-4xl">
      <h1 className="font-heading text-[1.6rem] font-semibold text-white">Dokumenty</h1>
      <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[var(--text-muted)]">
        Wspólna notatka zespołu. Zatwierdzony dowód celu zostaje osobnym zapisem i nie
        podmienia się, gdy później poprawisz ten tekst.
      </p>
      {error ? (
        <p className="mt-4 text-[14px] text-[var(--text-muted)]">
          Brakuje tabeli dokumentów. Odpal migrację 019 w Supabase.
        </p>
      ) : (
        <DocsEditor documents={documents} />
      )}
    </div>
  );
}
