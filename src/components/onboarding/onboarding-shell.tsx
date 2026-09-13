import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type OnboardingShellProps = {
  children: React.ReactNode;
  wide?: boolean;
};

export function OnboardingShell({ children, wide = false }: OnboardingShellProps) {
  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden bg-black">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[48vmin] w-[72vmin] -translate-x-1/2 opacity-60">
        <Image
          src="/brand/wave-contour.png"
          alt=""
          fill
          sizes="72vmin"
          className="object-contain object-top [filter:hue-rotate(-12deg)_saturate(1.2)]"
          priority
        />
      </div>
      <div className="pointer-events-none absolute -bottom-[18%] -right-[12%] h-[58vmin] w-[58vmin] opacity-70">
        <Image
          src="/brand/wave-smooth.png"
          alt=""
          fill
          sizes="58vmin"
          className="object-contain object-right-bottom"
          priority
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(238,95,28,0.07),transparent_55%)]" />

      <header className="relative z-10 flex items-center justify-between px-6 pt-8 md:px-10 md:pt-10">
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
        <Link
          href="/start"
          className="text-[13px] font-medium text-white/45 transition hover:text-white/80"
        >
          Wyloguj
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-10 md:py-14">
        <div
          className={cn(
            "w-full fade-up",
            wide ? "max-w-[720px]" : "max-w-[560px]"
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
