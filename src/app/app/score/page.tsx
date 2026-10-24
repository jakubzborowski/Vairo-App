import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveStartupId } from "@/lib/active-team";
import { getUserStartups, resolveActiveStartup } from "@/lib/startup";
import { rankProgress, SCORE_RANKS, SCORE_RULES } from "@/lib/score";
import { ScoreControls } from "@/components/score/score-controls";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Twój SCORE · Vairo" };
export const dynamic = "force-dynamic";
const panel = "rounded-2xl border border-white/10 bg-[var(--surface)] p-6";
type ScoreRow = {
  id: string;
  points: number;
  track: string;
  label: string;
  created_at: string;
};

export default async function ScorePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/register?next=/app/score");
  const { data, error } = await supabase.rpc("score_overview");
  if (error)
    return (
      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl text-white">SCORE</h1>
        <p className="mt-3 text-sm text-[var(--text-muted)]">
          SCORE jest chwilowo niedostępny. Spróbuj ponownie za chwilę.
        </p>
      </div>
    );
  const overview = data as {
    work: number;
    reputation: number;
    events: ScoreRow[];
  };
  const progress = rankProgress(overview.work);
  const [startups, activeId] = await Promise.all([
    getUserStartups(supabase, user.id),
    getActiveStartupId(),
  ]);
  const active = resolveActiveStartup(startups, activeId);
  const canAssess = active?.role === "founder" || active?.role === "admin";
  const [goals, tasks, messages, assessments] = await Promise.all([
    canAssess
      ? supabase
          .from("goals")
          .select("id,title")
          .eq("startup_id", active!.id)
          .eq("status", "todo")
          .is("archived_at", null)
          .limit(50)
      : Promise.resolve({ data: [] }),
    canAssess
      ? supabase
          .from("tasks")
          .select("id,title")
          .eq("startup_id", active!.id)
          .eq("status", "todo")
          .limit(50)
      : Promise.resolve({ data: [] }),
    supabase.rpc("score_feedback_candidates"),
    canAssess
      ? supabase
          .from("score_assessments")
          .select("kind,source_id,weight,frozen")
          .eq("startup_id", active!.id)
      : Promise.resolve({ data: [] }),
  ]);
  const work = [
    ...(goals.data ?? []).map((row) => ({ ...row, kind: "goal" as const })),
    ...(tasks.data ?? []).map((row) => ({ ...row, kind: "task" as const })),
  ].filter((row) => !assessments.data?.some((a) => a.kind === row.kind && a.source_id === row.id && a.frozen)).map((row) => ({
    ...row,
    weight:
      assessments.data?.find(
        (a) => a.kind === row.kind && a.source_id === row.id,
      )?.weight ?? "standard",
  }));
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-10">
      <header>
        <p className="text-xs uppercase tracking-widest text-[var(--vairo)]">
          SCORE · wersja 1
        </p>
        <h1 className="mt-3 font-heading text-3xl font-semibold text-white">
          Twoja praca. Twój postęp.
        </h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Punkty pojawiają się automatycznie za wykonane działania. Twój
          osobisty wynik ze wszystkich teamów, liczony od uruchomienia SCORE.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button href="/app/goals">Pracuj nad celem</Button>
          <Button href="/app/stage" variant="secondary">Kontynuuj etap</Button>
        </div>
      </header>
      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <section className={panel}>
          <p className="text-sm text-[var(--text-subtle)]">SCORE pracy</p>
          <p className="mt-3 text-5xl font-semibold text-white">
            {overview.work}
          </p>
          <h2 className="mt-4 text-xl text-[var(--vairo)]">
            {progress.current.name}
          </h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {progress.next
              ? `${progress.next.threshold - overview.work} pkt do rangi ${progress.next.name}`
              : "Najwyższa ranga — dalej budujesz wynik."}
          </p>
          <div
            role="progressbar"
            aria-label="Awans do następnej rangi"
            aria-valuenow={Math.round(progress.percent)}
            aria-valuemin={0}
            aria-valuemax={100}
            className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"
          >
            <div
              className="h-full bg-[var(--vairo)]"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </section>
        <section className={panel}>
          <h2 className="text-sm text-[var(--text-muted)]">
            Reputacja społecznościowa
          </h2>
          <p className="mt-3 text-4xl text-white">{overview.reputation}</p>
          <p className="mt-4 text-sm text-[var(--text-subtle)]">
            Za pomoc i feedback potwierdzone przez odbiorcę. Każdy głos ma równą
            wagę. Reputacja nie podbija rangi pracy.
          </p>
        </section>
      </div>
      <section className={panel}>
        <h2 className="text-lg text-white">Rangi</h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {SCORE_RANKS.map((rank) => (
            <li
              key={rank.name}
              className={`rounded-xl border p-3 ${overview.work >= rank.threshold ? "border-[var(--vairo)]/40" : "border-white/10"}`}
            >
              <p className="text-sm text-white">{rank.name}</p>
              <p className="mt-1 text-xs text-[var(--text-subtle)]">
                {rank.threshold} SCORE
              </p>
            </li>
          ))}
        </ol>
      </section>
      <ScoreControls work={work} messages={messages.data ?? []} />
      <section className={panel}>
        <h2 className="text-lg text-white">Ostatnie 50 nagród</h2>
        {overview.events.length ? (
          <ol className="mt-3 divide-y divide-white/5">
            {overview.events.map((event) => (
              <li
                key={event.id}
                className="flex justify-between gap-4 py-3 text-sm"
              >
                <div>
                  <p className="text-white">{event.label}</p>
                  <p className="mt-1 text-xs text-[var(--text-subtle)]">
                    {new Date(event.created_at).toLocaleString("pl-PL", {
                      timeZone: "Europe/Warsaw",
                    })}
                  </p>
                </div>
                <strong className="shrink-0 text-[var(--vairo)]">
                  +{event.points}{" "}
                  {event.track === "work" ? "SCORE" : "reputacji"}
                </strong>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            Jeszcze bez punktów. Ukończ cel z dowodem — otrzymasz punkty za cel
            i ukończone zadania pod nim.
          </p>
        )}
      </section>
      <section className={panel}>
        <h2 className="text-lg text-white">Punktacja</h2>
        <ul className="mt-4 divide-y divide-white/5">
          {SCORE_RULES.map((rule) => (
            <li key={rule.id} className="flex justify-between gap-4 py-3">
              <div>
                <p className="text-sm text-white">{rule.label}</p>
                <p className="mt-1 text-xs text-[var(--text-subtle)]">
                  {rule.detail}
                </p>
              </div>
              <span className="text-[var(--vairo)]">+{rule.points}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className={panel}>
        <h2 className="text-lg text-white">Uczciwe zasady</h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
          Skip, sam upload, pusty plik, logowanie i swipe dają 0 pkt. Zadania
          rozliczamy przy ukończeniu celu z proof, do 30 pkt na cel dla całego
          teamu. Każdy rezultat nagradzamy raz, także po ponownym otwarciu.
          Powtórne użycie tego samego proof w teamie nie daje nowego bonusu
          celu. Limity nie odkładają nagród na kolejny dzień. Zadania: do 60 pkt
          dziennie, cele: do 200. Dokument: do 30 pkt dziennie. Feedback: do 15,
          pomoc: do 20; do 10 pkt od tej samej osoby w ciągu 7 dni, bez
          wzajemnej wymiany ocen. Limity dzienne liczymy w Europe/Warsaw.
          Punkty złożone wyłącznie z pominiętych podpunktów nie dają bonusu. Bonus
          etapu wymaga nagrodzenia wszystkich aktywnych punktów. Cele i zadania
          nagradzają właściciela; punkty i etapy osobę kończącą.
        </p>
      </section>
    </div>
  );
}
