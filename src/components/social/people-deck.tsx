"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, MapPin, MessageSquare, UserPlus, Users } from "lucide-react";
import { clearPasses, passCandidate, undoLastPass } from "@/app/app/social/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";
import { reasonsForPerson, type MatchContext } from "@/lib/match";
import { MAX_STARTUPS } from "@/types/startup";
import { LOOKING_FOR_LABELS, type PublicProfile } from "@/types/social";
import { DeckAction, DeckBlock, DeckFrame } from "./deck-frame";
import { MessageButton, type ContactContext } from "./message-button";
import { PersonCover } from "./person-cover";
import { InviteButton, type InvitableTeam } from "./invite-button";
import { useDeckQueue } from "./use-deck-queue";

type Props = {
  people: PublicProfile[];
  /** Teamy, do których zapraszający może kogoś dodać (Founder / Admin). */
  invitableTeams: InvitableTeam[];
  /** Wszystkie teamy usera — w ich imieniu może się odezwać. */
  contactContexts: ContactContext[];
  /** profileId → id istniejącej rozmowy, jeśli już się piszą. */
  conversationByProfile: Record<string, string>;
  passedCount: number;
  /** Adres, pod który wraca „Zmień filtry". */
  resetHref: string;
  /** Moje umiejętności i otwarte role — do zdania „dlaczego to widzisz". */
  matchContext: MatchContext;
};

/**
 * Talia ludzi: jedna osoba na ekran, dwie drogi wyjścia.
 *
 * Pominięcie leci od razu na serwer, ale kartę przewijamy bez czekania —
 * decyzja „nie ten profil" nie powinna wymagać patrzenia na spinner.
 */
