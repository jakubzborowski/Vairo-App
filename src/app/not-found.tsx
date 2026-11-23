import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import { getT } from "@/i18n/server";

export async function generateMetadata() {
  const t = await getT("common");
  return { title: t("notFound.metaTitle") };
}

/** Nieznany adres poza /app — bez tego Next.js pokazywał własną, angielską. */
export default async function NotFound() {
  const t = await getT("common");
  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center bg-black px-5 py-16 text-center">
      <BrandLogo height={28} />
      <h1 className="mt-8 font-heading text-[1.5rem] font-semibold text-white">
        {t("notFound.title")}
      </h1>
      <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-[var(--text-muted)]">
        {t("notFound.body")}
      </p>
      <div className="mt-6">
        <Button href="/app">{t("notFound.cta")}</Button>
      </div>
    </main>
  );
}
