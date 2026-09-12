"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type SplashScreenProps = {
  onComplete: () => void;
  durationMs?: number;
};

export function SplashScreen({
  onComplete,
  durationMs = 2400,
}: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      // Ease-out curve so the bar feels intentional
      const eased = 1 - Math.pow(1 - t, 2.4);
      setProgress(Math.round(eased * 100));

      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setLeaving(true);
        window.setTimeout(onComplete, 380);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [durationMs, onComplete]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black transition-opacity duration-300",
        leaving ? "opacity-0" : "opacity-100"
      )}
      role="status"
      aria-live="polite"
      aria-label="Ładowanie Vairo"
    >
      <div className="pointer-events-none absolute -left-[18%] -top-[22%] h-[70vmin] w-[70vmin] opacity-90 splash-mesh">
        <Image
          src="/brand/wave-contour.png"
          alt=""
          fill
          sizes="70vmin"
          priority
          className="object-contain object-left-top [filter:hue-rotate(-12deg)_saturate(1.25)]"
        />
      </div>
      <div className="pointer-events-none absolute -bottom-[18%] -right-[12%] h-[78vmin] w-[78vmin] opacity-95 splash-wave">
        <Image
          src="/brand/wave-smooth.png"
          alt=""
          fill
          sizes="78vmin"
          priority
          className="object-contain object-right-bottom"
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.55)_70%,rgba(0,0,0,0.85)_100%)]" />

      <div className="relative z-10 flex w-full max-w-[280px] flex-col items-center px-6 splash-center">
        <div className="flex items-center gap-3">
          <Image
            src="/brand/logo-blob.png"
            alt=""
            width={52}
            height={52}
            priority
            className="size-[52px] object-contain"
          />
          <span className="font-heading text-[2.35rem] font-bold lowercase leading-none tracking-tight text-white">
            vairo
          </span>
        </div>

        <p className="mt-3 font-heading text-[15px] font-medium tracking-wide text-white/90">
          Build your startup
        </p>

        <div className="mt-10 w-full max-w-[200px]">
          <div className="h-[3px] overflow-hidden rounded-full bg-white/12">
            <div
              className="h-full rounded-full bg-gradient-to-r from-vairo-soft to-vairo transition-[width] duration-100 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-3 text-center text-[12px] tracking-wide text-white/40">
            Loading...
          </p>
        </div>
      </div>
    </div>
  );
}
