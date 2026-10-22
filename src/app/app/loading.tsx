import { DashboardSkeleton } from "@/components/app/page-skeleton";

/**
 * Ta granica obejmuje też wszystkie podstrony `/app`, dlatego każdy katalog
 * pod `/app` ma własny `loading.tsx` — inaczej przy wejściu w Team czy Cele
 * pokazywałby się szkielet dashboardu.
 */
export default function DashboardLoading() {
  return <DashboardSkeleton />;
}
