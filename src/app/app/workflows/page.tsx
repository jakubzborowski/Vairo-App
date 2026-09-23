import { ComingSoon } from "@/components/app/coming-soon";

export const metadata = { title: "Workflow — Vairo" };

export default function Page() {
  return (
    <ComingSoon
      title="Workflow"
      description="Kroki z właścicielem, deadlinem i warunkiem przejścia dalej. Po ukończeniu kroku system tworzy kolejne zadanie."
      step={10}
    />
  );
}
