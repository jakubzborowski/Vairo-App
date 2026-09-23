"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Compass, MapPin, Target, UserPlus, Users } from "lucide-react";
import { clearPasses, passCandidate, undoLastPass } from "@/app/app/social/actions";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";
import {
  CATEGORY_LABELS,
  MAX_STARTUPS,
  type ValidationCategory,
} from "@/types/startup";
import type { PublicStartup } from "@/types/social";
import { ApplyButton } from "./apply-button";
import { DeckCover, DeckFrame, DeckSection } from "./deck-frame";

type Props = {
  teams: PublicStartup[];
  passedCount: number;
  atTeamLimit: boolean;
  resetHref: string;
};

/**
 * Talia teamów. Ta sama mechanika co przy ludziach, inna treść na wierzchu:
 * joinera przekonują otwarte role i to, kto już jest w zespole — więc to idzie
 * na pierwszy plan, a nie sucha nazwa startupu.
 */
export function TeamsDeck({ teams, passedCount, atTeamLimit, resetHref }: Props) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [passedHere, setPassedHere] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, startBusy] = useTransition();

  const team = teams[index];
  const advance = () => setIndex((value) => value + 1);

  const pass = () => {
    if (!team) return;
    setError(null);
    advance();
    setPassedHere((value) => value + 1);
    startBusy(async () => {
      const result = await passCandidate({ startupId: team.id });
      if (result.error) setError(result.error);
    });
  };

  const undo = () => {
    setError(null);
    startBusy(async () => {
      const result = await undoLastPass("team");
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
      const result = await clearPasses("team");
      if (result.error) {
        setError(result.error);
        return;
      }
      setIndex(0);
      setPassedHere(0);
      router.refresh();
    });
  };

  if (!team) {
    return (
      <EmptyState
        icon={Compass}
        title={
          teams.length === 0
            ? "Żaden team nie pasuje do tych filtrów"
            : "Przejrzałeś wszystkie teamy"
        }
        description="Widoczne są tylko aktywne startupy z włączonym profilem publicznym. Możesz też założyć własny."
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
            <Button href="/app/startups/new">Stwórz startup</Button>
          </>
        }
      />
    );
  }

  const openRoles = team.open_roles ?? [];
  const categories = (team.categories ?? []) as ValidationCategory[];
  const members = team.members ?? [];
  const hidden = Math.max(0, team.member_count - members.length);

  return (
    <DeckFrame
      index={index}
      total={teams.length}
      passedCount={passedCount + passedHere}
      busy={busy}
      error={error}
      canUndo={passedHere > 0 || passedCount > 0}
      onPass={pass}
      onUndo={undo}
      onRestoreAll={restoreAll}
      passLabel="Nie ten projekt"
      cover={
        <DeckCover
          image={team.logo_url}
          fallback={
            <span className="font-heading text-[72px] font-semibold text-white/85">
              {team.name.trim().charAt(0).toUpperCase()}
            </span>
          }
          className="aspect-[4/5]"
        >
          <p className="font-heading text-[26px] font-semibold leading-tight text-white">
            {team.name}
          </p>
          {team.public_tagline ? (
            <p className="mt-1 line-clamp-2 text-[14px] leading-snug text-white/80">
              {team.public_tagline}
            </p>
          ) : null}

          <div className="mt-2.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[12.5px] text-white/70">
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5 shrink-0" />
              {team.member_count} {team.member_count === 1 ? "osoba" : "osób"}
            </span>
            {team.stage_label ? (
              <span className="inline-flex items-center gap-1">
                <Target className="size-3.5 shrink-0" />
                {team.stage_label}
              </span>
            ) : null}
            {team.location ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5 shrink-0" />
                {team.location}
              </span>
            ) : null}
          </div>

          {openRoles.length > 0 ? (
            <div className="mt-3">
              <Badge tone="brand">
                <UserPlus className="size-3" />
                Szukają {openRoles.length === 1 ? "1 osoby" : `${openRoles.length} osób`}
              </Badge>
            </div>
          ) : null}
        </DeckCover>
      }
      action={
        // Przy komplecie teamow pokazujemy zablokowany przycisk, a nie samo
        // zdanie tekstem — inaczej rzad akcji wyglada jak niedokonczony.
        atTeamLimit ? (
          <Button
            variant="secondary"
            size="lg"
            disabled
            title={`Jestes juz w ${MAX_STARTUPS} teamach`}
          >
            Masz już {MAX_STARTUPS} teamy
          </Button>
        ) : (
          <ApplyButton
            startupId={team.id}
            startupName={team.name}
            openRoles={openRoles}
            size="lg"
            onDone={advance}
          />
        )
      }
      details={
        <div className="flex flex-col gap-3">
          <DeckSection title="Kogo szukają">
            {openRoles.length > 0 ? (
              <ul className="flex flex-col gap-2.5">
                {openRoles.map((role) => (
                  <li
                    key={role.id}
                    className="rounded-xl border border-[var(--vairo)]/20 bg-[var(--vairo)]/6 px-4 py-3"
                  >
                    <p className="text-[14px] font-medium text-white">
                      {role.title}
                      {role.weekly_hours ? (
                        <span className="ml-2 text-[12.5px] font-normal text-[var(--text-subtle)]">
                          {role.weekly_hours} h tygodniowo
                        </span>
                      ) : null}
                    </p>
                    {role.description ? (
                      <p className="mt-1 text-[13px] leading-relaxed text-[var(--text-muted)]">
                        {role.description}
                      </p>
                    ) : null}
                    {(role.skills ?? []).length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {(role.skills ?? []).map((skill) => (
                          <Pill key={skill}>{skill}</Pill>
                        ))}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13.5px] leading-relaxed text-[var(--text-subtle)]">
                Nie mają teraz otwartych ról. Zgłoszenie i tak dotrze do osób,
                które prowadzą ten projekt.
              </p>
            )}
          </DeckSection>

          <DeckSection title="O projekcie">
            {team.public_description ? (
              <p className="whitespace-pre-line text-[14px] leading-relaxed text-[var(--text-muted)]">
                {team.public_description}
              </p>
            ) : (
              <p className="text-[13.5px] italic text-[var(--text-faint)]">
                Team nie dodał jeszcze opisu.
              </p>
            )}
            {categories.length > 0 || (team.tags ?? []).length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {categories.map((category) => (
                  <Pill key={category}>{CATEGORY_LABELS[category] ?? category}</Pill>
                ))}
                {(team.tags ?? []).map((tag) => (
                  <Pill key={tag.id}>{tag.label}</Pill>
                ))}
              </div>
            ) : null}
          </DeckSection>

          {members.length > 0 || hidden > 0 ? (
            <DeckSection title="Kto już jest w zespole">
              <ul className="flex flex-col gap-2.5">
                {members.map((member) => (
                  <li key={member.id} className="flex items-center gap-3">
                    <Avatar
                      src={member.avatar_url}
                      name={member.full_name}
                      size="sm"
                    />
                    <span className="min-w-0 flex-1">
                      <Link
                        href={`/app/social/people/${member.id}`}
                        className="block truncate text-[13.5px] text-white underline-offset-2 hover:underline"
                      >
                        {member.full_name ?? "Bez imienia"}
                      </Link>
                      {member.job_title ? (
                        <span className="block truncate text-[12px] text-[var(--text-subtle)]">
                          {member.job_title}
                        </span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
              {hidden > 0 ? (
                <p className="mt-2.5 text-[12.5px] text-[var(--text-faint)]">
                  {members.length > 0 ? "oraz " : ""}
                  {hidden} {hidden === 1 ? "osoba" : "osób"} bez profilu publicznego.
                </p>
              ) : null}
            </DeckSection>
          ) : null}

          <p className="px-1 text-[12.5px] text-[var(--text-faint)]">
            <Link
              href={`/app/social/teams/${team.id}`}
              className="text-[var(--text-subtle)] underline-offset-2 hover:text-white hover:underline"
            >
              Otwórz stronę teamu
            </Link>{" "}
            · pominięcie jest prywatne, team się o nim nie dowie.
          </p>
        </div>
      }
    />
  );
}
