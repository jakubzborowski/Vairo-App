"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SendHorizontal } from "lucide-react";
import { markConversationRead, sendMessage } from "@/app/app/social/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/social";

type Props = {
  conversationId: string;
  viewerId: string;
  messages: ChatMessage[];
  otherName: string;
};

/**
 * Wątek rozmowy. Bez czatu na żywo — wiadomości dochodzą po odświeżeniu.
 *
 * Dopisana wiadomość pojawia się od razu po stronie klienta, bo czekanie na
 * przeładowanie strony po wysłaniu wygląda jak zgubiona wiadomość.
 */
export function MessageThread({
  conversationId,
  viewerId,
  messages,
  otherName,
}: Props) {
  const router = useRouter();
  const endRef = useRef<HTMLDivElement>(null);
  const [local, setLocal] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, startSending] = useTransition();

  const all = [...messages, ...local];

  // Otwarcie wątku = przeczytanie. Licznik w nawigacji gaśnie od razu.
  useEffect(() => {
    void markConversationRead(conversationId);
  }, [conversationId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [all.length]);

  const submit = () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    setError(null);

    startSending(async () => {
      const result = await sendMessage({ conversationId, body: trimmed });
      if (result.error) {
        setError(result.error);
        return;
      }
      setLocal((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          senderId: viewerId,
          body: trimmed,
          createdAt: new Date().toISOString(),
        },
      ]);
      setBody("");
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col">
      <div className="flex max-h-[min(60vh,620px)] flex-col gap-2.5 overflow-y-auto rounded-2xl border border-white/[0.07] bg-[var(--surface)] p-4">
        {all.length === 0 ? (
          <p className="py-8 text-center text-[13.5px] text-[var(--text-subtle)]">
            Tu jeszcze nic nie ma. Napisz pierwszą wiadomość do {otherName}.
          </p>
        ) : (
          all.map((message) => {
            const mine = message.senderId === viewerId;
            return (
              <div
                key={message.id}
                className={cn("flex", mine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5",
                    mine
                      ? "bg-[var(--vairo)]/15 text-white"
                      : "bg-[var(--surface-2)] text-[var(--text-muted)]"
                  )}
                >
                  <p className="whitespace-pre-line text-[14px] leading-relaxed">
                    {message.body}
                  </p>
                  <p className="mt-1 text-right text-[11px] text-[var(--text-faint)]">
                    {new Date(message.createdAt).toLocaleTimeString("pl-PL", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {error ? (
        <p className="mt-3 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-[13px] text-[var(--danger)]">
          {error}
        </p>
      ) : null}

      <div className="mt-3 flex items-end gap-2">
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={(event) => {
            // Enter wysyła, Shift+Enter robi nową linijkę — tak jak wszędzie.
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          rows={2}
          maxLength={4000}
          placeholder={`Napisz do ${otherName}…`}
          className="flex-1"
        />
        <Button
          size="lg"
          loading={sending}
          disabled={body.trim().length === 0}
          onClick={submit}
          aria-label="Wyślij wiadomość"
        >
          <SendHorizontal className="size-4" />
        </Button>
      </div>

      <p className="mt-2 text-[12px] text-[var(--text-faint)]">
        Enter wysyła, Shift + Enter przechodzi do nowej linii. Wiadomości nie
        odświeżają się same — wejdź tu ponownie, żeby zobaczyć odpowiedź.
      </p>
    </div>
  );
}
