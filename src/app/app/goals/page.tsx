import { ComingSoon } from "@/components/app/coming-soon";

export const metadata = { title: "Cele — Vairo" };

export default function Page() {
  return (
    <ComingSoon
      title="Cele"
      description="Cele, które wyznaczasz sobie sam — na przykład „pierwszy płacący klient”. To coś innego niż program Vairo: własny cel nie blokuje przejścia do kolejnego etapu."
      unlocksAt="razem z trackerem w Execution Stage"
    />
  );
}
