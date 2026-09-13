import Image from "next/image";
import { Play, Send } from "lucide-react";
import { HeroDashboardMockup } from "@/components/mockups/hero-dashboard";

export function HeroSection() {
  return (
    <section id="home" className="relative overflow-hidden pb-20 pt-8 md:pb-28 md:pt-12">
      {/* Contour wave art on the right edge, like the mockup */}
      <div className="pointer-events-none absolute -right-24 top-0 hidden h-[560px] w-[560px] opacity-75 md:block">
        <Image
          src="/brand/wave-contour.png"
          alt=""
          fill
          sizes="560px"
          className="object-contain object-right-top [filter:hue-rotate(-18deg)_saturate(1.35)]"
          priority
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_78%_30%,rgba(238,95,28,0.13),rgba(238,95,28,0)_55%)]" />

      <div className="relative mx-auto grid w-full max-w-[1200px] items-center gap-14 px-5 md:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-6">
        <div className="fade-up max-w-lg">
          <h1 className="font-heading text-[2.6rem] font-bold leading-[1.08] tracking-tight text-white sm:text-5xl md:text-[3.5rem]">
            Zbuduj swój
            <br />
            <span className="text-vairo">startup</span>
            <br />
            od podstaw
          </h1>
          <p className="mt-5 font-heading text-lg font-semibold text-white sm:text-xl">
            Zacznij nawet bez pomysłu.
          </p>
          <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
            Vairo pomoże Ci znaleźć kierunek, ludzi i plan działania, by
            dołączyć do startupu albo zbudować własny.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-5">
            <a
              href="/start"
              className="btn-vairo inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold text-white transition"
            >
              Dołącz do alfy
              <span aria-hidden className="text-[13px]">
                ›
              </span>
            </a>
            <a
              href="#jak-to-dziala"
              className="inline-flex items-center gap-2.5 text-[15px] font-medium text-white transition hover:text-white/80"
            >
              Zobacz, jak to działa
              <span className="inline-flex size-8 items-center justify-center rounded-full border border-white/30">
                <Play className="size-3 fill-white text-white" />
              </span>
            </a>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[600px] pb-16 pt-10 lg:max-w-none">
          {/* Orange glow behind the dashboard, like in the mockup */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 -z-0 h-[130%] w-[130%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(240,100,32,0.5)_0%,rgba(238,95,28,0.2)_45%,rgba(238,95,28,0)_72%)] blur-2xl" />
          <div className="pointer-events-none absolute -right-10 bottom-0 h-[60%] w-[70%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(249,130,60,0.7)_0%,rgba(238,95,28,0)_70%)] blur-3xl" />
          <div className="pointer-events-none absolute -left-8 top-0 h-[45%] w-[45%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(249,120,54,0.35)_0%,rgba(238,95,28,0)_70%)] blur-3xl" />

          {/* Whole floating group (dashboard + both tiles) moves together;
              float animation on the wrapper, 3D tilts on inner elements */}
          <div className="hero-float relative z-10">
            <div className="relative ml-auto w-[92%]">
              <div className="[transform:perspective(1600px)_rotateX(6deg)_rotateY(-9deg)_rotateZ(2.5deg)]">
                <HeroDashboardMockup />
              </div>
            </div>

            {/* Floating: Project health — steeper, own angle like in the mockup */}
            <div className="absolute -top-11 left-0 z-20 w-[150px] rounded-2xl border border-vairo/35 bg-[#131418]/95 p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.55),0_0_28px_rgba(238,95,28,0.35),inset_0_0_14px_rgba(238,95,28,0.08)] backdrop-blur [transform:perspective(1100px)_rotateX(6deg)_rotateY(-10deg)_rotateZ(-7deg)] sm:w-[165px]">
            <p className="text-[11px] font-medium text-white/70">Project health</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="relative size-14 shrink-0">
                <svg viewBox="0 0 36 36" className="size-14 -rotate-90">
                  <circle cx="18" cy="18" r="14.5" fill="none" stroke="#26272d" strokeWidth="4" />
                  <circle
                    cx="18"
                    cy="18"
                    r="14.5"
                    fill="none"
                    stroke="url(#healthGrad)"
                    strokeWidth="4"
                    strokeDasharray="65.6 91.1"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="healthGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop stopColor="#ee5f1c" />
                      <stop offset="0.6" stopColor="#f9a03f" />
                      <stop offset="1" stopColor="#4ade80" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <p className="text-lg font-bold text-white">72%</p>
            </div>
            <p className="mt-1.5 flex items-center gap-1.5 text-[10px] text-white/50">
              <span className="size-1.5 rounded-full bg-green-400" />
              On track
            </p>
            </div>

            {/* Floating: Next step */}
            <div className="absolute -bottom-12 right-0 z-20 w-[200px] rounded-2xl border border-vairo/35 bg-[#131418]/95 p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.55),0_0_28px_rgba(238,95,28,0.35),inset_0_0_14px_rgba(238,95,28,0.08)] backdrop-blur [transform:perspective(1200px)_rotateX(5deg)_rotateY(-8deg)_rotateZ(3deg)] sm:right-2 sm:w-[215px]">
              <p className="text-[10px] font-medium text-white/50">Next step</p>
              <div className="mt-1.5 flex items-center gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-vairo/18 text-vairo">
                  <Send className="size-3.5" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-white">
                    Validate your idea
                  </p>
                  <p className="text-[10px] text-white/45">
                    3 zadania do wykonania
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
