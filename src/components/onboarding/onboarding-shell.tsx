import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand-logo";
import { OnboardingHelp } from "@/components/support/onboarding-help";
import { getT } from "@/i18n/server";

type OnboardingShellProps = {
  children: React.ReactNode;
  wide?: boolean;
  /** Numer bieżącego kroku, licząc od 1. */
  step?: number;
  totalSteps?: number;
  backHref?: string;
};

export async function OnboardingShell({
  children,
  wide = false,
  step,
  totalSteps,
  backHref,
}: OnboardingShellProps) {
  const t = await getT("onboarding");
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
              aria-label={t("shell.back")}
            >
              <ArrowLeft className="size-4" />
            </Link>
          ) : null}
          <Link href="/" className="inline-flex items-center">
            <BrandLogo height={28} />
          </Link>
        </div>

        <div className="flex items-center gap-3">
        <OnboardingHelp />
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
              {t("shell.progress", { step: step ?? 0, total: totalSteps ?? 0 })}
            </span>
          </div>
        ) : (
          <Link
            href="/start"
            prefetch={false}
            className="text-[13px] font-medium text-[var(--text-subtle)] transition-colors hover:text-white"
          >
            {t("shell.signOut")}
          </Link>
        )}
        </div>
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
