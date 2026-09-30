import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type OnboardingShellProps = {
  children: React.ReactNode;
  wide?: boolean;
  /** Numer bieżącego kroku, licząc od 1. */
  step?: number;
  totalSteps?: number;
  backHref?: string;
};

export function OnboardingShell({
  children,
  wide = false,
  step,
  totalSteps,
  backHref,
}: OnboardingShellProps) {
  const showProgress = Boolean(step && totalSteps && totalSteps > 1);

  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden bg-black">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[48vmin] w-[72vmin] -translate-x-1/2 opacity-40">
        <Image
          src="/brand/wave-contour.png"
          alt=""
          fill
          sizes="72vmin"
          className="object-contain object-top [filter:hue-rotate(-12deg)_saturate(1.2)]"
          priority
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(238,95,28,0.06),transparent_55%)]" />

      <header className="relative z-10 flex items-center justify-between gap-4 px-6 pt-8 md:px-10">
        <div className="flex items-center gap-4">
          {backHref ? (
            <Link
              href={backHref}
              className="inline-flex size-9 items-center justify-center rounded-lg border border-white/10 text-[var(--text-subtle)] transition-colors hover:border-white/20 hover:text-white"
              aria-label="Wróć do poprzedniego kroku"
            >
              <ArrowLeft className="size-4" />
            </Link>
          ) : null}
          <Link href="/" className="inline-flex items-center gap-2">
            <Image
              src="/brand/logo-mark.png"
              alt=""
              width={28}
              height={28}
              className="size-7 object-contain"
            />
            <span className="font-heading text-[1.25rem] font-bold lowercase tracking-tight text-white">
              vairo
            </span>
          </Link>
        </div>

        {showProgress ? (
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5" aria-hidden="true">
              {Array.from({ length: totalSteps! }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1 rounded-full transition-all",
                    i < step! ? "w-6 bg-[var(--vairo)]" : "w-4 bg-white/15"
                  )}
                />
              ))}
            </div>
            <span className="tabular text-[12px] text-[var(--text-subtle)]">
              {step} z {totalSteps}
            </span>
          </div>
        ) : (
          <Link
            href="/start"
            className="text-[13px] font-medium text-[var(--text-subtle)] transition-colors hover:text-white"
          >
            Wyloguj
          </Link>
        )}
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-10 md:py-14">
        <div
          className={cn("app-enter w-full", wide ? "max-w-[860px]" : "max-w-[560px]")}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
