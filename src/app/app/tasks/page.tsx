import { ComingSoon } from "@/components/app/coming-soon";

export const metadata = { title: "Taski — Vairo" };

export default function Page() {
  return (
    <ComingSoon
      title="Taski"
      description="Drobna praca do wykonania: kto ma to zrobić, do kiedy i co jest pilne. Zadania trafiają potem na listę „Co teraz” na dashboardzie."
      unlocksAt="razem z trackerem w Execution Stage"
    />
  );
}
