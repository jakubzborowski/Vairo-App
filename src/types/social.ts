/**
 * Warstwa Social: profil osoby, profil teamu i rozmowa między nimi.
 *
 * Kształt tych typów odpowiada widokom `public_profiles` i `public_startups`
 * z migracji 009 — to jedyne miejsce, przez które dane wychodzą do obcych.
 */

import type { ValidationCategory } from "./startup";

export const LOOKING_FOR = [
  "team",
  "cofounder",
  "collaborators",
  "not_looking",
] as const;

export type LookingFor = (typeof LOOKING_FOR)[number];

export const LOOKING_FOR_LABELS: Record<LookingFor, string> = {
  team: "Szukam teamu",
  cofounder: "Szukam współzałożyciela",
  collaborators: "Szukam ludzi do swojego projektu",
  not_looking: "Na razie nie szukam",
};

export const LOOKING_FOR_OPTIONS: {
  value: LookingFor;
  label: string;
  description: string;
}[] = [
  {
    value: "team",
    label: "Szukam teamu",
    description: "Chcę dołączyć do istniejącego startupu.",
  },
  {
    value: "cofounder",
    label: "Szukam współzałożyciela",
    description: "Mam pomysł i szukam kogoś na równych prawach.",
  },
  {
    value: "collaborators",
    label: "Szukam ludzi do projektu",
    description: "Mam już startup i rekrutuję do zespołu.",
  },
  {
    value: "not_looking",
    label: "Na razie nie szukam",
    description: "Zostaję widoczny, ale nikt nie zaproponuje mi dołączenia.",
  },
];

/**
 * Podpowiedzi stanowisk. Celowo lista otwarta — „Head of Growth" ma prawo
 * istnieć, a zamknięty słownik zmusiłby połowę ludzi do wybrania „Inne".
 */
export const JOB_TITLE_SUGGESTIONS = [
  "CEO",
  "CTO",
  "COO",
  "CPO",
  "CMO",
  "CFO",
  "Founder",
  "Co-founder",
  "Developer",
  "Designer",
  "Product Manager",
  "Marketing",
  "Sales",
  "Doradca",
];

export type PublicSkill = { id: string; label: string };

export type PublicProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  weekly_focus: string | null;
  weekly_focus_updated_at: string | null;
  location: string | null;
  looking_for: LookingFor | null;
  weekly_hours: number | null;
  onboarding_path: string | null;
  created_at: string;
  team_count: number;
  skills: PublicSkill[];
};

export type PublicOpenRole = {
  id: string;
  title: string;
  description: string | null;
  weekly_hours: number | null;
  skills: string[];
};

export type PublicStartupMember = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  job_title: string | null;
};

export type PublicStartup = {
  id: string;
  name: string;
  logo_url: string | null;
  public_tagline: string | null;
  public_description: string | null;
  location: string | null;
  website_url: string | null;
  created_at: string;
  member_count: number;
  stage_label: string | null;
  categories: ValidationCategory[];
  tags: { id: string; label: string }[];
  open_roles: PublicOpenRole[];
  members: PublicStartupMember[];
};

export type JoinDirection = "application" | "invite";
export type JoinStatus = "pending" | "accepted" | "declined" | "withdrawn";

export const JOIN_STATUS_LABELS: Record<JoinStatus, string> = {
  pending: "Czeka na odpowiedź",
  accepted: "Zaakceptowana",
  declined: "Odrzucona",
  withdrawn: "Wycofana",
};

export type JoinRequest = {
  id: string;
  startupId: string;
  startupName: string;
  startupLogoUrl: string | null;
  profileId: string;
  profileName: string | null;
  profileAvatarUrl: string | null;
  profileHeadline: string | null;
  direction: JoinDirection;
  status: JoinStatus;
  message: string | null;
  jobTitle: string | null;
  proposedRole: "admin" | "member";
  openRoleTitle: string | null;
  createdAt: string;
  createdBy: string;
  /** Czy zalogowany user jest stroną, która ma teraz odpowiedzieć. */
  canRespond: boolean;
  /** Czy zalogowany user może wycofać tę prośbę. */
  canWithdraw: boolean;
};

