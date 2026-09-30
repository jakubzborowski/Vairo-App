import {
  DiscoverScreen,
  type DiscoverParams,
} from "@/components/social/discover-screen";

export const metadata = { title: "Szukam projektu — Vairo" };
export const dynamic = "force-dynamic";

export default async function DiscoverTeamsPage({
  searchParams,
}: {
  searchParams: Promise<DiscoverParams>;
}) {
  return <DiscoverScreen tab="teams" params={await searchParams} />;
}
