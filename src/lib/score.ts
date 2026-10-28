/** Display rules; verification/queue: 023, mentors/condition quotas: 024, cron: 025. */
export const SCORE_RULES = [
  {
    id: "task-small",
    label: "Zadanie · standardowe",
    points: 5,
    track: "work",
    detail:
      "Po niezależnej akceptacji celu powiązanego z programem. Wspólna pula zadań celu: do 30 pkt.",
  },
  {
    id: "task-large",
    label: "Zadanie · wymagające",
    points: 15,
    track: "work",
    detail:
      "Skala zatwierdzona przez inną osobę przed rozpoczęciem. Wspólna pula zadań celu: do 30 pkt.",
  },
  {
    id: "goal-small",
    label: "Cel z dowodem · standardowy",
    points: 40,
    track: "work",
    detail:
      "Cel powiązany z programem, z treściwym proof i akceptacją innego Foundera/Admina lub przypisanego mentora. Do min_count celów na warunek.",
  },
  {
    id: "goal-large",
    label: "Cel z dowodem · wymagający",
    points: 80,
    track: "work",
    detail:
      "Skalę ustala inny Founder/Admin lub mentor przed rozpoczęciem; wynik wymaga niezależnej akceptacji i wolnego miejsca w limicie warunku.",
  },
  {
    id: "document",
    label: "Dokument wykorzystany w pracy",
    points: 10,
    track: "work",
    detail:
      "Niepusty plik wykorzystany w zaakceptowanym celu. Sam upload nie punktuje. Do 30 pkt dziennie; nadwyżka w kolejce.",
  },
  {
    id: "point",
    label: "Punkt programu",
    points: 25,
    track: "work",
    detail:
      "Pula 25 pkt dzielona między team. Rzeczywisty postęp i niezależna akceptacja każdej części. Osobisty bonus raz we wszystkich teamach.",
  },
  {
    id: "stage",
    label: "Etap programu",
    points: 150,
    track: "work",
    detail:
      "Pula 150 pkt dzielona między team za faktycznie ukończony etap, także gdy praca zaczęła się przed wdrożeniem SCORE. Niezależna akceptacja.",
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
