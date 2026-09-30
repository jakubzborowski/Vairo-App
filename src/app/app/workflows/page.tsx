import { ComingSoon } from "@/components/app/coming-soon";

export const metadata = { title: "Workflow — Vairo" };

export default function Page() {
  return (
    <ComingSoon
      title="Workflow"
      description="Rozpiska procesu: bloczki, strzałki i osoba odpowiedzialna za każdy krok. Służy do ułożenia pracy, nie do jej automatycznego uruchamiania."
      unlocksAt="razem z trackerem w Execution Stage"
    />
  );
}
