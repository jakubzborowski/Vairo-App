import { Users } from "lucide-react";

export function SiteFooter() {
  return (
    <footer id="dolacz" className="pb-12 pt-2 md:pb-16">
      <div className="mx-auto w-full max-w-[1200px] px-5 md:px-8">
        <div className="flex flex-col items-start gap-6 rounded-2xl border border-white/6 bg-[#0a0b0f] px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-start gap-4 sm:items-center">
            <div className="flex size-11 shrink-0 items-center justify-center text-vairo">
              <Users className="size-8" strokeWidth={1.5} />
            </div>
            <div className="max-w-xl">
              <p className="font-heading text-[15px] font-bold leading-snug text-white sm:text-base">
                Dołącz do społeczności ambitnych ludzi
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                Wspieraj się, współpracuj i twórz przyszłość razem z Vairo.
              </p>
            </div>
          </div>

          <a
            href="/login"
            className="btn-vairo inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full px-6 text-[14px] font-semibold text-white transition"
          >
            Dołącz do alfy
            <span aria-hidden className="text-[12px]">
              ›
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}
