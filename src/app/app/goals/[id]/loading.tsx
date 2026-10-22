import { Skeleton } from "@/components/ui/skeleton";

/** Szkielet w kształcie szczegółu celu: tytuł, zdanie faktów, karta, zadania. */
export default function GoalLoading() {
  return (
    <div role="status" aria-busy="true" className="page">
      <span className="sr-only">Ładowanie celu…</span>
      <Skeleton className="h-4 w-14" />
      <Skeleton className="mt-4 h-8 w-3/4" />
      <Skeleton className="mt-3 h-4 w-2/3" />
      <Skeleton className="mt-6 h-44 w-full rounded-[22px]" />
      <Skeleton className="mt-4 h-32 w-full rounded-[18px]" />
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-16 rounded-[18px]" />
        <Skeleton className="h-16 rounded-[18px]" />
      </div>
    </div>
  );
}
