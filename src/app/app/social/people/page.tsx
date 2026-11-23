import {
  DiscoverScreen,
  type DiscoverParams,
} from "@/components/social/discover-screen";
import { getT } from "@/i18n/server";

export async function generateMetadata() {
  const t = await getT("social");
  return { title: t("people.metaTitle") };
}
export const dynamic = "force-dynamic";

export default async function DiscoverPeoplePage({
  searchParams,
}: {
  searchParams: Promise<DiscoverParams>;
}) {
  return <DiscoverScreen tab="people" params={await searchParams} />;
}
