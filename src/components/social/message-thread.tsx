"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, SendHorizontal } from "lucide-react";
import { markConversationRead, sendMessage } from "@/app/app/social/actions";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/social";

type Props = {
  conversationId: string;
  viewerId: string;
  messages: ChatMessage[];
  otherName: string;
  otherFullName: string | null;
  otherAvatarUrl: string | null;
};

/**
 * Wątek rozmowy.
 *
 * Poprzednia wersja miała bąbelki, ale nie wyglądała jak czat — i to jest
 * mierzalne, nie „kwestia gustu". Brakowało czterech rzeczy, których oko
 * szuka odruchowo w każdym komunikatorze:
 *
 *   1. **Wyraźnych stron.** Moje wiadomości były pomarańczowe na 15%, czyli
 *      ledwie ciemniejsze od cudzych. Strona rozmowy musi być czytelna
 *      kątem oka, bez czytania treści — dlatego moje są teraz PEŁNYM
 *      pomarańczem, cudze płaską szarością.
 *   2. **Grupowania.** Trzy wiadomości pod rząd od tej samej osoby to jedna
 *      wypowiedź, nie trzy. Grupa dostaje jeden awatar i jedną godzinę,
 *      a rogi bąbelków w środku grupy są przycięte — to ten szczegół sprawia,
 *      że seria czyta się jako ciąg.
 *   3. **Podziału na dni.** Bez niego „14:32" nad „09:10" wygląda jak błąd.
 *   4. **Pola do pisania jako jednego obiektu.** Prostokątny textarea plus
 *      osobny przycisk obok to formularz. Zaokrąglona pigułka z okrągłym
 *      przyciskiem w środku to komunikator.
 *
 * **Wiadomości dochodzą same** (migracja 019: `messages` w publikacji
 * `supabase_realtime`). Wątek nasłuchuje wstawień do tej jednej rozmowy
 * i przeładowuje dane serwera, zamiast doklejać wiersz z payloadu — dzięki
 * temu nie ma dwóch źródeł prawdy o tym, co jest w rozmowie, a kolejność
 * i godziny liczy zawsze baza.
 *
 * Przycisk odświeżenia **zostaje**. Realtime potrafi zgubić połączenie przy
 * uśpieniu karty albo słabej sieci, a wtedy jedyną informacją dla człowieka
 * jest cisza. Ręczne sprawdzenie musi być pod ręką — i nic nie kosztuje,
 * kiedy nie jest potrzebne.
 */
