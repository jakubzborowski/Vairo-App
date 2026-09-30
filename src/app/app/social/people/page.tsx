import {
  DiscoverScreen,
  type DiscoverParams,
} from "@/components/social/discover-screen";

export const metadata = { title: "Szukam ludzi — Vairo" };
export const dynamic = "force-dynamic";

export default async function DiscoverPeoplePage({
  searchParams,
}: {
  searchParams: Promise<DiscoverParams>;
}) {
  return <DiscoverScreen tab="people" params={await searchParams} />;
}
