"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, MessageSquare } from "lucide-react";
import { startContact } from "@/app/app/social/actions";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export type ContactContext = { id: string; name: string };

type Props = {
  recipientId: string;
  recipientName: string;
  /** Teamy, w imieniu których user może się odezwać. Pusta lista = tylko prywatnie. */
  contexts: ContactContext[];
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary";
  className?: string;
  /** Talia Odkrywaj przechodzi dalej po wysłaniu. */
  onDone?: () => void;
  /** Gdy rozmowa już trwa — zamiast zaczepki otwieramy wątek. */
  existingConversationId?: string | null;
  blockedReason?: string | null;
  /**
   * Własny wyzwalacz zamiast zwykłego przycisku. Talia w Odkrywaj podaje tu
   * okrągły `DeckAction`; lista i profil publiczny zostają przy przycisku.
   * Modal, walidacja i akcja serwerowa są w obu przypadkach te same — bez
   * tego byłyby dwie kopie tego samego formularza.
   */
  trigger?: (open: () => void) => React.ReactNode;
};

/**
 * „Napisz" — pierwszy krok kontaktu w Social.
 *
 * Dlaczego to jest osobna akcja od zaproszenia do teamu: zaproszenie może
 * wysłać tylko Founder albo Admin, więc bez tego przycisku osoba bez teamu
 * mogła w Odkrywaj wyłącznie oglądać. To była ślepa uliczka dokładnie dla
 * tego, dla kogo Social powstał.
 *
 * Kontekst („prywatnie" albo „w imieniu teamu") wybieramy świadomie, bo
 * odbiorca musi wiedzieć, z czym ma do czynienia — inaczej wiadomość od
 * nieznajomego nic nie znaczy.
 */
export function MessageButton({
  recipientId,
  recipientName,
  trigger,
  contexts,
  size = "md",
  variant = "primary",
  className,
  onDone,
  existingConversationId,
  blockedReason,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [contextId, setContextId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, startSending] = useTransition();
  const { toast } = useToast();

  if (blockedReason) {
    return (
      <span className="text-[12px] text-[var(--text-faint)]">{blockedReason}</span>
    );
  }

  // Rozmowa już trwa — nie ma po co pisać zaczepki, prowadzimy do wątku.
  if (existingConversationId) {
    return (
      <Button
        href={`/app/social/messages/${existingConversationId}`}
        variant="secondary"
        size={size}
        className={className}
      >
        <MessageSquare className="size-4" />
        Otwórz rozmowę
      </Button>
    );
  }

  const submit = () => {
    setError(null);
    startSending(async () => {
      const result = await startContact({
        recipientId,
        message,
        contextStartupId: contextId,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      setMessage("");
      onDone?.();
      toast({
        title: "Wiadomość wysłana",
        description: `${recipientName} zobaczy ją w Zaproszeniach. Rozmowa otworzy się po przyjęciu.`,
      });
      if (result.conversationId) {
        router.push(`/app/social/messages/${result.conversationId}`);
      }
      router.refresh();
    });
  };

  return (
    <>
      {trigger ? (
        trigger(() => setOpen(true))
      ) : (
        <Button
          variant={variant}
          size={size}
          className={className}
          onClick={() => setOpen(true)}
        >
          <MessageSquare className="size-4" />
          Napisz
        </Button>
      )}

      {open ? (
        <Modal
          title={`Napisz do ${recipientName}`}
          description="Wiadomość trafi jako zaczepka. Rozmowa otworzy się, gdy druga strona ją przyjmie."
          onClose={() => setOpen(false)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={sending}>
                Anuluj
              </Button>
              {/* Zaczepka bez treści nie ma sensu — to jedyna rzecz, którą
                  odbiorca dostaje do decyzji. Przycisk jest więc wyłączony,
                  ale POWÓD stoi obok, bo wyszarzony przycisk bez wyjaśnienia
                  czyta się jak awaria. */}
              {message.trim().length === 0 ? (
                <span className="text-[12.5px] text-[var(--text-subtle)]">
                  Napisz wiadomość, żeby wysłać
                </span>
              ) : null}
              <Button
                onClick={submit}
                loading={sending}
                disabled={message.trim().length === 0}
                title={
                  message.trim().length === 0
                    ? "Wpisz wiadomość — bez niej druga strona nie ma na czym oprzeć decyzji"
                    : undefined
                }
              >
                Wyślij
              </Button>
            </>
          }
        >
          {contexts.length > 0 ? (
            <div>
              <p className="mb-2 text-[13px] font-medium text-[var(--text-muted)]">
                Piszesz jako
              </p>
              <div className="flex flex-col gap-1.5">
                <ContextChoice
                  selected={contextId === null}
                  onSelect={() => setContextId(null)}
                  title="Ja, prywatnie"
                  description="Zwykła wiadomość od osoby do osoby."
                />
                {contexts.map((context) => (
                  <ContextChoice
                    key={context.id}
                    selected={contextId === context.id}
                    onSelect={() => setContextId(context.id)}
                    title={`W imieniu ${context.name}`}
                    description="Odbiorca zobaczy, że piszesz z tego teamu, i jego publiczną kartę."
                  />
                ))}
              </div>
            </div>
          ) : null}

          <Field
            label="Wiadomość"
            hint="Napisz, dlaczego się odzywasz. Jedno konkretne zdanie działa lepiej niż „cześć”."
            counter={{ value: message.length, max: 600 }}
          >
            {({ id }) => (
              <Textarea
                id={id}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={5}
                maxLength={600}
                placeholder="Np. Widzę, że robisz hardware — sam składam prototyp czujnika i szukam kogoś do elektroniki."
                autoFocus
              />
            )}
          </Field>

          {error ? (
            <p className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-[13px] text-[var(--danger)]">
              {error}
            </p>
          ) : null}
        </Modal>
      ) : null}
    </>
  );
}

function ContextChoice({
  selected,
  onSelect,
  title,
  description,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-left transition-colors",
        selected
          ? "border-[var(--vairo)]/60 bg-[var(--vairo)]/8"
          : "border-white/10 hover:border-white/22"
      )}
    >
      <span
        className={cn(
          "mt-0.5 inline-flex size-[18px] shrink-0 items-center justify-center rounded-full border",
          selected
            ? "border-[var(--vairo)] bg-[var(--vairo)] text-black"
            : "border-white/25"
        )}
        aria-hidden="true"
      >
        {selected ? <Check className="size-3" strokeWidth={3} /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-medium text-white">{title}</span>
        <span className="mt-0.5 block text-[12.5px] leading-relaxed text-[var(--text-subtle)]">
          {description}
        </span>
      </span>
    </button>
  );
}
