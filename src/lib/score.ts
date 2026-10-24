/** Display rules; trusted awards and quotas live in migration 022. */
export const SCORE_RULES = [
  {
    id: "task-small",
    label: "Małe zadanie",
    points: 5,
    track: "work",
    detail:
      "Po ukończeniu celu z proof. Do 30 pkt za wszystkie zadania jednego celu.",
  },
  {
    id: "task-large",
    label: "Większe zadanie",
    points: 15,
    track: "work",
    detail:
      "Zakres ustalony przed rozpoczęciem. Łącznie do 30 pkt z zadań jednego celu.",
  },
  {
    id: "goal-small",
    label: "Cel z dowodem · standardowy",
    points: 40,
    track: "work",
    detail: "Ukończony cel z poprawnym proof. Jednorazowo za dany cel.",
  },
  {
    id: "goal-large",
    label: "Cel z dowodem · wymagający",
    points: 80,
    track: "work",
    detail: "Skalę ustala Founder/Admin przed rozpoczęciem pracy.",
  },
  {
    id: "document",
    label: "Dokument wykorzystany w pracy",
    points: 10,
    track: "work",
    detail:
      "Niepusty plik z biblioteki po raz pierwszy użyty jako proof ukończonego celu. Do 30 pkt dziennie.",
  },
  {
    id: "point",
    label: "Punkt programu",
    points: 25,
    track: "work",
    detail:
      "Wszystkie wymagane podpunkty spełnione. Pominięte podpunkty nie punktują. Jednorazowo.",
  },
  {
    id: "stage",
    label: "Etap programu",
    points: 150,
    track: "work",
    detail:
      "Zamknięcie etapu po zdobyciu bonusów wszystkich aktywnych punktów. Jednorazowo.",
  },
  {
    id: "feedback",
    label: "Przydatny feedback",
    points: 5,
    track: "reputation",
    detail:
      "Odbiorca potwierdził wartość. Raz na materiał, do 15 pkt dziennie.",
  },
  {
    id: "help",
    label: "Potwierdzona pomoc",
    points: 10,
    track: "reputation",
    detail:
      "Pomoc z rezultatem potwierdzonym przez odbiorcę. Do 20 pkt dziennie.",
  },
] as const;

export const SCORE_RANKS = [
  { name: "Odkrywca", threshold: 0 },
  { name: "Inicjator", threshold: 100 },
  { name: "Budowniczy", threshold: 300 },
  { name: "Realizator", threshold: 700 },
  { name: "Lider", threshold: 1500 },
  { name: "Twórca wpływu", threshold: 3000 },
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
