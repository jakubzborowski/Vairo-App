"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { SplashScreen } from "@/components/auth/splash-screen";
import { cn } from "@/lib/utils";

const SPLASH_KEY = "vairo-splash-seen";

type AuthShellProps = {
  children: React.ReactNode;
  showSplash?: boolean;
};

export function AuthShell({ children, showSplash = true }: AuthShellProps) {
  const [phase, setPhase] = useState<"boot" | "splash" | "ready">(
    showSplash ? "boot" : "ready"
  );

  useEffect(() => {
    if (!showSplash) return;
    try {
      if (sessionStorage.getItem(SPLASH_KEY) === "1") {
        setPhase("ready");
        return;
      }
    } catch {
      // sessionStorage may be unavailable
    }
    setPhase("splash");
  }, [showSplash]);

  const finishSplash = useCallback(() => {
    try {
      sessionStorage.setItem(SPLASH_KEY, "1");
    } catch {
      // ignore
    }
    setPhase("ready");
  }, []);

  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden bg-black">
      {phase === "splash" && <SplashScreen onComplete={finishSplash} />}

      <div
        className={cn(
          "relative flex min-h-full flex-1 flex-col transition-opacity duration-500",
          phase === "ready" ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="pointer-events-none absolute -left-[12%] -top-[18%] h-[52vmin] w-[52vmin] opacity-55">
          <Image
            src="/brand/wave-contour.png"
            alt=""
            fill
            sizes="52vmin"
            className="object-contain object-left-top [filter:hue-rotate(-12deg)_saturate(1.2)]"
            priority
          />
        </div>
        <div className="pointer-events-none absolute -bottom-[20%] -right-[14%] h-[62vmin] w-[62vmin] opacity-70">
          <Image
            src="/brand/wave-smooth.png"
            alt=""
            fill
            sizes="62vmin"
            className="object-contain object-right-bottom"
            priority
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(238,95,28,0.08),transparent_55%)]" />

        <header className="relative z-10 mx-auto flex w-full max-w-[440px] items-center px-5 pt-8 md:px-0 md:pt-10">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image
              src="/brand/logo-blob.png"
              alt=""
              width={28}
              height={28}
              className="size-7 object-contain"
            />
            <span className="font-heading text-[1.25rem] font-bold lowercase tracking-tight text-white">
              vairo
            </span>
          </Link>
        </header>

        <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-10 md:py-14">
          <div className="w-full max-w-[380px] fade-up">{children}</div>
        </main>
      </div>
    </div>
  );
}
