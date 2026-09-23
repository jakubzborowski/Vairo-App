import { ComingSoon } from "@/components/app/coming-soon";

export const metadata = { title: "Dokumenty — Vairo" };

export default function Page() {
  return (
    <ComingSoon
      title="Dokumenty"
      description="Prosty edytor: nagłówki, listy, checklisty, linki i załączniki. Dokument można podpiąć jako dowód do Subpointu."
      step={10}
    />
  );
}
