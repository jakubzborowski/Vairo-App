import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";

export const metadata = { title: "Nie ma tu tej strony — Vairo" };

/** Nieznany adres poza /app — bez tego Next.js pokazywał stronę po angielsku. */
export default function NotFound() {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center bg-black px-5 py-16 text-center">
      <BrandLogo height={28} />
      <h1 className="mt-8 font-heading text-[1.5rem] font-semibold text-white">
        Nie ma tu tej strony
      </h1>
      <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-[var(--text-muted)]">
        Adres jest nieaktualny albo zawiera literówkę.
      </p>
      <div className="mt-6">
        <Button href="/app">Przejdź do Vairo</Button>
      </div>
    </main>
  );
}
