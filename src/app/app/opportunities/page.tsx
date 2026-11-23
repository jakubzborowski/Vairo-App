import { ComingSoon } from "@/components/app/coming-soon";
import { getT } from "@/i18n/server";

export async function generateMetadata() {
  const t = await getT("common");
  return { title: t("opportunities.metaTitle") };
}

export default async function Page() {
  const t = await getT("common");
  return (
    <ComingSoon
      title={t("opportunities.title")}
      description={t("opportunities.description")}
    />
  );
}
