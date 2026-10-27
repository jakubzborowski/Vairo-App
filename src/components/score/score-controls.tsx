"use client";
import { useActionState } from "react";
import { scoreAction } from "@/app/app/score/actions";
import { Button } from "@/components/ui/button";

function ActionForm({
  children,
  label = "Potwierdź",
}: {
  children: React.ReactNode;
  label?: string;
}) {
  const [state, action, pending] = useActionState(scoreAction, {
    error: null,
    success: null,
  });
  return (
    <form action={action} className="space-y-3">
      {children}
      <Button type="submit" size="sm" loading={pending}>
        {label}
      </Button>
      <p
        role="status"
        className={`text-xs ${state.error ? "text-[var(--danger)]" : "text-[var(--vairo)]"}`}
      >
        {state.error ?? state.success}
      </p>
    </form>
  );
}
export function ScoreControls({
  work,
  messages,
  reviews,
}: {
  work: { id: string; title: string; kind: "task" | "goal"; weight: string }[];
  messages: { id: string; body: string; sender_name: string }[];
  reviews: ScoreReviews;
}) {
  return (
    <div className="space-y-6">
      {(reviews.goals.length > 0 || reviews.program.length > 0) && (
        <section className="rounded-2xl border border-white/10 bg-[var(--surface)] p-6">
          <h2 className="text-lg text-white">Sprawdź wyniki innych osób</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Zaakceptuj konkretny efekt po sprawdzeniu dowodu. Nie akceptujesz
            własnej nagrody. Uzasadnienie: minimum 80 znaków i 12 słów; samo
            potwierdzenie statusu nie wystarczy.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {reviews.goals.map((goal) => (
              <div
                key={goal.id}
                className="rounded-xl border border-white/10 p-4"
              >
                <p className="text-sm text-white">
                  {goal.title} · {goal.owner_name ?? "Członek teamu"}
                </p>
                <Snapshot
                  proof={goal.proof_snapshot}
                  proofUrl={goal.proof_url}
                />
                {goal.tasks.length > 0 && (
                  <ul className="my-3 list-disc pl-4 text-xs text-[var(--text-muted)]">
                    {goal.tasks.map((task, index) => (
                      <li key={index}>
                        {task.title} · {task.owner_name ?? "Bez właściciela"}
                      </li>
                    ))}
                  </ul>
                )}
                <Button
                  href={`/app/goals?goal=${goal.id}`}
                  variant="ghost"
                  size="sm"
                >
                  Otwórz cel i zadania
                </Button>
                {goal.eligible ? (
                  <ReviewForm
                    key={goal.review_key}
                    action="review-goal"
                    source={goal.id}
                    expected={goal.review_key}
                  />
                ) : (
                  <p className="mt-3 text-xs text-[var(--text-muted)]">
                    Ten cel nie spełnia warunków SCORE: potrzebuje jawnego
                    powiązania z programem oraz treściwego proof. Zdanie:
                    minimum 40 znaków i 8 słów; długi tekst: 80 znaków i 12
                    słów. Puste pliki nie punktują.
                  </p>
                )}
              </div>
            ))}
            {reviews.program.map((claim) => (
              <div
                key={claim.id}
                className="rounded-xl border border-white/10 p-4"
              >
                <p className="text-sm text-white">{claim.label}</p>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  Część puli dla {claim.owner_name ?? "członka teamu"}:{" "}
                  {claim.points} pkt. Sprawdź odpowiedzi i dowody w programie
                  przed akceptacją.
                </p>
                <Button
                  href={`/app/stage?stage=${claim.stage_key}`}
                  variant="ghost"
                  size="sm"
                >
                  Sprawdź etap
                </Button>
                <ReviewForm
                  key={claim.review_key}
                  action="review-program"
                  source={claim.id}
                  expected={claim.review_key}
                />
              </div>
            ))}
          </div>
        </section>
      )}
      {work.length > 0 && (
        <section className="rounded-2xl border border-white/10 bg-[var(--surface)] p-6">
          <h2 className="text-lg text-white">Ustal skalę pracy w teamie</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Founder/Admin ustala skalę przed rozpoczęciem pracy. Zadanie: 5 lub
            15 pkt. Cel: 40 lub 80 pkt. Własną pracę przedstawiasz do oceny
            drugiemu Founderowi/Adminowi — nie możesz podnieść sobie punktacji.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {work.map((item) => (
              <div
                key={`${item.kind}-${item.id}`}
                className="rounded-xl border border-white/10 p-4"
              >
                <p className="mb-3 text-sm text-white">
                  {item.kind === "goal" ? "Cel" : "Zadanie"}: {item.title}
                </p>
                <ActionForm>
                  <input type="hidden" name="action" value="assess" />
                  <input type="hidden" name="kind" value={item.kind} />
                  <input type="hidden" name="source" value={item.id} />
                  <label className="flex gap-2 text-sm text-[var(--text-muted)]">
                    <input
                      type="radio"
                      name="weight"
                      value="standard"
                      defaultChecked={item.weight === "standard"}
                    />{" "}
                    Standardowa
                  </label>
                  <label className="flex gap-2 text-sm text-[var(--text-muted)]">
                    <input
                      type="radio"
                      name="weight"
                      value="large"
                      defaultChecked={item.weight === "large"}
                    />{" "}
                    Wymagająca
                  </label>
                </ActionForm>
              </div>
            ))}
          </div>
        </section>
      )}
      <section className="rounded-2xl border border-white/10 bg-[var(--surface)] p-6">
        <h2 className="text-lg text-white">Doceń otrzymaną pomoc</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Punkty otrzymuje autor wiadomości, której wartość potwierdzasz.
          Poniżej do 30 nieocenionych wiadomości: minimum 80 znaków, 12 słów i
          różnorodne słownictwo. Długość nie zastępuje Twojej oceny wartości
          pomocy.
        </p>
        {messages.length ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {messages.map((message) => (
              <div
                key={message.id}
                className="rounded-xl border border-white/10 p-4"
              >
                <p className="mb-2 text-sm text-white">{message.sender_name}</p>
                <p className="mb-3 whitespace-pre-wrap break-words text-sm text-[var(--text-muted)]">
                  {message.body}
                </p>
                <ActionForm>
                  <input type="hidden" name="action" value="thank" />
                  <input type="hidden" name="source" value={message.id} />
                  <label className="flex gap-2 text-sm text-[var(--text-muted)]">
                    <input
                      type="radio"
                      name="kind"
                      value="feedback"
                      defaultChecked
                    />{" "}
                    Przydatny feedback · +5 dla autora
                  </label>
                  <label className="flex gap-2 text-sm text-[var(--text-muted)]">
                    <input type="radio" name="kind" value="help" /> Pomoc z
                    rezultatem · +10 dla autora
                  </label>
                </ActionForm>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-[var(--text-subtle)]">
            Brak otrzymanych wiadomości do potwierdzenia. Poproś o feedback w
            rozmowie Social.
          </p>
        )}
      </section>
    </div>
  );
}

export type ScoreReviews = {
  goals: {
    id: string;
    title: string;
    owner_name: string | null;
    eligible: boolean;
    proof_snapshot: Record<string, unknown>;
    review_key: string;
    proof_url?: string | null;
    tasks: { title: string; owner_name: string | null }[];
  }[];
  program: {
    id: string;
    label: string;
    owner_name: string | null;
    points: number;
    stage_key: string;
    review_key: string;
  }[];
};

function ReviewForm({
  action,
  source,
  expected,
}: {
  action: "review-goal" | "review-program";
  source: string;
  expected: string;
}) {
  return (
    <div className="mt-3">
      <ActionForm label="Akceptuję sprawdzony wynik">
        <input type="hidden" name="action" value={action} />
        <input type="hidden" name="source" value={source} />
        <input type="hidden" name="expected" value={expected} />
        <label className="block text-xs text-[var(--text-muted)]">
          Co sprawdziłeś i jaki rezultat potwierdzasz?
          <textarea
            name="note"
            required
            minLength={80}
            maxLength={2000}
            rows={4}
            className="mt-2 w-full rounded-xl border border-white/10 bg-[var(--surface-2)] p-3 text-sm text-white"
          />
        </label>
      </ActionForm>
    </div>
  );
}

function Snapshot({
  proof,
  proofUrl,
}: {
  proof: Record<string, unknown>;
  proofUrl?: string | null;
}) {
  const text =
    typeof proof.text === "string"
      ? proof.text
      : typeof proof.note === "string"
        ? proof.note
        : "";
  const file =
    proof.file && typeof proof.file === "object"
      ? (proof.file as { name?: string })
      : null;
  return (
    <div className="my-3 rounded-lg bg-white/5 p-3 text-sm text-[var(--text-muted)]">
      <p className="text-xs text-[var(--text-subtle)]">Zapisany dowód</p>
      {text && <p className="mt-2 whitespace-pre-wrap break-words">{text}</p>}
      {typeof proof.url === "string" && /^https?:\/\//i.test(proof.url) && (
        <a
          href={proof.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block break-all text-[var(--vairo)] underline"
        >
          {proof.url}
        </a>
      )}
      {file && (
        <p className="mt-2">
          Plik: {file.name ?? "Dokument"}.{" "}
          {proofUrl ? (
            <a
              href={proofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--vairo)] underline"
            >
              Otwórz dowód
            </a>
          ) : (
            "Sprawdź go w plikach teamu przed akceptacją."
          )}
        </p>
      )}
      {proof.kind === "module_result" && (
        <p className="mt-2">
          Zapisany wynik modułu, wersja {String(proof.version ?? "—")}.
          Szczegóły w karcie celu.
        </p>
      )}
      {proof.kind === "select" && (
        <p className="mt-2">Wybrano: {String(proof.option ?? "—")}</p>
      )}
      {proof.kind === "scale" && (
        <p className="mt-2">Wynik skali: {String(proof.scale ?? "—")}</p>
      )}
      {proof.kind === "goal_set" && (
        <p className="mt-2">
          Zestaw {Array.isArray(proof.goal_ids) ? proof.goal_ids.length : 0}{" "}
          celów. Każdy musi mieć zaakceptowany dowód.
        </p>
      )}
    </div>
  );
}
