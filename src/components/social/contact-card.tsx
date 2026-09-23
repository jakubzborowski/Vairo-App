"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Check, Clock, MessageSquare, X } from "lucide-react";
import { respondToContact } from "@/app/app/social/actions";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CONTACT_STATUS_LABELS, type ContactSignal } from "@/types/social";

/**
 * Jedna zaczepka. Ta sama karta dla odebranych i wysłanych — różni się tylko
 * tym, kto ma teraz ruch.
 *
 * Kontekst („w imieniu teamu") jest wyróżniony, bo to on decyduje, jak czytać
 * całą wiadomość.
 */
export function ContactCard({
  signal,
  conversationId,
}: {
  signal: ContactSignal;
  /** Rozmowa, jeśli kontakt został już przyjęty. */
  conversationId?: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, startBusy] = useTransition();

  const act = (action: "accept" | "decline" | "withdraw") => {
    setError(null);
    startBusy(async () => {
      const result = await respondToContact(signal.id, action);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.conversationId) {
        router.push(`/app/social/messages/${result.conversationId}`);
      }
      router.refresh();
    });
  };

  return (
    <article className="rounded-2xl border border-white/[0.07] bg-[var(--surface)] p-5">
      <div className="flex items-start gap-4">
        <Avatar src={signal.otherAvatarUrl} name={signal.otherName} size="md" />

        <div className="min-w-0 flex-1">
          <Link
            href={`/app/social/people/${signal.otherId}`}
            className="text-[14.5px] font-semibold text-white underline-offset-2 hover:underline"
          >
            {signal.otherName ?? "Ktoś"}
          </Link>
          {signal.otherHeadline ? (
            <p className="mt-0.5 text-[13px] text-[var(--text-subtle)]">
              {signal.otherHeadline}
            </p>
          ) : null}

          {signal.contextStartupName ? (
            <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-[var(--vairo)]/12 px-2 py-0.5 text-[12px] text-[var(--vairo)]">
              <Building2 className="size-3" />
              {signal.canRespond
                ? `Pisze w imieniu ${signal.contextStartupName}`
                : `Napisane w imieniu ${signal.contextStartupName}`}
            </p>
          ) : null}
        </div>

        <div className="shrink-0">
          {signal.status === "pending" ? (
            <Badge tone="warning">
              <Clock className="size-3" />
              Czeka
            </Badge>
          ) : (
            <Badge
              tone={
                signal.status === "accepted"
                  ? "success"
                  : signal.status === "declined"
                    ? "danger"
                    : "neutral"
              }
            >
              {CONTACT_STATUS_LABELS[signal.status]}
            </Badge>
          )}
        </div>
      </div>

      {signal.message ? (
        <p className="mt-3.5 whitespace-pre-line rounded-xl bg-white/[0.03] px-4 py-3 text-[13.5px] leading-relaxed text-[var(--text-muted)]">
          {signal.message}
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-[13px] text-[var(--danger)]">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {signal.canRespond ? (
          <>
            <Button size="sm" loading={busy} onClick={() => act("accept")}>
              <Check className="size-4" />
              Przyjmij i odpisz
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => act("decline")}
            >
              <X className="size-4" />
              Nie teraz
            </Button>
          </>
        ) : null}

        {signal.canWithdraw ? (
          <Button size="sm" variant="ghost" loading={busy} onClick={() => act("withdraw")}>
            Wycofaj
          </Button>
        ) : null}

        {signal.status === "accepted" && conversationId ? (
          <Button
            size="sm"
            variant="secondary"
            href={`/app/social/messages/${conversationId}`}
          >
            <MessageSquare className="size-4" />
            Otwórz rozmowę
          </Button>
        ) : null}

        {signal.status === "pending" && !signal.canRespond && !signal.canWithdraw ? (
          <p className="text-[12.5px] text-[var(--text-faint)]">
            Czeka na odpowiedź drugiej strony.
          </p>
        ) : null}
      </div>
    </article>
  );
}
