"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserRound, Users } from "lucide-react";
import { clearPasses, passCandidate, undoLastPass } from "@/app/app/social/actions";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";
import { MAX_STARTUPS } from "@/types/startup";
import type { PublicProfile } from "@/types/social";
import { DeckFrame, DeckSection } from "./deck-frame";
import { MessageButton, type ContactContext } from "./message-button";
import { PersonCover } from "./person-cover";
import { InviteButton, type InvitableTeam } from "./invite-button";

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
}: Props) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [passedHere, setPassedHere] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, startBusy] = useTransition();

  const person = people[index];

  const advance = () => setIndex((value) => value + 1);

  const pass = () => {
    if (!person) return;
    setError(null);
    advance();
    setPassedHere((value) => value + 1);
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
      setPassedHere((value) => Math.max(0, value - 1));
      setIndex((value) => Math.max(0, value - 1));
      router.refresh();
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
      setIndex(0);
      setPassedHere(0);
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
            : "Przeszedłeś przez wszystkich"
        }
        description={
          passedCount + passedHere > 0
            ? "Możesz przywrócić pominięte osoby albo poluzować filtry. Nowe profile pojawią się, gdy ktoś dołączy do Vairo."
            : "Poluzuj filtry albo wróć później — widzisz tylko tych, którzy zgodzili się być widoczni."
        }
        action={
          <>
            {passedCount + passedHere > 0 ? (
              <Button variant="secondary" loading={busy} onClick={restoreAll}>
                Przywróć pominięte ({passedCount + passedHere})
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
      index={index}
      total={people.length}
      passedCount={passedCount + passedHere}
      busy={busy}
      error={error}
      canUndo={passedHere > 0 || passedCount > 0}
      onPass={pass}
      onUndo={undo}
      onRestoreAll={restoreAll}
      passLabel="Nie teraz"
      cover={<PersonCover person={person} />}
      // „Napisz" jest akcją główną dla KAŻDEGO — także dla kogoś bez teamu.
      // Zaproszenie to osobna, dodatkowa możliwość Foundera i Admina.
      action={
        <MessageButton
          recipientId={person.id}
          recipientName={firstName(person.full_name)}
          contexts={contactContexts}
          existingConversationId={conversationByProfile[person.id] ?? null}
          size="lg"
          onDone={advance}
        />
      }
      extraAction={
        invitableTeams.length === 0 ? null : full ? (
          <Button
            variant="secondary"
            disabled
            title={`Ta osoba jest w ${MAX_STARTUPS} teamach`}
          >
            Komplet teamów — nie można zaprosić
          </Button>
        ) : (
          <InviteButton
            profileId={person.id}
            profileName={person.full_name ?? "tę osobę"}
            teams={invitableTeams}
            variant="secondary"
            onDone={advance}
          />
        )
      }
      details={
        <div className="flex flex-col gap-3">
          <DeckSection title="Nad czym teraz pracuje">
            {person.weekly_focus ? (
              <p className="whitespace-pre-line text-[14px] leading-relaxed text-[var(--text-muted)]">
                {person.weekly_focus}
              </p>
            ) : (
              <p className="text-[13.5px] italic text-[var(--text-faint)]">
                Brak wpisu o tym, nad czym teraz pracuje.
              </p>
            )}
          </DeckSection>

          <DeckSection title="Umiejętności">
            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill) => (
                  <Pill key={skill.id}>{skill.label}</Pill>
                ))}
              </div>
            ) : (
              <p className="inline-flex items-center gap-2 text-[13.5px] text-[var(--text-faint)]">
                <UserRound className="size-4" />
                Bez wpisanych umiejętności.
              </p>
            )}
          </DeckSection>

          <p className="px-1 text-[12.5px] text-[var(--text-faint)]">
            <Link
              href={`/app/social/people/${person.id}`}
              className="text-[var(--text-subtle)] underline-offset-2 hover:text-white hover:underline"
            >
              Otwórz pełny profil
            </Link>{" "}
            · pominięcie jest prywatne, ta osoba się o nim nie dowie.
          </p>
        </div>
      }
    />
  );
}

/** W przycisku „Napisz do…" imię czyta się lepiej niż imię z nazwiskiem. */
function firstName(fullName: string | null) {
  return fullName?.trim().split(/\s+/)[0] ?? "tej osoby";
}
