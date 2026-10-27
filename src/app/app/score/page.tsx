import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveStartupId } from "@/lib/active-team";
import { getUserStartups, resolveActiveStartup } from "@/lib/startup";
import { rankProgress, SCORE_RANKS, SCORE_RULES } from "@/lib/score";
import {
  ScoreControls,
  type ScoreReviews,
} from "@/components/score/score-controls";
import { Button } from "@/components/ui/button";
import { ScoreRefresh } from "@/components/score/score-refresh";

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
  if (error || data?.rules_version !== 2)
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
    legacy: number;
    pending: number;
    queue: {
      id: string;
      label: string;
      points: number;
      state: string;
      reason: string | null;
    }[];
    awaiting_review: { id: string; label: string; reason: string }[];
  };
  const progress = rankProgress(overview.work);
  const [startups, activeId] = await Promise.all([
    getUserStartups(supabase, user.id),
    getActiveStartupId(),
  ]);
  const active = resolveActiveStartup(startups, activeId);
  const canAssess = active?.role === "founder" || active?.role === "admin";
  const [goals, tasks, reviewResult, messages, assessments] = await Promise.all(
    [
      canAssess
        ? supabase
            .from("goals")
            .select("id,title")
            .neq("owner_id", user.id)
            .eq("startup_id", active!.id)
            .eq("status", "todo")
            .is("archived_at", null)
            .limit(50)
        : Promise.resolve({ data: [] }),
      canAssess
        ? supabase
            .from("tasks")
            .select("id,title")
            .neq("owner_id", user.id)
            .eq("startup_id", active!.id)
            .eq("status", "todo")
            .limit(50)
        : Promise.resolve({ data: [] }),
      canAssess
        ? supabase.rpc("score_review_candidates", { p_startup: active!.id })
        : Promise.resolve({ data: { goals: [], program: [] } }),
      supabase.rpc("score_feedback_candidates"),
      canAssess
        ? supabase
            .from("score_assessments")
            .select("kind,source_id,weight,frozen")
            .eq("startup_id", active!.id)
        : Promise.resolve({ data: [] }),
    ],
  );
  const work = [
    ...(goals.data ?? []).map((row) => ({ ...row, kind: "goal" as const })),
    ...(tasks.data ?? []).map((row) => ({ ...row, kind: "task" as const })),
  ]
    .filter(
      (row) =>
        !assessments.data?.some(
          (a) => a.kind === row.kind && a.source_id === row.id && a.frozen,
        ),
    )
    .map((row) => ({
      ...row,
      weight:
        assessments.data?.find(
          (a) => a.kind === row.kind && a.source_id === row.id,
        )?.weight ?? "standard",
    }));
  const reviews = (reviewResult.data ?? {
    goals: [],
    program: [],
  }) as ScoreReviews;
  const reviewGoals = await Promise.all(
    reviews.goals.map(async (goal) => {
      const file = goal.proof_snapshot.file as { path?: unknown } | undefined;
      if (goal.proof_snapshot.kind !== "file" || typeof file?.path !== "string")
        return goal;
      const { data: link } = await supabase.storage
        .from("stage-files")
        .createSignedUrl(file.path, 300);
      return { ...goal, proof_url: link?.signedUrl ?? null };
    }),
  );
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-10">
      <ScoreRefresh />
      <header>
        <p className="text-xs uppercase tracking-widest text-[var(--vairo)]">
          SCORE · zweryfikowane wyniki
        </p>
        <h1 className="mt-3 font-heading text-3xl font-semibold text-white">
          Twoja praca. Twój postęp.
        </h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Punkty otrzymujesz za sprawdzone wyniki: ukończony cel powiązany z
          programem i zaakceptowany przez drugiego Foundera/Admina. Sam status
          „Ukończony” nie daje SCORE.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button href="/app/goals">Pracuj nad celem</Button>
          <Button href="/app/stage" variant="secondary">
            Kontynuuj etap
          </Button>
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
      {overview.legacy > 0 && (
        <section className={panel}>
          <h2 className="text-lg text-white">Historia poprzednich zasad</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Zachowaliśmy {overview.legacy} pkt naliczonych przed niezależną
            weryfikacją. Są historią konta; nie podnoszą zweryfikowanej rangi
            ani reputacji.
          </p>
        </section>
      )}
      {(overview.pending > 0 || overview.queue.length > 0) && (
        <section className={panel}>
          <h2 className="text-lg text-white">
            Kolejka nagród · {overview.pending} pkt czeka
          </h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Po przekroczeniu dziennego limitu nagroda zostaje zapisana.
            Rozliczymy ją przy kolejnym wejściu do SCORE po odnowieniu limitu.
            Nie otwieraj ponownie celu — to unieważnia oczekującą akceptację.
          </p>
          <ul className="mt-3 divide-y divide-white/5">
            {overview.queue.map((entry) => (
              <li key={entry.id} className="py-3 text-sm">
                <p className="text-white">
                  {entry.label} · {entry.points} pkt
                </p>
                <p className="mt-1 text-xs text-[var(--text-subtle)]">
                  {entry.state === "cancelled"
                    ? "Potrzebna nowa akceptacja. "
                    : "Oczekuje. "}
                  {entry.reason}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
      {overview.awaiting_review.length > 0 && (
        <section className={panel}>
          <h2 className="text-lg text-white">Twoje wyniki do akceptacji</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Poproś drugiego Foundera/Admina w teamie o sprawdzenie wyniku w
            SCORE. Jednoosobowy team może kontynuować pracę, ale nie zatwierdza
            sobie punktów.
          </p>
          <ul className="mt-3 divide-y divide-white/5">
            {overview.awaiting_review.map((entry, index) => (
              <li key={`${entry.id}-${index}`} className="py-3 text-sm">
                <p className="text-white">{entry.label}</p>
                <p className="mt-1 text-xs text-[var(--text-subtle)]">
                  {entry.reason}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
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
      <ScoreControls
        work={work}
        messages={messages.data ?? []}
        reviews={{ ...reviews, goals: reviewGoals }}
      />
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
            Jeszcze bez zweryfikowanych punktów. Ukończ cel z treściwym dowodem,
            powiąż go z programem i poproś drugiego Foundera/Admina o
            akceptację.
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
              <span className="shrink-0 text-right text-[var(--vairo)]">
                {rule.points}
                {(rule.id === "point" || rule.id === "stage") && (
                  <span className="block text-xs">pula teamu</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <section className={panel}>
        <h2 className="text-lg text-white">Uczciwe zasady</h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
          Skip, upload, pusty plik, logowanie i swipe dają 0 pkt. Cele i zadania
          nagradzają właściciela po niezależnej akceptacji. Budżet zadań: do 30
          pkt na cel dla całego teamu. Pula punktu (25) i etapu (150) jest
          dzielona równo między członków teamu w chwili ukończenia; resztę
          pojedynczych punktów przydzielamy w stałej kolejności identyfikatorów.
          Zamykający nie otrzymuje dodatkowego bonusu. Każda osoba otrzyma bonus
          danego punktu i etapu tylko raz, łącznie ze wszystkich teamów. Sam
          skip nie daje nagrody. Bonus etapu sprawdza faktyczny postęp, także
          sprzed wdrożenia SCORE. Dziennie: zadania 60, cele 200, dokumenty 30,
          punkty programu 50, etapy 150; razem do 260 SCORE pracy. Nadwyżka
          trafia do kolejki. Reputacja: feedback 15, pomoc 20 dziennie, do 10 od
          jednej osoby w 7 dni, bez wzajemnej wymiany ocen. Reputacja świadomie
          nie wpływa na rangę pracy. Dzień rozliczamy w Europe/Warsaw. Zmiana
          kropki, odstępów lub wielkości liter nie tworzy nowego tekstowego
          dowodu.
        </p>
      </section>
    </div>
  );
}
