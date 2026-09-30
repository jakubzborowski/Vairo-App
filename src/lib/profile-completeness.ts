import type { LookingFor } from "@/types/social";

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
  weight: number;
};

const MIN_SKILLS = 3;

/** Próg, od którego uznajemy profil za gotowy do pokazania. */
export const READY_SCORE = 70;

export function scoreProfile(profile: ProfileForScoring) {
  const missing: MissingPiece[] = [];

  const add = (piece: MissingPiece) => missing.push(piece);

  if (!profile.avatar_url) {
    add({
      key: "avatar",
      label: "Dodaj zdjęcie",
      why: "To pierwsza rzecz, po której ludzie decydują, czy kliknąć w Twój profil.",
      weight: 25,
    });
  }
  if (!nonEmpty(profile.full_name)) {
    add({
      key: "name",
      label: "Uzupełnij imię i nazwisko",
      why: "Bez tego nie pojawiasz się w wyszukiwarce.",
      weight: 15,
    });
  }
  if (!nonEmpty(profile.headline)) {
    add({
      key: "headline",
      label: "Napisz, czym się zajmujesz",
      why: "Jedno zdanie pod imieniem. Bez niego karta nic nie mówi.",
      weight: 15,
    });
  }
  if (!profile.looking_for) {
    add({
      key: "looking_for",
      label: "Zaznacz, czego szukasz",
      why: "Po tym filtrują założyciele, którzy szukają ludzi.",
      weight: 15,
    });
  }
  if (profile.skillCount < MIN_SKILLS) {
    add({
      key: "skills",
      label: `Dodaj co najmniej ${MIN_SKILLS} umiejętności`,
      why: "Teamy szukają po konkretnych umiejętnościach, nie po nazwiskach.",
      weight: 20,
    });
  }
  if (!nonEmpty(profile.weekly_focus)) {
    add({
      key: "focus",
      label: "Napisz, nad czym teraz pracujesz",
      why: "Świeży wpis wypycha Cię wyżej w Odkrywaj.",
      weight: 10,
    });
  }

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
export function scoreTeamProfile(team: TeamForScoring) {
  const missing: MissingPiece[] = [];

  if (!team.logo_url) {
    missing.push({
      key: "avatar",
      label: "Dodaj logo",
      why: "Karta bez logo pokazuje samą literę — wygląda jak konto testowe.",
      weight: 20,
    });
  }
  if (!nonEmpty(team.public_tagline)) {
    missing.push({
      key: "headline",
      label: "Napisz jedno zdanie o projekcie",
      why: "To jedyny tekst widoczny na karcie w Odkrywaj.",
      weight: 20,
    });
  }
  if (!nonEmpty(team.public_description)) {
    missing.push({
      key: "focus",
      label: "Opisz projekt szerzej",
      why: "Bez opisu strona teamu nie odpowiada na pytanie „o co tu chodzi”.",
      weight: 15,
    });
  }
  if (team.openRoleCount === 0) {
    missing.push({
      key: "skills",
      label: "Dodaj co najmniej jedną otwartą rolę",
      why: "Konkretna rola i liczba godzin działają wielokrotnie lepiej niż sama obecność w wyszukiwarce.",
      weight: 35,
    });
  }
  if (!nonEmpty(team.location)) {
    missing.push({
      key: "name",
      label: "Dodaj lokalizację",
      why: "Ludzie filtrują po mieście albo szukają zdalnie.",
      weight: 10,
    });
  }

  const lost = missing.reduce((sum, piece) => sum + piece.weight, 0);
  const score = Math.max(0, 100 - lost);

  return {
    score,
    missing,
    isReady: score >= READY_SCORE,
    topMissing: missing.slice().sort((a, b) => b.weight - a.weight)[0] ?? null,
  };
}
