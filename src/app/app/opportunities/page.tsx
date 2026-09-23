import { ComingSoon } from "@/components/app/coming-soon";

export const metadata = { title: "Możliwości — Vairo" };

export default function Page() {
  return (
    <ComingSoon
      title="Możliwości"
      description="Programy akceleracyjne, konkursy i nabory dobierane do etapu, na którym jest Twój startup."
      step={10}
    />
  );
}
