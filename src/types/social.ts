/**
 * Warstwa Social: profil osoby, profil teamu i rozmowa między nimi.
 *
 * Kształt tych typów odpowiada widokom `public_profiles` i `public_startups`
 * z migracji 009 — to jedyne miejsce, przez które dane wychodzą do obcych.
 */

import type { ValidationCategory } from "./startup";
import type { MessageKey } from "@/i18n/messages";
import type { Translate } from "@/i18n/translator";

export const LOOKING_FOR = [
  "team",
  "cofounder",
  "collaborators",
  "not_looking",
] as const;

export type LookingFor = (typeof LOOKING_FOR)[number];

// Nazwy i opisy: słownik `social`, klucze `lookingFor.<value>` (krótko, na
// kartach) oraz `lookingForOption.<value>.label|description` (w formularzach).
export const LOOKING_FOR_OPTIONS: { value: LookingFor }[] = LOOKING_FOR.map((value) => ({ value }));

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

// Nazwy statusów: słownik `social`, `joinStatus.<status>`.

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
  t: Translate<MessageKey<"social">>,
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
    return t("errors.alreadyMember");
  }
  if (message.includes("startup_limit_reached")) {
    return limitSubject === "them"
      ? t("errors.theirLimit")
      : t("errors.myLimit");
  }
  if (message.includes("join_requests_one_pending")) {
    return t("errors.requestPending");
  }
  if (message.includes("request_not_pending")) {
    return t("errors.requestHandled");
  }
  if (message.includes("not_allowed")) {
    return t("errors.notAllowed");
  }
  return message;
}

// ---------------------------------------------------------------------------
// Kontakt i rozmowa
// ---------------------------------------------------------------------------

export type ContactStatus = "pending" | "accepted" | "declined" | "withdrawn";

// Nazwy statusów: słownik `social`, `contactStatus.<status>`.

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

export function translateContactError(
  t: Translate<MessageKey<"social">>,
  message: string | null | undefined
) {
  if (!message) return null;
  if (message.includes("contact_signals_one_pending")) {
    return t("errors.contactPending");
  }
  if (message.includes("not_a_member_of_context")) {
    return t("errors.notInContextTeam");
  }
  if (message.includes("signal_not_pending")) {
    return t("errors.contactHandled");
  }
  if (message.includes("contact_signal_not_self")) {
    return t("errors.notSelf");
  }
  if (message.includes("not_allowed")) {
    return t("errors.notAllowed");
  }
  if (
    message.includes("contact_signals") ||
    message.includes("respond_contact_signal") ||
    message.includes("conversation")
  ) {
    return t("errors.migration012");
  }
  return message;
}
