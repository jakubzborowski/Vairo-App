import posthog from "posthog-js";

/**
 * PostHog startuje raz, zanim wczyta się strona (mechanizm Next.js).
 * Bez NEXT_PUBLIC_POSTHOG_KEY nic się nie dzieje.
 *
 * Ustawienia celowo zachowawcze, bo ludzie wpisują tu pomysły na biznes:
 *  - brak nagrywania sesji, autocapture i heatmap (przechwytują treść ekranu
 *    i ruchy myszy); te ustawienia z kodu wygrywają z przełącznikami w PostHogu,
 *  - profile tylko dla zalogowanych (`identified_only`),
 *  - `persistence: "memory"` — bez ciasteczek i localStorage, więc bez banera.
 *    Kosztem: pełne przeładowanie strony zaczyna nową sesję. Gdy pojawi się
 *    baner zgody, tu zmieniamy na "localStorage+cookie" po akceptacji.
 */
const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

if (key) {
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";
  posthog.init(key, {
    api_host: "/ingest",
    ui_host: host.replace(".i.posthog.com", ".posthog.com"),
    defaults: "2025-05-24",
    person_profiles: "identified_only",
    capture_pageview: "history_change",
    autocapture: false,
    capture_heatmaps: false,
    disable_session_recording: true,
    persistence: "memory",
  });
}
