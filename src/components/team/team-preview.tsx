import { MapPin, Target, UserPlus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Pill } from "@/components/ui/pill";
import { DeckBlock, DeckCover } from "@/components/social/deck-frame";
import { skillLabel } from "@/lib/localized";
import { useT } from "@/i18n/client";

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
  const t = useT("team");
  const ts = useT("social");
  const tl = useT("labels");
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
            {t("preview.taglinePlaceholder")}
          </p>
        )}

        <div className="mt-2.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[12.5px] text-white/70">
          <span className="inline-flex items-center gap-1">
            <Users className="size-3.5 shrink-0" />
            {ts("card.members", { count: memberCount })}
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
              {ts("card.lookingFor", { count: openRoles.length })}
            </Badge>
          </div>
        ) : null}
      </DeckCover>

      <div className="flex min-w-0 flex-col gap-4 px-5 py-5">
        <DeckBlock label={openRoles.length > 0 ? ts("card.seeking") : ts("card.openRoles")}>
          {openRoles.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {openRoles.slice(0, 3).map((role) => (
                <li key={role.id} className="min-w-0">
                  <p className="text-[14px] font-medium text-white">
                    {role.title}
                    {role.weeklyHours ? (
                      <span className="ml-2 text-[12.5px] font-normal text-[var(--text-subtle)]">
                        {ts("card.hoursShort", { hours: role.weeklyHours })}
                      </span>
                    ) : null}
                  </p>
                  {role.skills.length > 0 ? (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {role.skills.slice(0, 5).map((skill) => (
                        <Pill key={skill.id}>{skillLabel(tl, skill)}</Pill>
                      ))}
                    </div>
                  ) : null}
                </li>
              ))}
              {openRoles.length > 3 ? (
                <li className="text-[12.5px] text-[var(--text-subtle)]">
                  {ts("card.andMore", { count: openRoles.length - 3 })}
                </li>
              ) : null}
            </ul>
          ) : (
            <p className="text-[13.5px] leading-relaxed text-[var(--text-subtle)]">
              {t("preview.noRoles")}
            </p>
          )}
        </DeckBlock>

        {/* Karta = decyzja, profil = szczegóły. Ta granica jest tu napisana,
            bo inaczej pole „O projekcie" wygląda na coś, co przeczyta każdy
            przewijający talię. */}
        <p className="mt-auto border-t border-white/[0.06] pt-3.5 text-[12.5px] leading-relaxed text-[var(--text-subtle)]">
          {t("preview.detailsNote")}
        </p>
      </div>
    </article>
  );
}
