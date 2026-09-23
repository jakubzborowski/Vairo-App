import { ComingSoon } from "@/components/app/coming-soon";

export const metadata = { title: "Taski — Vairo" };

export default function Page() {
  return (
    <ComingSoon
      title="Taski"
      description="Zadania operacyjne z jednym właścicielem, deadlinem i priorytetem — obok Subpointów zasilają Next Actions."
      step={10}
    />
  );
}
