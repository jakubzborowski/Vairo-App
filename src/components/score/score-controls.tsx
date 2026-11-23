"use client";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { scoreAction } from "@/app/app/score/actions";
import { Button } from "@/components/ui/button";
import { MenuSelect } from "@/components/ui/menu-select";

import { useT } from "@/i18n/client";
function ActionForm({
  children,
  label: labelProp,
}: {
  children: React.ReactNode;
  label?: string;
}) {
  const t = useT("score");
  const label = labelProp ?? t("scoreControls.confirm");
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
  canOpenWorkspace = true,
}: {
  work: { id: string; title: string; kind: "task" | "goal"; weight: string }[];
  messages: { id: string; body: string; sender_name: string }[];
  reviews: ScoreReviews;
  canOpenWorkspace?: boolean;
}) {
  const t = useT("score");
  return (
    <div className="space-y-6">
      {(reviews.goals.length > 0 || reviews.program.length > 0) && (
        <section className="rounded-2xl border border-white/10 bg-[var(--surface)] p-6">
          <h2 className="text-lg text-white">{t("scoreControls.sprawdzWynikiInnychOsob")}</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {t("scoreControls.reviewIntro")}
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {reviews.goals.map((goal) => (
              <div
                key={goal.id}
                className="rounded-xl border border-white/10 p-4"
              >
                <p className="text-sm text-white">
                  {goal.title} · {goal.owner_name ?? t("scoreControls.czlonekZespolu")}
                </p>
                {goal.rereview && (
                  <p className="mt-2 text-xs text-[var(--vairo)]">
                    {t("scoreControls.rereview")}
                  </p>
                )}
                {typeof goal.proof_requirement?.label === "string" && (
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    {t("scoreControls.wymaganyRezultatLabel", { label: goal.proof_requirement.label })}
                  </p>
                )}
                <Snapshot
                  proof={goal.proof_snapshot}
                  proofUrl={goal.proof_url}
                />
                {goal.tasks.length > 0 && (
                  <ul className="my-3 list-disc pl-4 text-xs text-[var(--text-muted)]">
                    {goal.tasks.map((task, index) => (
                      <li key={index}>
                        {task.title} · {task.owner_name ?? t("scoreControls.bezWlasciciela")}
                      </li>
                    ))}
                  </ul>
                )}
                {canOpenWorkspace && (
                  <Button
                    href={`/app/goals?goal=${goal.id}`}
                    variant="ghost"
                    size="sm"
                  >
                    {t("scoreControls.otworzCelIZadania")}
                  </Button>
                )}
                {goal.eligible ? (
                  <ReviewForm
                    key={goal.review_key}
                    action="review-goal"
                    source={goal.id}
                    expected={goal.review_key}
                  />
                ) : (
                  <p className="mt-3 text-xs text-[var(--text-muted)]">
                    {goal.eligibility_reason ??
                      t("scoreControls.celPotrzebujeJawnegoPowiazania")}
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
                  {t("scoreControls.poolShare", { name: claim.owner_name ?? t("scoreControls.czlonkaZespolu"), points: claim.points })}
                </p>
                {claim.context && <ReviewContext context={claim.context} />}
                {canOpenWorkspace && (
                  <Button
                    href={`/app/stage?stage=${claim.stage_key}`}
                    variant="ghost"
                    size="sm"
                  >
                    {t("scoreControls.sprawdzEtap")}
                  </Button>
                )}
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
          <h2 className="text-lg text-white">{t("scoreControls.ustalSkalePracyW")}</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {t("scoreControls.innyFounderAdminLub")}
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {work.map((item) => (
              <div
                key={`${item.kind}-${item.id}`}
                className="rounded-xl border border-white/10 p-4"
              >
                <p className="mb-3 text-sm text-white">
                  {item.kind === "goal" ? t("scoreControls.cel") : t("scoreControls.zadanie")}: {item.title}
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
                    {t("scoreControls.standard")}
                  </label>
                  <label className="flex gap-2 text-sm text-[var(--text-muted)]">
                    <input
                      type="radio"
                      name="weight"
                      value="large"
                      defaultChecked={item.weight === "large"}
                    />{t("scoreControls.wymagajaca")}
                  </label>
                </ActionForm>
              </div>
            ))}
          </div>
        </section>
      )}
      <section className="rounded-2xl border border-white/10 bg-[var(--surface)] p-6">
        <h2 className="text-lg text-white">{t("scoreControls.docenOtrzymanaPomoc")}</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          {t("scoreControls.punktyOtrzymujeAutorWiadomosci")}
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
                    />{t("scoreControls.przydatnyFeedback5Dla")}
                  </label>
                  <label className="flex gap-2 text-sm text-[var(--text-muted)]">
                    <input type="radio" name="kind" value="help" />{" "}{t("scoreControls.pomocZRezultatem10")}
                  </label>
                </ActionForm>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-[var(--text-subtle)]">
            {t("scoreControls.brakOtrzymanychWiadomosciDo")}
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
    proof_requirement?: { label?: string };
    eligibility_reason?: string | null;
    rereview?: boolean;
    tasks: { title: string; owner_name: string | null }[];
  }[];
  program: {
    id: string;
    label: string;
    owner_name: string | null;
    points: number;
    stage_key: string;
    review_key: string;
    context?: ProgramReviewContext;
  }[];
};

export type ProgramReviewContext = {
  answers: { question: string; value: unknown }[];
  goals: {
    id: string;
    title: string;
    proof_requirement?: { label?: string };
    proof_snapshot: Record<string, unknown>;
    proof_url?: string | null;
  }[];
};
export type ScoreWorkspace = { id: string; name: string; is_mentor: boolean };
export function ScoreWorkspaceSelect({
  workspaces,
  current,
}: {
  workspaces: ScoreWorkspace[];
  current: string;
}) {
  const t = useT("score");
  const router = useRouter();
  return (
    <MenuSelect
      ariaLabel={t("scoreControls.zespolDoRecenzjiScore")}
      value={current}
      onChange={(id) =>
        router.push(`/app/score?reviewTeam=${encodeURIComponent(id)}`)
      }
      options={workspaces.map((workspace) => ({
        value: workspace.id,
        label: workspace.name + (workspace.is_mentor ? " · mentor" : ""),
      }))}
    />
  );
}
function answerText(value: unknown, t: (key: "scoreControls.brakOdpowiedzi" | "scoreControls.tak" | "scoreControls.nie") => string): string {
  if (value === null || value === undefined) return t("scoreControls.brakOdpowiedzi");
  if (typeof value === "boolean") return value ? t("scoreControls.tak") : t("scoreControls.nie");
  if (typeof value === "string" || typeof value === "number")
    return String(value);
  if (Array.isArray(value)) return value.map((item) => answerText(item, t)).join("\n");
  if (typeof value === "object")
    return Object.entries(value)
      .map(([key, item]) => `${key}: ${answerText(item, t)}`)
      .join("\n");
  return "";
}
function ReviewContext({ context }: { context: ProgramReviewContext }) {
  const t = useT("score");
  return (
    <details className="my-3 text-sm text-[var(--text-muted)]">
      <summary className="cursor-pointer text-[var(--vairo)]">
        {t("scoreControls.sprawdzOdpowiedziIDowody")}
      </summary>
      <dl className="mt-3 space-y-3">
        {context.answers.map((answer, index) => (
          <div key={index}>
            <dt className="text-white">{answer.question}</dt>
            <dd className="mt-1 whitespace-pre-wrap break-words">
              {answerText(answer.value, t)}
            </dd>
          </div>
        ))}
      </dl>
      {context.goals.map((goal) => (
        <div key={goal.id} className="mt-3">
          <p className="text-white">{goal.title}</p>
          {goal.proof_requirement?.label && (
            <p className="text-xs">{goal.proof_requirement.label}</p>
          )}
          <Snapshot proof={goal.proof_snapshot} proofUrl={goal.proof_url} />
        </div>
      ))}
    </details>
  );
}

function ReviewForm({
  action,
  source,
  expected,
}: {
  action: "review-goal" | "review-program";
  source: string;
  expected: string;
}) {
  const t = useT("score");
  return (
    <div className="mt-3">
      <ActionForm label={t("scoreControls.akceptujeSprawdzonyWynik")}>
        <input type="hidden" name="action" value={action} />
        <input type="hidden" name="source" value={source} />
        <input type="hidden" name="expected" value={expected} />
        <label className="block text-xs text-[var(--text-muted)]">
          {t("scoreControls.coSprawdzilesIJaki")}
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
  const t = useT("score");
  if (!proof || typeof proof.kind !== "string")
    return (
      <p className="my-3 text-sm text-[var(--text-subtle)]">
        {t("scoreControls.dowodNieZostalJeszcze")}
      </p>
    );
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
      <p className="text-xs text-[var(--text-subtle)]">{t("scoreControls.zapisanyDowod")}</p>
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
          Plik: {file.name ?? t("scoreControls.dokument")}.{" "}
          {proofUrl ? (
            <a
              href={proofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--vairo)] underline"
            >
              {t("scoreControls.otworzDowod")}
            </a>
          ) : (
            t("scoreControls.sprawdzGoWPlikach")
          )}
        </p>
      )}
      {proof.kind === "module_result" && (
        <p className="mt-2">
          {t("scoreControls.moduleVersion", { version: String(proof.version ?? "—") })}
        </p>
      )}
      {proof.kind === "select" && (
        <p className="mt-2">Wybrano: {String(proof.option ?? "—")}</p>
      )}
      {proof.kind === "scale" && (
        <p className="mt-2">{t("scoreControls.wynikSkali")}{" "}{String(proof.scale ?? "—")}</p>
      )}
      {proof.kind === "goal_set" && (
        <p className="mt-2">
          {t("scoreControls.goalSet", { count: Array.isArray(proof.goal_ids) ? proof.goal_ids.length : 0 })}
        </p>
      )}
    </div>
  );
}
