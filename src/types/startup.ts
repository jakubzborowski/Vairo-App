/**
 * Startup = workspace. W bazie i w kodzie mówimy „startup", w interfejsie
 * „team" albo nazwą własną — kiedy już w czymś jesteś, to jest Twój team.
 */

export const MAX_STARTUPS = 3;

/** Kategorie walidacyjne — zamknięty zbiór, sterują zakresem Idea Stage. */
export const VALIDATION_CATEGORIES = [
  "general",
  "saas",
  "hardware",
  "b2b",
  "b2c",
] as const;

export type ValidationCategory = (typeof VALIDATION_CATEGORIES)[number];

/** `general` jest zawsze aktywne i nie da się go odznaczyć. */
export const SELECTABLE_CATEGORIES: {
  key: Exclude<ValidationCategory, "general">;
  label: string;
  description: string;
  group: "product" | "customer";
}[] = [
  {
    key: "saas",
    label: "SaaS",
    description: "Oprogramowanie w abonamencie",
    group: "product",
  },
  {
    key: "hardware",
    label: "Hardware",
    description: "Produkt fizyczny",
    group: "product",
  },
  {
    key: "b2b",
    label: "B2B",
    description: "Sprzedajesz firmom",
    group: "customer",
  },
  {
    key: "b2c",
    label: "B2C",
    description: "Sprzedajesz osobom prywatnym",
    group: "customer",
  },
];

export const CATEGORY_LABELS: Record<ValidationCategory, string> = {
  general: "Ogólna walidacja",
  saas: "SaaS",
  hardware: "Hardware",
  b2b: "B2B",
  b2c: "B2C",
};

export type StartupRole = "founder" | "admin" | "member";
export type StartupStatus = "active" | "paused" | "archived";

/**
 * Role = uprawnienia. Stanowisko (CEO, CTO) to osobne pole `job_title` —
 * nazwanie kogoś CTO nie może po cichu dać mu prawa zmieniania walidacji.
 *
 * Te funkcje służą WYŁĄCZNIE do rysowania interfejsu. Prawdziwą bramką jest
 * RLS w bazie (migracja 008) plus sprawdzenie w server action; ukrycie
 * przycisku nie jest zabezpieczeniem.
 */
export const ROLE_LABELS: Record<StartupRole, string> = {
  founder: "Founder",
  admin: "Admin",
  member: "Członek",
};

export const ROLE_DESCRIPTIONS: Record<StartupRole, string> = {
  founder:
    "Pełna kontrola: etapy, ustawienia teamu, role, usuwanie startupu.",
  admin:
    "Wypełnia etapy, zarządza członkami i zaproszeniami. Nie usuwa startupu.",
  member:
    "Czyta wszystko, co zespół wypełnił. Nie zmienia odpowiedzi w etapach.",
};

/** Kto może wypełniać i zmieniać dane etapów (Ambition, Idea, kolejne). */
export function canEditStageData(role: StartupRole) {
  return role === "founder" || role === "admin";
}

/** Kto może zapraszać, przyjmować zgłoszenia i zmieniać role. */
export function canManageTeam(role: StartupRole) {
  return role === "founder" || role === "admin";
}

/** Kto może zmieniać ustawienia i profil publiczny startupu. */
export function canEditStartupProfile(role: StartupRole) {
  return role === "founder" || role === "admin";
}

/** Tylko Founder: nadawanie roli Foundera i usunięcie startupu. */
export function canTransferOwnership(role: StartupRole) {
  return role === "founder";
}

export type Startup = {
  id: string;
  name: string;
  logo_url: string | null;
  idea_description: string | null;
  public_tagline: string | null;
  status: StartupStatus;
  is_discoverable: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type IndustryTag = {
  id: string;
  slug: string;
  label: string;
  is_suggested: boolean;
};

/** Startup widziany oczami zalogowanego usera — z jego rolą i etapem. */
export type StartupContext = {
  id: string;
  name: string;
  logoUrl: string | null;
  status: StartupStatus;
  role: StartupRole;
  categories: ValidationCategory[];
  /** null, gdy startup nie ma jeszcze przypisanego żadnego etapu */
  stage: {
    key: string;
    title: string;
    status: "in_progress" | "completed";
    done: number;
    total: number;
  } | null;
};

export function isStartupLimitError(message: string | null | undefined) {
  return Boolean(message?.includes("startup_limit_reached"));
}

export function isLastFounderError(message: string | null | undefined) {
  return Boolean(message?.includes("cannot_remove_last_founder"));
}
