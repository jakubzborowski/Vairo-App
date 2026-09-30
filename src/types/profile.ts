/**
 * DB shapes for mandatory onboarding:
 * name → idea → tags → done (no skip)
 * + profil społeczny: skille, avatar, weekly focus, widoczność
 */

/**
 * Limit zdjęcia profilowego. Musi zgadzać się z `file_size_limit`
 * bucketu `avatars` (migracje 002 / 002b) — inaczej Storage odrzuci
 * plik, który aplikacja wcześniej przepuściła.
 */
export const AVATAR_MAX_MB = 15;
export const AVATAR_MAX_BYTES = AVATAR_MAX_MB * 1024 * 1024;

export type OnboardingStep =
  | "path"
  | "name"
  | "idea"
  | "categories"
  | "done"
  /** @deprecated stary krok, zostaje dla kont sprzed migracji 003 */
  | "tags";

/**
 * Ścieżka wejścia wybierana przy rejestracji.
 * Różnicuje wyłącznie onboarding — po jego zakończeniu konta są identyczne.
 */
export type OnboardingPath = "joiner" | "founder_idea" | "founder_no_idea";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  idea_description: string | null;
  avatar_url: string | null;
  headline: string | null;
  weekly_focus: string | null;
  weekly_focus_updated_at: string | null;
  is_discoverable: boolean;
  onboarding_path: OnboardingPath | null;
  onboarding_step: OnboardingStep;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Tag = {
  id: string;
  slug: string;
  label: string;
  is_suggested: boolean;
  created_by: string | null;
  created_at: string;
};

export type Skill = {
  id: string;
  slug: string;
  label: string;
  is_suggested: boolean;
  created_by: string | null;
  created_at: string;
};

export type ProfileTag = {
  profile_id: string;
  tag_id: string;
  created_at: string;
};

export type ProfileSkill = {
  profile_id: string;
  skill_id: string;
  created_at: string;
};

// Typy startupu (obecnie w kodzie: "team") dochodzą razem z migracją 003.
// Świadomie nie zostawiamy tu Team/TeamMember, żeby nikt nie zaczął budować
// na modelu, który za chwilę zmienia nazwę i kształt.

export type ProfileOnboardingStatus = {
  id: string;
  email: string | null;
  full_name: string | null;
  idea_description: string | null;
  onboarding_step: OnboardingStep;
  onboarding_completed_at: string | null;
  is_complete: boolean;
  tag_count: number;
};

export function isOnboardingComplete(
  profile: Pick<Profile, "onboarding_completed_at"> | null | undefined
) {
  return Boolean(profile?.onboarding_completed_at);
}

/** Dokąd trafia user z nieukończonym onboardingiem. */
export function onboardingPathForStep(step: OnboardingStep | null | undefined) {
  switch (step) {
    case "name":
      return "/onboarding/name";
    case "idea":
      return "/onboarding/idea";
    case "categories":
    case "tags":
      return "/onboarding/categories";
    case "done":
      return "/app";
    case "path":
    default:
      return "/onboarding/path";
  }
}

/** Kroki ścieżki — używane przez wskaźnik postępu „2 z 4". */
export function stepsForPath(path: OnboardingPath | null | undefined): OnboardingStep[] {
  switch (path) {
    case "founder_idea":
      // categories to dwa ekrany kreatora: kategorie walidacyjne i branża
      return ["path", "name", "idea", "categories", "categories"];
    case "founder_no_idea":
    case "joiner":
      return ["path", "name"];
    default:
      return ["path"];
  }
}
