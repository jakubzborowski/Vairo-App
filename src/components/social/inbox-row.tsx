"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  CircleDot,
  CircleSlash,
  MessageSquare,
  UserPlus,
  X,
} from "lucide-react";
import {
  respondToContact,
  respondToJoinRequest,
} from "@/app/app/social/actions";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { ContactSignal, JoinRequest } from "@/types/social";
import { TeamLogo } from "./team-logo";

/**
 * Jeden wiersz skrzynki — zaczepka albo sprawa członkostwa, ten sam kształt.
 *
 * Wcześniej każda pozycja była osobną kartą na 150 px: awatar, nagłówek,
 * podtytuł, ramka z wiadomością, plakietka statusu, rząd przycisków. Przy
 * czterech sprawach ekran wyglądał jak cztery formularze jeden pod drugim
 * i **nie dało się ich przebiec wzrokiem** — a skrzynka jest po to, żeby
 * w pięć sekund zobaczyć, ile tego jest i co wymaga ruchu.
 *
 * Dlatego to jest lista w układzie, który każdy zna z GitHuba: jeden kontener,
 * wiersze oddzielone kreską, stan po lewej jako ikona, treść w dwóch liniach,
 * akcja po prawej. Gęsto, skanowalnie, bez ani jednego nagłówka sekcji.
 *
 * Wiadomość zostaje w drugiej linii, przycięta do jednej — to na jej podstawie
 * podejmuje się decyzję, więc nie może zniknąć, ale nie musi też rozpychać
 * wiersza na pół ekranu. Pełna treść jest na rozwinięciu.
 */

type Props =
  | { kind: "signal"; signal: ContactSignal; conversationId?: string | null }
  | { kind: "request"; request: JoinRequest };

