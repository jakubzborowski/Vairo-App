import type { ReactNode } from "react";
import { IdeaCreatorMockup } from "@/components/mockups/idea-creator";
import { RoadmapMockup } from "@/components/mockups/roadmap";
import { TeamMockup } from "@/components/mockups/team";
import { OpportunitiesMockup } from "@/components/mockups/opportunities";
import { cn } from "@/lib/utils";

type Feature = {
  id: string;
  number: string;
  title: string;
  description: string;
  mockup: ReactNode;
  reverse?: boolean;
};

const features: Feature[] = [
  {
    id: "kierunek",
    number: "01",
    title: "Znajdź kierunek",
    description:
      "Nie masz pomysłu? Nasz kreator pomoże Ci odkryć problemy warte rozwiązania i sprawdzić ich potencjał rynkowy.",
    mockup: <IdeaCreatorMockup />,
  },
  {
    id: "plan",
    number: "02",
    title: "Ułóż plan działania",
    description:
      "Stwórz krok po kroku plan rozwoju swojego projektu. Zadania, terminy i postępy w jednym miejscu.",
    mockup: <RoadmapMockup />,
    reverse: true,
  },
  {
    id: "zespol",
    number: "03",
    title: "Zbuduj zespół",
    description:
      "Znajdź współzałożycieli i partnerów. Dopasujemy Cię do ludzi z odpowiednimi umiejętnościami i ambicjami.",
    mockup: <TeamMockup />,
  },
  {
    id: "mozliwosci",
    number: "04",
    title: "Znajdź możliwości",
    description:
      "Programy, inwestorzy, wydarzenia i partnerstwa. Wszystkie okazje, które pomogą Ci przyspieszyć rozwój.",
    mockup: <OpportunitiesMockup />,
    reverse: true,
  },
];

function FeatureBlock({ feature }: { feature: Feature }) {
  return (
    <div
      id={feature.id}
      className={cn(
        "grid items-center gap-8 rounded-2xl border border-white/6 bg-[#0a0b0f] p-6 sm:p-8 lg:grid-cols-2 lg:gap-12",
        feature.reverse && "lg:[&>*:first-child]:order-2"
      )}
    >
      <div>
        <div className="flex items-start gap-4">
          <span className="mt-1 inline-flex size-10 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-vairo font-heading text-[15px] font-bold text-vairo">
            {feature.number}
          </span>
          <div>
            <h3 className="font-heading text-xl font-bold tracking-tight text-white sm:text-2xl">
              {feature.title}
            </h3>
            <p className="mt-2.5 max-w-sm text-[14px] leading-relaxed text-muted-foreground">
              {feature.description}
            </p>
          </div>
        </div>
      </div>
      <div>{feature.mockup}</div>
    </div>
  );
}

export function FeaturesSection() {
  return (
    <section id="jak-to-dziala" className="pb-16 md:pb-24">
      <div className="mx-auto w-full max-w-[1200px] px-5 md:px-8">
        <div id="dla-kogo" className="max-w-2xl">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Wszystko, czego potrzebujesz, żeby ruszyć
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
            Jedna platforma. Cztery kluczowe obszary.
            <br className="hidden sm:block" />
            Od pomysłu do działającego startupu.
          </p>
        </div>

        <div id="o-nas" className="mt-10 space-y-5 md:mt-12">
          {features.map((feature) => (
            <FeatureBlock key={feature.number} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
