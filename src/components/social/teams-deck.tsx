"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Compass, MapPin, Send, Target, UserPlus, Users } from "lucide-react";
import { clearPasses, passCandidate, undoLastPass } from "@/app/app/social/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";
import { reasonsForTeam, type MatchContext } from "@/lib/match";
import { MAX_STARTUPS } from "@/types/startup";
import type { PublicStartup } from "@/types/social";
import { ApplyButton } from "./apply-button";
import { DeckAction, DeckBlock, DeckCover, DeckEnd, DeckFrame } from "./deck-frame";
import { useDeckQueue } from "./use-deck-queue";
import { useLocale, useT } from "@/i18n/client";

type Props = {
  teams: PublicStartup[];
  passedCount: number;
  atTeamLimit: boolean;
  resetHref: string;
  /** Moje umiejętności i lokalizacja — do zdania „dlaczego to widzisz". */
  matchContext: MatchContext;
};

/**
 * Talia teamów. Ta sama mechanika co przy ludziach, inna treść na wierzchu:
 * joinera przekonują otwarte role i to, kto już jest w zespole — więc to idzie
 * na pierwszy plan, a nie sucha nazwa startupu.
 */
export function TeamsDeck({
  teams,
  passedCount,
  atTeamLimit,
  resetHref,
  matchContext,
}: Props) {
  const t = useT("social");
  const locale = useLocale();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, startBusy] = useTransition();

  const deck = useDeckQueue(teams);
  const team = deck.current;

  const pass = () => {
    if (!team) return;
    setError(null);
    deck.markPassed(team.id);
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
      if (!deck.undoLastLocal()) {
        deck.reset();
        router.refresh();
      }
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
      deck.reset();
      router.refresh();
    });
  };

  if (!team && teams.length > 0) {
    const passed = passedCount + deck.passedHere;
    return (
      <DeckEnd
        title={t("deck.teamsEndTitle")}
        description={`${
          deck.sentHere > 0 ? `${t("deck.teamsSent", { count: deck.sentHere })} ` : ""
        }${t("deck.teamsEndBody")}`}
      >
        {passed > 0 ? (
          <Button variant="secondary" block size="lg" loading={busy} onClick={restoreAll}>
            {t("deck.restore", { count: passed })}
          </Button>
        ) : null}
        <Button href={resetHref} variant="ghost">
          {t("deck.loosenFilters")}
        </Button>
      </DeckEnd>
    );
  }

  if (!team) {
    return (
      <EmptyState
        icon={Compass}
        title={
          teams.length === 0
            ? t("discover.noTeams")
            : t("deck.teamsEndTitle")
        }
        description={t("deck.teamsEmpty")}
        action={
          <>
            {passedCount + deck.passedHere > 0 ? (
              <Button variant="secondary" loading={busy} onClick={restoreAll}>
                {t("deck.restore", { count: passedCount + deck.passedHere })}
              </Button>
            ) : null}
            <Button href={resetHref} variant="ghost">
              {t("discover.clearFilters")}
            </Button>
            <Button href="/app/startups/new">{t("deck.createStartup")}</Button>
          </>
        }
      />
    );
  }

  const openRoles = team.open_roles ?? [];

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
      passLabel={t("deck.notThisProject")}
      primaryLabel={t("deck.apply")}
      reasons={reasonsForTeam(team, matchContext, { t, locale })}
      cover={
        <DeckCover
          image={team.logo_url}
          fallback={
            <span className="font-heading text-[72px] font-semibold text-white/85">
              {team.name.trim().charAt(0).toUpperCase()}
            </span>
          }
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
              {t("card.members", { count: team.member_count })}
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
                {t("card.lookingFor", { count: openRoles.length })}
              </Badge>
            </div>
          ) : null}
        </DeckCover>
      }
      action={
        // Przy komplecie teamów pokazujemy wyłączony przycisk z powodem,
        // a nie samo zdanie tekstem — inaczej rząd akcji wygląda na
        // niedokończony.
        atTeamLimit ? (
          <DeckAction
            variant="primary"
            label={t("discover.atLimit", { count: MAX_STARTUPS })}
            icon={<Send className="size-6" />}
            disabled
            title={t("deck.youFull", { count: MAX_STARTUPS })}
          />
        ) : (
          <ApplyButton
            startupId={team.id}
            startupName={team.name}
            openRoles={openRoles}
            onDone={() => deck.handle(team.id)}
            trigger={(open) => (
              <DeckAction
                variant="primary"
                label={t("deck.apply")}
                icon={<Send className="size-6" />}
                onClick={open}
              />
            )}
          />
        )
      }
      body={
        <div className="flex flex-col gap-4">
          {/* Dla kogoś, kto szuka projektu, to jest CAŁA decyzja: czy jest tu
              miejsce dla mnie. Reszta — opis, tagi, skład, opisy ról — czeka
              na profilu teamu, jedno kliknięcie dalej. */}
          <DeckBlock label={openRoles.length > 0 ? t("card.seeking") : t("card.openRoles")}>
            {openRoles.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {openRoles.slice(0, 3).map((role) => (
                  <li key={role.id} className="min-w-0">
                    <p className="text-[14px] font-medium text-white">
                      {role.title}
                      {role.weekly_hours ? (
                        <span className="ml-2 text-[12.5px] font-normal text-[var(--text-subtle)]">
                          {t("card.hoursShort", { hours: role.weekly_hours })}
                        </span>
                      ) : null}
                    </p>
                    {(role.skills ?? []).length > 0 ? (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {(role.skills ?? []).slice(0, 5).map((skill) => (
                          <Pill key={skill}>{skill}</Pill>
                        ))}
                      </div>
                    ) : null}
                  </li>
                ))}
                {openRoles.length > 3 ? (
                  <li className="text-[12.5px] text-[var(--text-subtle)]">
                    {t("card.andMore", { count: openRoles.length - 3 })}
                  </li>
                ) : null}
              </ul>
            ) : (
              <p className="text-[13.5px] leading-relaxed text-[var(--text-subtle)]">
                {t("card.noRoles")}
              </p>
            )}
          </DeckBlock>

          {team.public_tagline && team.public_description ? (
            <DeckBlock label={t("card.about")}>
              <p className="line-clamp-3 whitespace-pre-line text-[14px] leading-relaxed text-[var(--text-muted)]">
                {team.public_description}
              </p>
            </DeckBlock>
          ) : null}
        </div>
      }
      footer={
        <Link
          href={`/app/social/teams/${team.id}`}
          className="underline-offset-2 transition-colors hover:text-white hover:underline"
        >
          {t("card.fullTeamProfile")}
        </Link>
      }
    />
  );
}
