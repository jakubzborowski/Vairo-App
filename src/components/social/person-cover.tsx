"use client";

import { Clock, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { initialsOf } from "@/components/ui/avatar";
import { MAX_STARTUPS } from "@/types/startup";
import { LOOKING_FOR_LABELS, type PublicProfile } from "@/types/social";
import { DeckCover } from "./deck-frame";

/**
 * Duże zdjęcie osoby z najważniejszymi informacjami wtopionymi w dolną krawędź.
 *
 * Jeden komponent na dwa zastosowania — talia w Odkrywaj i podgląd „tak widzą
 * Cię inni" na własnym profilu. Gdyby to były dwa osobne kawałki kodu, podgląd
 * po pierwszej zmianie przestałby mówić prawdę.
 */
export function PersonCover({
  person,
  /**
   * W talii karta ma obok siebie całą prawą kolumnę, więc fakty (lokalizacja,
   * godziny, liczba teamów) idą tam — na zdjęciu zostaje samo imię i jedno
   * zdanie. W podglądzie „tak widzą Cię inni" kolumny nie ma, więc wszystko
   * musi zmieścić się na zdjęciu.
   */
  facts = true,
}: {
  person: PublicProfile;
  facts?: boolean;
}) {
  return (
    <DeckCover
      image={person.avatar_url}
      fallback={
        <span className="font-heading text-[72px] font-semibold text-white/85">
          {initialsOf(person.full_name)}
        </span>
      }
    >
      <p className="font-heading text-[26px] font-semibold leading-tight text-white">
        {person.full_name ?? "Bez imienia"}
      </p>
      {person.headline ? (
        <p className="mt-1 line-clamp-2 text-[14px] leading-snug text-white/80">
          {person.headline}
        </p>
      ) : null}

      {facts ? (
      <div className="mt-2.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[12.5px] text-white/70">
        {person.location ? (
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5 shrink-0" />
            {person.location}
          </span>
        ) : null}
        {person.weekly_hours ? (
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5 shrink-0" />
            {person.weekly_hours} h/tydz.
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1">
          <Users className="size-3.5 shrink-0" />
          {person.team_count === 0
            ? "Bez teamu"
            : `${person.team_count} z ${MAX_STARTUPS} teamów`}
        </span>
      </div>
      ) : null}

      {facts && person.looking_for ? (
        <div className="mt-3">
          <Badge tone={person.looking_for === "not_looking" ? "neutral" : "brand"}>
            {LOOKING_FOR_LABELS[person.looking_for]}
          </Badge>
        </div>
      ) : null}
    </DeckCover>
  );
}
