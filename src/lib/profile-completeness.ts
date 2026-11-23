import type { LookingFor } from "@/types/social";
import type { MessageKey } from "@/i18n/messages";
import type { Translate } from "@/i18n/translator";

/**
 * Na ile profil nadaje się do pokazania obcym.
 *
 * Karta w Odkrywaj jest tak dobra, jak profil za nią. Bez zdjęcia i zdania
 * o sobie to pusty prostokąt z inicjałami — a człowiek, który go wystawia,
 * nie ma jak się o tym dowiedzieć. Ta funkcja jest po to, żeby aplikacja
 * powiedziała mu to wprost, zanim zacznie się dziwić, że nikt nie pisze.
 *
 * Wagi nie są demokratyczne: zdjęcie waży najwięcej, bo w tej warstwie decyduje
 * o tym, czy ktokolwiek kliknie.
 */

export type ProfileForScoring = {
  full_name?: string | null;
  avatar_url?: string | null;
  headline?: string | null;
  weekly_focus?: string | null;
  looking_for?: LookingFor | string | null;
  skillCount: number;
};

export type MissingPiece = {
  key: "avatar" | "name" | "headline" | "looking_for" | "skills" | "focus";
  label: string;
  /** Dlaczego to ma znaczenie — bez tego user czyta listę jako czepianie się. */
  why: string;
  /** Krótka nazwa braku do wyliczenia w zdaniu („Brakuje: logo, opisu…”). */
  short?: string;
  weight: number;
};

const MIN_SKILLS = 3;

/** Próg, od którego uznajemy profil za gotowy do pokazania. */
export const READY_SCORE = 70;

export function scoreProfile(
  profile: ProfileForScoring,
  /** Słownik `social` — etykiety braków są w `completeness.<key>.label|why`. */
  t: Translate<MessageKey<"social">>
) {
  const missing: MissingPiece[] = [];

  const add = (key: MissingPiece["key"], weight: number) =>
    missing.push({
      key,
      label: t(`completeness.${key}.label`, { min: MIN_SKILLS }),
      why: t(`completeness.${key}.why`),
      weight,
    });

  if (!profile.avatar_url) add("avatar", 25);
  if (!nonEmpty(profile.full_name)) add("name", 15);
  if (!nonEmpty(profile.headline)) add("headline", 15);
  if (!profile.looking_for) add("looking_for", 15);
  if (profile.skillCount < MIN_SKILLS) add("skills", 20);
  if (!nonEmpty(profile.weekly_focus)) add("focus", 10);

  const lost = missing.reduce((sum, piece) => sum + piece.weight, 0);
  const score = Math.max(0, 100 - lost);

  return {
    score,
    missing,
    isReady: score >= READY_SCORE,
    /** Najważniejszy brak — do jednozdaniowej podpowiedzi. */
    topMissing: missing.slice().sort((a, b) => b.weight - a.weight)[0] ?? null,
  };
}

function nonEmpty(value?: string | null) {
  return Boolean(value && value.trim().length > 0);
}

// ---------------------------------------------------------------------------
// To samo dla teamu
// ---------------------------------------------------------------------------

export type TeamForScoring = {
  logo_url?: string | null;
  public_tagline?: string | null;
  public_description?: string | null;
  location?: string | null;
  openRoleCount: number;
};

/**
 * Startup bez logo, opisu i otwartych ról ma w talii dokładnie ten sam problem
 * co pusty profil osoby: jest widoczny i nie daje powodu, żeby się zgłosić.
 *
 * Otwarte role ważą najwięcej, bo to jedyna informacja, która mówi joinerowi,
 * czego team od niego oczekuje.
 */
export function scoreTeamProfile(
  team: TeamForScoring,
  /** Słownik `social` — `teamCompleteness.<logo|tagline|description|roles|location>.label|why`. */
  t: Translate<MessageKey<"social">>
) {
  const missing: MissingPiece[] = [];
  const add = (
    key: MissingPiece["key"],
    text: "logo" | "tagline" | "description" | "roles" | "location",
    weight: number
  ) =>
    missing.push({
      key,
      label: t(`teamCompleteness.${text}.label`),
      why: t(`teamCompleteness.${text}.why`),
      short: t(`teamCompleteness.${text}.short`),
      weight,
    });

  if (!team.logo_url) add("avatar", "logo", 20);
  if (!nonEmpty(team.public_tagline)) add("headline", "tagline", 20);
  if (!nonEmpty(team.public_description)) add("focus", "description", 15);
  if (team.openRoleCount === 0) add("skills", "roles", 35);
  if (!nonEmpty(team.location)) add("name", "location", 10);

  const lost = missing.reduce((sum, piece) => sum + piece.weight, 0);
  const score = Math.max(0, 100 - lost);

  return {
    score,
    missing,
    isReady: score >= READY_SCORE,
    topMissing: missing.slice().sort((a, b) => b.weight - a.weight)[0] ?? null,
  };
}
