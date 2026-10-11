import { MapPin, Target, UserPlus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Pill } from "@/components/ui/pill";
import { DeckBlock, DeckCover } from "@/components/social/deck-frame";
import { plural } from "@/lib/utils";

type PreviewRole = {
  id: string;
  title: string;
  weeklyHours: number | null;
  skills: { id: string; label: string }[];
};

/**
 * Podgląd karty teamu — **dokładnie ten obiekt, który widzi ktoś szukający
 * projektu.**
 *
 * Ekran „Profil publiczny teamu" był długą kolumną pól i ani razu nie
 * pokazywał rzeczy, którą się nimi składa. Człowiek wpisywał jedno zdanie
 * o projekcie, nie wiedząc, gdzie ono wyląduje i ile go widać — a to jest
 * dokładnie ten rodzaj niepewności, przez który pola zostają puste.
 *
 * Karta jest zbudowana z tych samych klocków co talia w Odkrywaj
 * (`DeckCover`, `DeckBlock`) i **układa je w tej samej kolejności co
 * `TeamsDeck`**: fakty wtopione w dolną krawędź zdjęcia, otwarte role jako
 * treść. Podgląd, który rozjeżdża się z rzeczywistością, jest gorszy niż jego
 * brak — a największy rozjazd byłby tu na opisie: „O projekcie" **nie jest na
 * karcie**, jest na profilu. Dlatego karta mówi to wprost na dole, zamiast
 * pozwolić komuś sądzić, że dwanaście zdań o pomyśle przeczyta ktoś
 * przewijający talię.
 */
export function TeamPreviewCard({
  name,
  logoUrl,
  tagline,
  location,
  memberCount,
  stageLabel,
  openRoles,
}: {
  name: string;
  logoUrl: string | null;
  tagline: string;
  location: string;
  memberCount: number;
  /** Nazwa etapu albo null, gdy Founder jej nie upublicznił (migracja 016). */
  stageLabel: string | null;
  openRoles: PreviewRole[];
}) {
  const trimmedTagline = tagline.trim();
  const trimmedLocation = location.trim();

  return (
    <article className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-[var(--surface)] lift-2 md:grid md:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
      <DeckCover
        image={logoUrl}
        fallback={
          <span className="font-heading text-[64px] font-semibold text-white/85">
            {name.trim().charAt(0).toUpperCase() || "?"}
          </span>
        }
      >
        <p className="font-heading text-[24px] font-semibold leading-tight text-white">
          {name}
        </p>

        {trimmedTagline ? (
          <p className="mt-1 line-clamp-2 text-[13.5px] leading-snug text-white/80">
            {trimmedTagline}
          </p>
        ) : (
          <p className="mt-1 text-[13px] italic leading-snug text-white/55">
            Tu wejdzie jedno zdanie o Was
          </p>
        )}

        <div className="mt-2.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[12.5px] text-white/70">
          <span className="inline-flex items-center gap-1">
            <Users className="size-3.5 shrink-0" />
            {memberCount} {plural(memberCount, "osoba", "osoby", "osób")}
          </span>
          {stageLabel ? (
            <span className="inline-flex items-center gap-1">
              <Target className="size-3.5 shrink-0" />
              {stageLabel}
            </span>
          ) : null}
          {trimmedLocation ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5 shrink-0" />
              {trimmedLocation}
            </span>
          ) : null}
        </div>

        {openRoles.length > 0 ? (
          <div className="mt-3">
            <Badge tone="brand">
              <UserPlus className="size-3" />
              Szukają{" "}
              {openRoles.length === 1 ? "1 osoby" : `${openRoles.length} osób`}
            </Badge>
          </div>
        ) : null}
      </DeckCover>

      <div className="flex min-w-0 flex-col gap-4 px-5 py-5">
        <DeckBlock label={openRoles.length > 0 ? "Szukają" : "Otwarte role"}>
          {openRoles.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {openRoles.slice(0, 3).map((role) => (
                <li key={role.id} className="min-w-0">
                  <p className="text-[14px] font-medium text-white">
                    {role.title}
                    {role.weeklyHours ? (
                      <span className="ml-2 text-[12.5px] font-normal text-[var(--text-subtle)]">
                        {role.weeklyHours} h/tydz.
                      </span>
                    ) : null}
                  </p>
                  {role.skills.length > 0 ? (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {role.skills.slice(0, 5).map((skill) => (
                        <Pill key={skill.id}>{skill.label}</Pill>
                      ))}
                    </div>
                  ) : null}
                </li>
              ))}
              {openRoles.length > 3 ? (
                <li className="text-[12.5px] text-[var(--text-faint)]">
                  i jeszcze {openRoles.length - 3}
                </li>
              ) : null}
            </ul>
          ) : (
            <p className="text-[13.5px] leading-relaxed text-[var(--text-subtle)]">
              Bez otwartych ról karta nie mówi, kogo szukacie — a to jedyna
              rzecz, którą joiner na niej czyta.
            </p>
          )}
        </DeckBlock>

        {/* Karta = decyzja, profil = szczegóły. Ta granica jest tu napisana,
            bo inaczej pole „O projekcie" wygląda na coś, co przeczyta każdy
            przewijający talię. */}
        <p className="mt-auto border-t border-white/[0.06] pt-3.5 text-[12.5px] leading-relaxed text-[var(--text-subtle)]">
          Opis „O projekcie”, skład zespołu i tagi widać dopiero na profilu
          teamu — jedno kliknięcie dalej.
        </p>
      </div>
    </article>
  );
}
