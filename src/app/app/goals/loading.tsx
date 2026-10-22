import { Skeleton } from "@/components/ui/skeleton";
import { GoalListSkeleton } from "@/components/goals/goal-row";

/**
 * Szkielet w kształcie prawdziwej listy celów: nagłówek z zakładkami, karta
 * następnego kroku i wiersze. Po wczytaniu nic nie skacze.
 */
export default function GoalsLoading() {
  return (
    <div role="status" aria-busy="true" className="page-wide">
      <span className="sr-only">Ładowanie celów…</span>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Skeleton className="h-8 w-28" />
          <Skeleton className="mt-2.5 h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-72 rounded-xl" />
      </div>
      <Skeleton className="mt-6 h-[188px] w-full rounded-[22px]" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div>
          <Skeleton className="h-3.5 w-28" />
          <div className="mt-3">
            <GoalListSkeleton rows={3} />
          </div>
        </div>
        <div>
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="mt-3 h-40 w-full rounded-[18px]" />
        </div>
      </div>
    </div>
  );
}
