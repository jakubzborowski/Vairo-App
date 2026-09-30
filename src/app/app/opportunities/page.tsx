import { ComingSoon } from "@/components/app/coming-soon";

export const metadata = { title: "Możliwości — Vairo" };

export default function Page() {
  return (
    <ComingSoon
      title="Możliwości"
      description="Programy, konkursy i nabory dobrane do tego, na jakim etapie jest Twój startup."
      unlocksAt="po domknięciu MVP Stage"
    />
  );
}
