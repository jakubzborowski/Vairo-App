"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Clock, X } from "lucide-react";
import { respondToJoinRequest } from "@/app/app/social/actions";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/types/startup";
import { JOIN_STATUS_LABELS, type JoinRequest } from "@/types/social";
import { TeamLogo } from "./team-logo";

/**
 * Jedna prośba o dołączenie — ta sama karta dla obu kierunków.
 *
 * Zgłoszenie pokazuje osobę (bo team decyduje o człowieku), zaproszenie
 * pokazuje team (bo człowiek decyduje o teamie). Poza tym mechanika jest
 * identyczna, więc nie ma sensu mieć dwóch komponentów.
 */
export function RequestCard({ request }: { request: JoinRequest }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, startBusy] = useTransition();

  const isApplication = request.direction === "application";
  const pending = request.status === "pending";

  const act = (action: "accept" | "decline" | "withdraw") => {
    setError(null);
    startBusy(async () => {
      const result = await respondToJoinRequest(request.id, action);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <article className="rounded-2xl border border-white/[0.07] bg-[var(--surface)] p-5">
      <div className="flex items-start gap-4">
        {isApplication ? (
          <Avatar
            src={request.profileAvatarUrl}
            name={request.profileName}
            size="md"
          />
        ) : (
          <TeamLogo src={request.startupLogoUrl} name={request.startupName} />
        )}

        <div className="min-w-0 flex-1">
          <p className="text-[14.5px] font-semibold text-white">
            {isApplication ? (
              <Link
                href={`/app/social/people/${request.profileId}`}
                className="underline-offset-2 hover:underline"
              >
                {request.profileName ?? "Ktoś"}
              </Link>
            ) : (
              <Link
                href={`/app/social/teams/${request.startupId}`}
                className="underline-offset-2 hover:underline"
              >
                {request.startupName}
              </Link>
            )}
          </p>
          <p className="mt-0.5 text-[13px] text-[var(--text-subtle)]">
            {isApplication
              ? `chce dołączyć do ${request.startupName}`
              : `zaprasza Cię jako ${ROLE_LABELS[request.proposedRole]}`}
            {request.openRoleTitle ? ` · rola: ${request.openRoleTitle}` : null}
            {!isApplication && request.jobTitle
              ? ` · stanowisko: ${request.jobTitle}`
              : null}
          </p>

          {/* „Zaprasza Cię jako Admin" nie znaczy nic dla kogoś, kto pierwszy
              raz widzi tę aplikację — a to jest decyzja o uprawnieniach, którą
              podejmuje się raz. Dlatego przy roli innej niż zwykły członek
              mówimy wprost, co ona daje. */}
          {!isApplication && request.proposedRole !== "member" ? (
            <p className="mt-1.5 rounded-lg bg-white/[0.04] px-3 py-2 text-[12.5px] leading-relaxed text-[var(--text-subtle)]">
              Co to znaczy: {ROLE_DESCRIPTIONS[request.proposedRole]}
            </p>
          ) : null}

          {isApplication && request.profileHeadline ? (
            <p className="mt-1 text-[12.5px] text-[var(--text-faint)]">
              {request.profileHeadline}
            </p>
          ) : null}
        </div>

        <div className="shrink-0">
          {pending ? (
            <Badge tone="warning">
              <Clock className="size-3" />
              Czeka
            </Badge>
          ) : (
            <Badge
              tone={
                request.status === "accepted"
                  ? "success"
                  : request.status === "declined"
                    ? "danger"
                    : "neutral"
              }
            >
              {JOIN_STATUS_LABELS[request.status]}
            </Badge>
          )}
        </div>
      </div>

      {request.message ? (
        <p className="mt-3.5 whitespace-pre-line rounded-xl bg-white/[0.03] px-4 py-3 text-[13.5px] leading-relaxed text-[var(--text-muted)]">
          {request.message}
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-[13px] text-[var(--danger)]">
          {error}
        </p>
      ) : null}

      {request.canRespond || request.canWithdraw ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {request.canRespond ? (
            <>
              <Button size="sm" loading={busy} onClick={() => act("accept")}>
                <Check className="size-4" />
                {isApplication ? "Przyjmij do teamu" : "Dołącz"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => act("decline")}
              >
                <X className="size-4" />
                Odrzuć
              </Button>
            </>
          ) : null}
          {request.canWithdraw ? (
            <Button
              size="sm"
              variant="ghost"
              loading={busy}
              onClick={() => act("withdraw")}
            >
              Wycofaj
            </Button>
          ) : null}
        </div>
      ) : pending ? (
        <p className="mt-4 text-[12.5px] text-[var(--text-faint)]">
          {isApplication
            ? "Czeka na odpowiedź osób zarządzających teamem."
            : "Czeka na odpowiedź zaproszonej osoby."}
        </p>
      ) : null}
    </article>
  );
}
