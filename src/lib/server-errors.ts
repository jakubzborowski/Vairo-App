import { getT } from "@/i18n/server";

/**
 * Najczęstsze komunikaty akcji serwerowych w języku użytkownika.
 * Jedna funkcja zamiast tego samego zdania w czterdziestu miejscach.
 */
export async function sessionExpired() {
  return (await getT("errors"))("sessionExpired");
}

/** „Brakuje migracji 035 — odpal ją w Supabase → SQL Editor.” */
export async function missingMigration(number: string) {
  return (await getT("errors"))("missingMigration", { number });
}

export async function notAMember() {
  return (await getT("errors"))("notMember");
}
