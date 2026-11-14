import posthog from "posthog-js";

/**
 * Cienka warstwa nad PostHogiem. Reszta aplikacji woła tylko te funkcje, więc
 * bez klucza (lokalnie, podgląd) wszystko jest po cichu pustą operacją.
 *
 * Zasada: wysyłamy zdarzenia i id konta — NIGDY treści, które ktoś wpisał
 * (opis pomysłu, odpowiedzi w etapach, wiadomości) ani e-maila.
 */
let identifiedAs: string | null = null;

export function identifyUser(userId: string) {
  if (!posthog.__loaded || identifiedAs === userId) return;
  // Inna osoba na tej samej karcie (wylogowanie formularzem, zmiana konta) —
  // zaczynamy od czystej tożsamości, żeby nie sklejać dwóch kont w jedno.
  if (identifiedAs) posthog.reset();
  posthog.identify(userId);
  identifiedAs = userId;
}

/** Wylogowanie: kolejna osoba na tej przeglądarce nie dziedziczy tożsamości. */
export function resetAnalytics() {
  identifiedAs = null;
  if (posthog.__loaded) posthog.reset();
}

/** Własne zdarzenie, np. `trackEvent("stage_closed", { stage: "idea" })`. */
export function trackEvent(name: string, properties?: Record<string, string | number | boolean>) {
  if (posthog.__loaded) posthog.capture(name, properties);
}
