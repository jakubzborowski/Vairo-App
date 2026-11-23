/**
 * Display rules; verification/queue: 023, mentors/condition quotas: 024, cron: 025.
 * Nazwy i opisy: słownik `score`, `rule.<id>.label|detail`; rangi: `rank.<id>`.
 */
export const SCORE_RULES = [
  {
    id: "task-small",
    points: 5,
    track: "work",
  },
  {
    id: "task-large",
    points: 15,
    track: "work",
  },
  {
    id: "goal-small",
    points: 40,
    track: "work",
  },
  {
    id: "goal-large",
    points: 80,
    track: "work",
  },
  {
    id: "document",
    points: 10,
    track: "work",
  },
  {
    id: "point",
    points: 25,
    track: "work",
  },
  {
    id: "stage",
    points: 150,
    track: "work",
  },
  {
    id: "feedback",
    points: 5,
    track: "reputation",
  },
  {
    id: "help",
    points: 10,
    track: "reputation",
  },
] as const;

export const SCORE_RANKS = [
  { id: "explorer", threshold: 0 },
  { id: "initiator", threshold: 100 },
  { id: "builder", threshold: 300 },
  { id: "achiever", threshold: 700 },
  { id: "leader", threshold: 1500 },
  { id: "impact", threshold: 3000 },
] as const;

export function rankProgress(score: number) {
  const current =
    [...SCORE_RANKS].reverse().find((rank) => score >= rank.threshold) ??
    SCORE_RANKS[0];
  const next = SCORE_RANKS.find((rank) => rank.threshold > score);
  return {
    current,
    next,
    percent: next
      ? Math.min(
          100,
          Math.max(
            0,
            ((score - current.threshold) /
              (next.threshold - current.threshold)) *
              100,
          ),
        )
      : 100,
  };
}
