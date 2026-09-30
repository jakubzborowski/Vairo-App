import { ComingSoon } from "@/components/app/coming-soon";

export const metadata = { title: "Dokumenty — Vairo" };

export default function Page() {
  return (
    <ComingSoon
      title="Dokumenty"
      description="Miejsce na notatki i ustalenia zespołu: nagłówki, listy, linki i pliki. Gotowy dokument można dołączyć jako odpowiedź w etapie."
      unlocksAt="razem z trackerem w Execution Stage"
    />
  );
}
