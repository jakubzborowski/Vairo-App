import { ComingSoon } from "@/components/app/coming-soon";

export const metadata = { title: "Cele — Vairo" };

export default function Page() {
  return (
    <ComingSoon
      title="Cele"
      description="Cele definiowane przez Ciebie. Osobne od Validation Milestones i nieblokujące przejścia do kolejnego etapu."
      step={10}
    />
  );
}