export function MessageThread({
  conversationId,
  viewerId,
  messages,
  otherName,
  otherFullName,
  otherAvatarUrl,
}: Props) {
  const router = useRouter();
  const endRef = useRef<HTMLDivElement>(null);
  const [local, setLocal] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, startSending] = useTransition();

  // Wiadomość dopisana optymistycznie znika, gdy ta sama wróci z serwera.
  // Bez tego po `router.refresh()` własna wypowiedź renderowała się dwa razy:
  // raz z `local`, raz z odświeżonych propsów. Korekta stanu w trakcie
  // renderu, nie w efekcie — React przerywa wtedy render i zaczyna go od nowa
  // z nową wartością, więc nikt nie zobaczy pośredniej klatki z duplikatem.
  const [seenCount, setSeenCount] = useState(messages.length);
  if (seenCount !== messages.length) {
    setSeenCount(messages.length);
    if (local.length > 0) setLocal([]);
  }

  const all = [...messages, ...local];

  // Otwarcie wątku = przeczytanie. Licznik w nawigacji gaśnie od razu.
  useEffect(() => {
    void markConversationRead(conversationId);
  }, [conversationId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [all.length]);


  // Rozmowa na żywo. Świadomie NIE doklejamy wiersza z payloadu — pobranie
  // z serwera kosztuje jeden przelot, a w zamian nie trzeba godzić dwóch
  // źródeł prawdy o zawartości wątku.
  useEffect(() => {
    if (!conversationId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          // Własne wiadomości już widać — pokazał je optymistyczny zapis.
          if (payload.new.sender_id === viewerId) return;
          // Wątek jest otwarty, więc przychodząca wiadomość jest przeczytana
          // w tej samej sekundzie. Inaczej licznik w menu zapalałby się przy
          // rozmowie, na którą człowiek właśnie patrzy.
          void markConversationRead(conversationId);
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, viewerId, router]);

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
      <div className="flex max-h-[min(58vh,600px)] flex-col gap-0.5 overflow-y-auto rounded-2xl border border-white/[0.07] bg-[var(--surface)] p-4">
        {all.length === 0 ? (
          <p className="py-10 text-center text-[13.5px] text-[var(--text-subtle)]">
            Tu jeszcze nic nie ma. Napisz pierwszą wiadomość do {otherName}.
          </p>
        ) : (
          all.map((message, index) => {
            const mine = message.senderId === viewerId;
            const previous = all[index - 1];
            const next = all[index + 1];

            const startsGroup = !previous || previous.senderId !== message.senderId;
            const endsGroup = !next || next.senderId !== message.senderId;
            const newDay = !previous || !sameDay(previous.createdAt, message.createdAt);

            return (
              <div key={message.id}>
                {newDay ? (
                  <p className="my-3 text-center text-[11.5px] text-[var(--text-faint)]">
                    {dayLabel(message.createdAt)}
                  </p>
                ) : null}

                <div
                  className={cn(
                    "flex items-end gap-2",
                    mine ? "justify-end" : "justify-start",
                    endsGroup ? "mb-2" : "mb-0.5"
                  )}
                >
                  {/* Awatar tylko przy OSTATNIEJ wiadomości w grupie. Przy
                      każdej byłby kolumną powtórzonych twarzy obok jednej
                      wypowiedzi; pusta przestrzeń trzyma wyrównanie. */}
                  {!mine ? (
                    <span className="w-7 shrink-0">
                      {endsGroup ? (
                        <Avatar
                          src={otherAvatarUrl}
                          name={otherFullName}
                          size="xs"
                        />
                      ) : null}
                    </span>
                  ) : null}

                  <div
                    className={cn(
                      "max-w-[min(78%,460px)] px-3.5 py-2",
                      "text-[14px] leading-relaxed",
                      mine
                        ? "bg-[var(--vairo-strong)] text-white"
                        : "bg-[var(--surface-2)] text-[var(--text)]",
                      // Róg „przy sobie" jest ostry w środku grupy i zaokrąglony
                      // na jej końcach — stąd wrażenie jednego dymka, a nie
                      // trzech osobnych.
                      mine
                        ? cn(
                            "rounded-l-2xl",
                            startsGroup ? "rounded-tr-2xl" : "rounded-tr-md",
                            endsGroup ? "rounded-br-2xl" : "rounded-br-md"
                          )
                        : cn(
                            "rounded-r-2xl",
                            startsGroup ? "rounded-tl-2xl" : "rounded-tl-md",
                            endsGroup ? "rounded-bl-2xl" : "rounded-bl-md"
                          )
                    )}
                  >
                    <p className="whitespace-pre-line">{message.body}</p>
                  </div>
                </div>

                {endsGroup ? (
                  <p
                    className={cn(
                      "tabular mb-2 text-[11px] text-[var(--text-faint)]",
                      mine ? "pr-1 text-right" : "pl-10"
                    )}
                  >
                    {new Date(message.createdAt).toLocaleTimeString("pl-PL", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                ) : null}
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

      {/* Pole jako jeden obiekt: pigułka z tekstem w środku i dwoma okrągłymi
          przyciskami. Pierścień pojawia się na całej pigułce, gdy textarea ma
          focus — dzięki temu widać, że to jedna kontrolka, a nie trzy. */}
      <div className="mt-3 flex items-end gap-2 rounded-[22px] border border-white/10 bg-[var(--surface)] py-1.5 pl-4 pr-1.5 transition-colors focus-within:border-[var(--vairo)]/45">
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={(event) => {
            // Enter wysyła, Shift+Enter robi nową linijkę — tak jak wszędzie.
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          rows={1}
          maxLength={4000}
          placeholder={`Napisz do ${otherName}…`}
          className="max-h-32 min-h-9 flex-1 resize-none self-center bg-transparent py-1.5 text-[14px] leading-relaxed text-white outline-none placeholder:text-[var(--text-faint)]"
        />

        <button
          type="button"
          onClick={() => router.refresh()}
          title="Wiadomości dochodzą same — kliknij, jeśli połączenie się zgubiło"
          aria-label="Odśwież rozmowę"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[var(--text-faint)] transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <RefreshCw className="size-4" />
        </button>

        <button
          type="button"
          onClick={submit}
          disabled={body.trim().length === 0 || sending}
          aria-label="Wyślij wiadomość"
          className={cn(
            "inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-colors",
            body.trim().length === 0 || sending
              ? "bg-white/[0.06] text-[var(--text-faint)]"
              : "bg-[var(--vairo-strong)] text-white hover:opacity-90"
          )}
        >
          <SendHorizontal className="size-4" />
        </button>
      </div>
    </div>
  );
}

function sameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

/** „Dzisiaj" / „Wczoraj" / data — bez tego godziny wyglądają jak błąd. */
function dayLabel(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return "Dzisiaj";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Wczoraj";

  return date.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}
