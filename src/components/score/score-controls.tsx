"use client";
import { useActionState } from "react";
import { scoreAction } from "@/app/app/score/actions";
import { Button } from "@/components/ui/button";

function ActionForm({ children }: { children: React.ReactNode }) {
  const [state, action, pending] = useActionState(scoreAction, {
    error: null,
    success: null,
  });
  return (
    <form action={action} className="space-y-3">
      {children}
      <Button type="submit" size="sm" loading={pending}>
        Potwierdź
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
}: {
  work: { id: string; title: string; kind: "task" | "goal"; weight: string }[];
  messages: { id: string; body: string; sender_name: string }[];
}) {
  return (
    <div className="space-y-6">
      {work.length > 0 && (
        <section className="rounded-2xl border border-white/10 bg-[var(--surface)] p-6">
          <h2 className="text-lg text-white">Ustal skalę pracy w teamie</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Founder/Admin ustala skalę przed rozpoczęciem pracy. Zadanie: 5 lub
            15 pkt. Cel: 40 lub 80 pkt.
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
          Poniżej do 30 nieocenionych wiadomości (minimum 80 znaków).
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
