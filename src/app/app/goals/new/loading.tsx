import { Skeleton } from "@/components/ui/skeleton";

/** Szkielet kreatora: pasek kroków, pytanie, pole. */
export default function NewGoalLoading() {
  return (
    <div role="status" aria-busy="true" className="page py-2 sm:py-6">
      <span className="sr-only">Ładowanie kreatora…</span>
      <div className="mx-auto max-w-[560px]">
        <Skeleton className="h-2 w-full" />
        <Skeleton className="mt-10 h-9 w-4/5" />
        <Skeleton className="mt-8 h-[52px] w-full rounded-xl" />
      </div>
    </div>
  );
}
