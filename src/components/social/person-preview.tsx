import { Clock, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Pill } from "@/components/ui/pill";
import { DeckBlock, DeckCover } from "./deck-frame";
import { initialsOf } from "@/components/ui/avatar";
import { MAX_STARTUPS } from "@/types/startup";
import { LOOKING_FOR_LABELS, type PublicProfile } from "@/types/social";

/**
 * Podgląd własnej karty — **dokładnie taki sam obiekt, jaki widzą obcy**.
 *
 * Wcześniej na „Mój profil publiczny" stało samo zdjęcie z nakładką, a karta
 * w Odkrywaj miała obok siebie całą prawą kolumnę: fakty, „nad czym pracuję",
 * umiejętności. Podgląd pokazywał więc **mniej niż rzeczywistość** — i to
 * w miejscu, którego jedynym zadaniem jest powiedzieć, jak się wygląda.
 *
 * Dlatego ten komponent składa tę samą kartę z tych samych klocków
 * (`DeckCover`, `DeckBlock`), tylko bez przycisków: podgląd nie jest miejscem
 * do zaczepiania samego siebie. Jeśli karta w Odkrywaj kiedyś się zmieni,
 * zmieni się i tutaj, bo to są te same elementy.
 */
export function PersonPreviewCard({ person }: { person: PublicProfile }) {
  const skills = person.skills ?? [];

  return (
    <article className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-[var(--surface)] lift-2 md:grid md:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
      <DeckCover
        image={person.avatar_url}
        fallback={
          <span className="font-heading text-[64px] font-semibold text-white/85">
            {initialsOf(person.full_name)}
          </span>
        }
      >
        <p className="font-heading text-[24px] font-semibold leading-tight text-white">
          {person.full_name ?? "Bez imienia"}
        </p>
        {person.headline ? (
          <p className="mt-1 line-clamp-2 text-[13.5px] leading-snug text-white/80">
            {person.headline}
          </p>
        ) : null}
      </DeckCover>

      <div className="flex min-w-0 flex-col gap-4 px-5 py-5">
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
            <Badge tone={person.looking_for === "not_looking" ? "neutral" : "brand"}>
              {LOOKING_FOR_LABELS[person.looking_for]}
            </Badge>
          </div>
        ) : null}

        {person.weekly_focus ? (
          <DeckBlock label="Nad czym teraz pracujesz">
            <p className="whitespace-pre-line text-[14px] leading-relaxed text-[var(--text-muted)]">
              {person.weekly_focus}
            </p>
          </DeckBlock>
        ) : null}

        {skills.length > 0 ? (
          <DeckBlock label="Umiesz">
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <Pill key={skill.id}>{skill.label}</Pill>
              ))}
            </div>
          </DeckBlock>
        ) : null}

        {/* Puste miejsca nazywamy wprost. „Karta wygląda dobrze" przy trzech
            pustych sekcjach byłoby nieprawdą, a cisza w tym miejscu czyta się
            jak „tak ma być". */}
        {!person.weekly_focus && skills.length === 0 ? (
          <p className="text-[13px] italic leading-relaxed text-[var(--text-faint)]">
            Prawa kolumna jest pusta — obcy zobaczą samo zdjęcie i imię.
            Uzupełnij „nad czym pracujesz” i umiejętności.
          </p>
        ) : null}
      </div>
    </article>
  );
}
