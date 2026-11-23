/**
 * Jeden tłumacz błędów bazy na język użytkownika (polski, niemiecki,
 * ukraiński, hiszpański — słownik `errors`, klucze `db.*`).
 *
 * Postgres i PostgREST mówią po angielsku, kodami i nazwami ograniczeń.
 * Człowiek, który pierwszy raz widzi tę aplikację, ma z tego zrozumieć, co
 * zrobić dalej — więc każdy komunikat mówi **co się stało i co z tym zrobić**,
 * a nie jak nazywa się naruszony constraint.
 *
 * Dwie rzeczy, które ten plik miał źle i warto zapisać dlaczego:
 *
 * **Polskie znaki.** Komunikaty były pisane bez ogonków („uprawnien", „Jesli
 * to blad", „Odswiez"), bo powstały w pliku SQL, gdzie tak jest bezpieczniej.
 * Ale to jest tekst pokazywany użytkownikowi w aplikacji, w której cała reszta
 * ma poprawną polszczyznę — i akurat pojawia się w najgorszym momencie, czyli
 * gdy coś poszło nie tak. Wygląda wtedy jak druga, gorsza aplikacja pod spodem.
 *
 * **Surowy komunikat na końcu.** Funkcja kończyła się `return message`, czyli
 * przy nieznanym błędzie wypluwała do interfejsu tekst Postgresa. CLAUDE.md
 * mówi wprost: „żaden komunikat błędu nie wychodzi surowy". Teraz nieznany
 * błąd dostaje zdanie po ludzku, a oryginał ląduje w logu serwera — tam, gdzie
 * jest komuś potrzebny.
 *
 * Trzy wejścia, jedno źródło dopasowań (`dbErrorKey`):
 *   • `await translateDbError(message)` — serwer (akcje, route handlery), async,
 *     bo język bierze z ciasteczka żądania;
 *   • `useDbError()` — komponenty klienckie;
 *   • `dbErrorText(t, message)` — gdy `t` ze słownika `errors` już jest pod ręką.
 */
import type { MessageKey } from "@/i18n/messages";
import type { Translate } from "@/i18n/translator";

type DbErrorKey = Extract<MessageKey<"errors">, `db.${string}`>;

const RULES: [test: (message: string) => boolean, key: DbErrorKey][] = [
  [(m) => m.includes("row-level security"), "db.rls"],
  [(m) => m.includes("support_rate_limited"), "db.supportRateLimited"],
  [(m) => m.includes("support_no_email"), "db.supportNoEmail"],
  [(m) => m.includes("support_message_length"), "db.supportMessageLength"],
  [
    (m) =>
      m.includes("submit_support_request") &&
      (m.includes("does not exist") || m.includes("Could not find")),
    "db.supportMissingMigration",
  ],
  [(m) => m.includes("invite_not_allowed"), "db.inviteNotAllowed"],
  [(m) => m.includes("invite_invalid"), "db.inviteInvalid"],
  [
    (m) =>
      m.includes("startup_invite_links") ||
      m.includes("create_invite_link") ||
      m.includes("accept_invite_link") ||
      m.includes("revoke_invite_links"),
    "db.inviteMissingMigration",
  ],
  [(m) => m.includes("startup_limit_reached"), "db.startupLimit"],
  [(m) => m.includes("cannot_remove_last_founder"), "db.lastFounder"],
  [(m) => m.includes("general_category_required"), "db.generalCategoryRequired"],
  [(m) => m.includes("duplicate key"), "db.duplicate"],
  [(m) => m.includes("violates check constraint"), "db.checkConstraint"],
  [(m) => m.includes("violates foreign key"), "db.foreignKey"],
  [(m) => m.includes("does not exist") || m.includes("schema cache"), "db.missingMigration"],
  [(m) => m.includes("JWT") || m.includes("not_authenticated"), "db.sessionExpired"],
  [(m) => m.includes("goal_proof_required"), "db.goalProofRequired"],
  [(m) => m.includes("goal_locked_reopen_first"), "db.goalLocked"],
  [(m) => m.includes("goal_type_mismatch"), "db.goalTypeMismatch"],
  [(m) => m.includes("goal_startup_mismatch"), "db.goalStartupMismatch"],
  [(m) => m.includes("goal_owner_not_in_team"), "db.goalOwnerNotInTeam"],
  [(m) => m.includes("goal_blocker_needs_note"), "db.goalBlockerNote"],
  [(m) => m.includes("goal_proof_file_foreign"), "db.goalProofFileForeign"],
  [(m) => m.includes("goal_proof_workflow_missing"), "db.goalProofWorkflowMissing"],
  [(m) => m.includes("goal_archived"), "db.goalArchived"],
  [
    (m) => /score_[a-z_]+/.test(m) && /does not exist|could not find/i.test(m),
    "db.scoreMissingMigration",
  ],
];

/**
 * Klucz komunikatu dla surowego błędu bazy. Kolejność reguł ma znaczenie:
 * „does not exist” przy funkcji zgłoszeń ma własne zdanie, zanim złapie je
 * ogólna reguła o brakującej migracji.
 */
export function dbErrorKey(message: string): DbErrorKey {
  for (const [test, key] of RULES) if (test(message)) return key;
  // Nieznany błąd: user dostaje zdanie, z którym da się coś zrobić, a pełna
  // treść trafia do logu — nie na ekran.
  console.error("[db]", message);
  return "db.unknown";
}

export function dbErrorText(
  t: Translate<MessageKey<"errors">>,
  message: string | null | undefined
) {
  if (!message) return null;
  return t(dbErrorKey(message));
}