export function PeopleDeck({
  people,
  invitableTeams,
  contactContexts,
  conversationByProfile,
  passedCount,
  resetHref,
  matchContext,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, startBusy] = useTransition();

  const deck = useDeckQueue(people);
  const person = deck.current;

  const pass = () => {
    if (!person) return;
    setError(null);
    // Karta schodzi natychmiast; zapis leci w tle. Decyzja „nie ten profil"
    // nie powinna wymagać patrzenia na spinner.
    deck.markPassed(person.id);
    startBusy(async () => {
      const result = await passCandidate({ profileId: person.id });
      if (result.error) setError(result.error);
    });
  };

  const undo = () => {
    setError(null);
    startBusy(async () => {
      const result = await undoLastPass("person");
      if (result.error) {
        setError(result.error);
        return;
      }
      // Pominięcie z tej wizyty cofamy lokalnie — osoba wraca na swoje miejsce
      // bez przeładowania. Starsze pominięcia nie mają karty w załadowanej
      // talii, więc tam trzeba dociągnąć listę z serwera.
      if (!deck.undoLastLocal()) {
        deck.reset();
        router.refresh();
      }
    });
  };

  const restoreAll = () => {
    setError(null);
    startBusy(async () => {
      const result = await clearPasses("person");
      if (result.error) {
        setError(result.error);
        return;
      }
      deck.reset();
      router.refresh();
    });
  };

  if (!person) {
    return (
      <EmptyState
        icon={Users}
        title={
          people.length === 0
            ? "Nikt nie pasuje do tych filtrów"
            : "To już wszyscy"
        }
        description={
          passedCount + deck.passedHere > 0
            ? "Możesz przywrócić pominięte osoby albo poluzować filtry. Nowe profile pojawią się, gdy ktoś dołączy do Vairo."
            : "Poluzuj filtry albo wróć później — widzisz tylko tych, którzy zgodzili się być widoczni."
        }
        action={
          <>
            {passedCount + deck.passedHere > 0 ? (
              <Button variant="secondary" loading={busy} onClick={restoreAll}>
                Przywróć pominięte ({passedCount + deck.passedHere})
              </Button>
            ) : null}
            <Button href={resetHref} variant="ghost">
              Wyczyść filtry
            </Button>
          </>
        }
      />
    );
  }

  const skills = person.skills ?? [];
  const full = person.team_count >= MAX_STARTUPS;

  return (
    <DeckFrame
      position={deck.position}
      total={deck.total}
      passedCount={passedCount + deck.passedHere}
      busy={busy}
      error={error}
      canUndo={deck.passedHere > 0 || passedCount > 0}
      onPass={pass}
      onUndo={undo}
      onRestoreAll={restoreAll}
      passLabel="Nie teraz"
      cover={<PersonCover person={person} facts={false} />}
      reasons={reasonsForPerson(person, matchContext)}
      // „Napisz" jest akcją główną dla KAŻDEGO — także dla kogoś bez teamu.
      // Zaproszenie to trzecia, dodatkowa możliwość Foundera i Admina.
      action={
        // Rozmowa już trwa → prowadzimy do wątku, nie otwieramy zaczepki.
        //
        // `MessageButton` obsługuje ten przypadek sam, ale robi to WCZEŚNIEJ
        // niż sięgnie po `trigger` — wracał wtedy prostokątnym przyciskiem
        // pośrodku rzędu okrągłych. Tutaj rozstrzygamy to na miejscu, bo tylko
        // talia potrzebuje innego kształtu.
        conversationByProfile[person.id] ? (
          <DeckAction
            variant="primary"
            label="Otwórz rozmowę"
            icon={<MessageSquare className="size-6" />}
            href={`/app/social/messages/${conversationByProfile[person.id]}`}
          />
        ) : (
          <MessageButton
            recipientId={person.id}
            recipientName={firstName(person.full_name)}
            contexts={contactContexts}
            onDone={() => deck.handle(person.id)}
            trigger={(open) => (
              <DeckAction
                variant="primary"
                label="Napisz"
                icon={<MessageSquare className="size-6" />}
                onClick={open}
              />
            )}
          />
        )
      }
      extraAction={
        invitableTeams.length === 0 ? null : full ? (
          <DeckAction
            variant="extra"
            label="Komplet teamów"
            icon={<UserPlus className="size-5" />}
            disabled
            title={`Ta osoba jest w ${MAX_STARTUPS} teamach`}
          />
        ) : (
          <InviteButton
            profileId={person.id}
            profileName={person.full_name ?? "tę osobę"}
            teams={invitableTeams}
            onDone={() => deck.handle(person.id)}
            trigger={(open) => (
              <DeckAction
                variant="extra"
                label="Zaproś"
                icon={<UserPlus className="size-5" />}
                onClick={open}
              />
            )}
          />
        )
      }
      body={
        <div className="flex flex-col gap-4">
          {/* Fakty jako rząd na górze prawej kolumny — to pierwsze, czego
              szuka się po twarzy: skąd, ile czasu, czy ma jeszcze miejsce. */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] text-[var(--text-subtle)]">
            {person.location ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5 shrink-0" />
                {person.location}
              </span>
            ) : null}
            {person.weekly_hours ? (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5 shrink-0" />
                {person.weekly_hours} h tygodniowo
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-3.5 shrink-0" />
              {person.team_count === 0
                ? "Bez teamu"
                : `${person.team_count} z ${MAX_STARTUPS} teamów`}
            </span>
          </div>

          {person.looking_for ? (
            <div>
              <Badge
                tone={person.looking_for === "not_looking" ? "neutral" : "brand"}
              >
                {LOOKING_FOR_LABELS[person.looking_for]}
              </Badge>
            </div>
          ) : null}

          {person.weekly_focus ? (
            <DeckBlock label="Nad czym teraz pracuje">
              <p className="whitespace-pre-line text-[14px] leading-relaxed text-[var(--text-muted)]">
                {person.weekly_focus}
              </p>
            </DeckBlock>
          ) : null}

          {skills.length > 0 ? (
            <DeckBlock label="Umie">
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill) => (
                  <Pill key={skill.id}>{skill.label}</Pill>
                ))}
              </div>
            </DeckBlock>
          ) : null}
        </div>
      }
      footer={
        <Link
          href={`/app/social/people/${person.id}`}
          className="underline-offset-2 transition-colors hover:text-white hover:underline"
        >
          Zobacz pełny profil
        </Link>
      }
    />
  );
}

/** W przycisku „Napisz do…" imię czyta się lepiej niż imię z nazwiskiem. */
function firstName(fullName: string | null) {
  return fullName?.trim().split(/\s+/)[0] ?? "tej osoby";
}