/** Komunikaty błędów z triggerów bazy — tłumaczone na ludzki język. */
export function translateJoinError(
  message: string | null | undefined,
  /**
   * Kogo dotyczy limit, gdy ten zadziała. Przy przyjmowaniu ZGŁOSZENIA limit
   * należy do kandydata, przy przyjmowaniu ZAPROSZENIA — do nas. Bez tego
   * Founder widział „Limit 3 teamów na konto został osiągnięty" i mógł
   * zrozumieć, że to jego konto jest pełne, choć chodziło o kandydata.
   */
  limitSubject: "me" | "them" = "me"
) {
  if (!message) return null;
  if (message.includes("already_member")) {
    return "Ta osoba jest już w tym teamie.";
  }
  if (message.includes("startup_limit_reached")) {
    return limitSubject === "them"
      ? "Ta osoba należy już do 3 teamów — to maksimum na konto i nie da się jej dodać."
      : "Należysz już do 3 teamów — to maksimum na konto.";
  }
  if (message.includes("join_requests_one_pending")) {
    return "Rozmowa z tą osobą już trwa — sprawdź Zaproszenia.";
  }
  if (message.includes("request_not_pending")) {
    return "Ta prośba została już rozpatrzona.";
  }
  if (message.includes("not_allowed")) {
    return "Nie masz uprawnień do tej operacji.";
  }
  return message;
}

// ---------------------------------------------------------------------------
// Kontakt i rozmowa
// ---------------------------------------------------------------------------

export type ContactStatus = "pending" | "accepted" | "declined" | "withdrawn";

export const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  pending: "Czeka na odpowiedź",
  accepted: "Kontakt nawiązany",
  declined: "Odrzucony",
  withdrawn: "Wycofany",
};

export type ContactSignal = {
  id: string;
  senderId: string;
  recipientId: string;
  status: ContactStatus;
  message: string | null;
  createdAt: string;
  /** null = kontakt prywatny, jako osoba. */
  contextStartupId: string | null;
  contextStartupName: string | null;
  contextStartupLogoUrl: string | null;
  contextStartupTagline: string | null;
  /** Dane drugiej strony — tej, której user nie zna. */
  otherId: string;
  otherName: string | null;
  otherAvatarUrl: string | null;
  otherHeadline: string | null;
  /** Czy user jest adresatem i ma teraz odpowiedzieć. */
  canRespond: boolean;
  canWithdraw: boolean;
};

export type ConversationSummary = {
  id: string;
  otherId: string;
  otherName: string | null;
  otherAvatarUrl: string | null;
  contextStartupName: string | null;
  lastBody: string | null;
  lastFromMe: boolean;
  lastMessageAt: string;
  unreadCount: number;
};

export type ChatMessage = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
};

export function translateContactError(message: string | null | undefined) {
  if (!message) return null;
  if (message.includes("contact_signals_one_pending")) {
    return "Zaczepka do tej osoby już czeka na odpowiedź.";
  }
  if (message.includes("not_a_member_of_context")) {
    return "Możesz pisać w imieniu teamu, do którego należysz.";
  }
  if (message.includes("signal_not_pending")) {
    return "Ta zaczepka została już rozpatrzona.";
  }
  if (message.includes("contact_signal_not_self")) {
    return "Nie napiszesz sam do siebie.";
  }
  if (message.includes("not_allowed")) {
    return "Nie masz uprawnień do tej operacji.";
  }
  if (
    message.includes("contact_signals") ||
    message.includes("respond_contact_signal") ||
    message.includes("conversation")
  ) {
    return "Brakuje migracji 012 — odpal ją w Supabase → SQL Editor.";
  }
  return message;
}