export function InboxRow(props: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, startBusy] = useTransition();
  const { toast } = useToast();

  const run = (
    fn: () => Promise<{ error: string | null; conversationId?: string | null }>,
    /** Co powiedzieć po udanej akcji. Bez tego zapis kończy się ciszą,
        a cisza po wysłaniu czegoś do obcej osoby czyta się jak niepewność. */
    success?: string
  ) => {
    setError(null);
    startBusy(async () => {
      const result = await fn();
      if (result.error) {
        setError(result.error);
        return;
      }
      if (success) toast({ title: success });
      if (result.conversationId) {
        router.push(`/app/social/messages/${result.conversationId}`);
      }
      router.refresh();
    });
  };

  const view = props.kind === "signal" ? describeSignal(props) : describeRequest(props);

  return (
    <li className="px-4 py-3 transition-colors hover:bg-white/[0.02]">
      <div className="flex items-start gap-3">
        <span className="mt-1 shrink-0" title={view.stateLabel} aria-hidden="true">
          {view.stateIcon}
        </span>

        {view.avatar}

        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-baseline gap-x-1.5 text-[13.5px] leading-snug">
            <Link
              href={view.href}
              className="font-medium text-white underline-offset-2 hover:underline"
            >
              {view.title}
            </Link>
            <span className="text-[var(--text-subtle)]">{view.summary}</span>
          </p>

          {view.message ? (
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              className="mt-0.5 block w-full text-left text-[12.5px] leading-relaxed text-[var(--text-subtle)] transition-colors hover:text-white"
            >
              <span className={open ? "whitespace-pre-line" : "line-clamp-1"}>
                „{view.message}”
              </span>
            </button>
          ) : null}

          {view.note && open ? (
            <p className="mt-1.5 rounded-lg bg-white/[0.04] px-3 py-2 text-[12.5px] leading-relaxed text-[var(--text-subtle)]">
              {view.note}
            </p>
          ) : null}

          {error ? (
            <p className="mt-1.5 text-[12.5px] text-[var(--danger)]">{error}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {view.actions(run, busy)}
          <span className="tabular hidden w-16 text-right text-[11.5px] text-[var(--text-faint)] sm:block">
            {formatAge(view.createdAt)}
          </span>
        </div>
      </div>
    </li>
  );
}

type Runner = (
  fn: () => Promise<{ error: string | null; conversationId?: string | null }>,
  success?: string
) => void;

type RowView = {
  stateIcon: React.ReactNode;
  stateLabel: string;
  avatar: React.ReactNode;
  href: string;
  title: string;
  summary: string;
  message: string | null;
  note: string | null;
  createdAt: string;
  actions: (run: Runner, busy: boolean) => React.ReactNode;
};

const ICON = {
  waiting: <CircleDot className="size-4 text-[var(--warning)]" />,
  done: <Check className="size-4 text-[var(--success)]" />,
  closed: <CircleSlash className="size-4 text-[var(--text-faint)]" />,
};

function describeSignal({
  signal,
  conversationId,
}: {
  signal: ContactSignal;
  conversationId?: string | null;
}): RowView {
  return {
    stateIcon:
      signal.status === "pending"
        ? ICON.waiting
        : signal.status === "accepted"
          ? ICON.done
          : ICON.closed,
    stateLabel:
      signal.status === "pending"
        ? "Czeka na odpowiedź"
        : signal.status === "accepted"
          ? "Przyjęte"
          : "Zamknięte",
    avatar: (
      <Avatar src={signal.otherAvatarUrl} name={signal.otherName} size="sm" />
    ),
    href: `/app/social/people/${signal.otherId}`,
    title: signal.otherName ?? "Ktoś",
    summary: signal.contextStartupName
      ? `pisze w imieniu ${signal.contextStartupName}`
      : signal.canRespond
        ? "chce się odezwać"
        : "— zaczepka wysłana",
    message: signal.message,
    note: signal.contextStartupName
      ? `Kontakt w imieniu teamu ${signal.contextStartupName}. Odpowiadasz zespołowi, nie osobie prywatnie.`
      : null,
    createdAt: signal.createdAt,
    actions: (run, busy) => (
      <>
        {signal.canRespond ? (
          <>
            <Button
              size="sm"
              loading={busy}
              onClick={() => run(() => respondToContact(signal.id, "accept"), "Kontakt przyjęty — rozmowa otwarta")}
            >
              <Check className="size-4" />
              <span className="hidden sm:inline">Przyjmij</span>
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              disabled={busy}
              title="Nie teraz"
              onClick={() => run(() => respondToContact(signal.id, "decline"), "Odrzucone")}
            >
              <X className="size-4" />
              <span className="sr-only">Nie teraz</span>
            </Button>
          </>
        ) : null}

        {signal.canWithdraw ? (
          <Button
            size="sm"
            variant="ghost"
            loading={busy}
            onClick={() => run(() => respondToContact(signal.id, "withdraw"), "Zaczepka wycofana")}
          >
            Wycofaj
          </Button>
        ) : null}

        {signal.status === "accepted" && conversationId ? (
          <Button size="sm" variant="secondary" href={`/app/social/messages/${conversationId}`}>
            <MessageSquare className="size-4" />
            <span className="hidden sm:inline">Rozmowa</span>
          </Button>
        ) : null}
      </>
    ),
  };
}

function describeRequest({ request }: { request: JoinRequest }): RowView {
  const isApplication = request.direction === "application";

  return {
    stateIcon:
      request.status === "pending"
        ? ICON.waiting
        : request.status === "accepted"
          ? ICON.done
          : ICON.closed,
    stateLabel:
      request.status === "pending"
        ? "Czeka na odpowiedź"
        : request.status === "accepted"
          ? "Przyjęte"
          : "Zamknięte",
    avatar: isApplication ? (
      <Avatar src={request.profileAvatarUrl} name={request.profileName} size="sm" />
    ) : (
      <TeamLogo src={request.startupLogoUrl} name={request.startupName} size="sm" />
    ),
    href: isApplication
      ? `/app/social/people/${request.profileId}`
      : `/app/social/teams/${request.startupId}`,
    title: isApplication ? (request.profileName ?? "Ktoś") : request.startupName,
    summary: isApplication
      ? `chce dołączyć do ${request.startupName}${request.openRoleTitle ? ` · ${request.openRoleTitle}` : ""}`
      : "zaprasza Cię do zespołu",
    message: request.message,
    // Po dołączeniu każdy jest Członkiem — i tak to nazywamy, zamiast
    // obiecywać rolę, której przyjęcie zaproszenia i tak nie nadaje.
    note: !isApplication
      ? "Dołączasz jako Członek: czytasz wszystko, co zespół uzupełnił. Wyższe uprawnienia nadaje później Founder albo Admin."
      : null,
    createdAt: request.createdAt,
    actions: (run, busy) => (
      <>
        {request.canRespond ? (
          <>
            <Button
              size="sm"
              loading={busy}
              onClick={() => run(
                  () => respondToJoinRequest(request.id, "accept", request.direction),
                  isApplication ? "Dodane do zespołu jako Członek" : "Dołączasz do zespołu"
                )}
            >
              <UserPlus className="size-4" />
              <span className="hidden sm:inline">
                {isApplication ? "Przyjmij" : "Dołącz"}
              </span>
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              disabled={busy}
              title="Odrzuć"
              onClick={() => run(() => respondToJoinRequest(request.id, "decline"), "Odrzucone")}
            >
              <X className="size-4" />
              <span className="sr-only">Odrzuć</span>
            </Button>
          </>
        ) : null}

        {request.canWithdraw ? (
          <Button
            size="sm"
            variant="ghost"
            loading={busy}
            onClick={() => run(() => respondToJoinRequest(request.id, "withdraw"), "Wycofane")}
          >
            Wycofaj
          </Button>
        ) : null}

        {request.status === "accepted" && !isApplication ? (
          <Button size="sm" variant="ghost" href="/app/team">
            <ArrowRight className="size-4" />
            <span className="hidden sm:inline">Team</span>
          </Button>
        ) : null}
      </>
    ),
  };
}

/** Wiek sprawy, nie data — w skrzynce liczy się „jak długo ktoś czeka". */
function formatAge(iso: string) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const minutes = Math.floor((Date.now() - then) / 60000);
  if (minutes < 1) return "teraz";
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} godz.`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} dni`;
  return new Date(iso).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
  });
}
