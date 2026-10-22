import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Szkielety ekranów pokazywane przez `loading.tsx`, zanim serwer odda dane.
 *
 * Bez nich kliknięcie w menu nie dawało żadnej reakcji, dopóki cała strona
 * nie była gotowa — a kilka sekund ciszy po kliknięciu czyta się jak awaria.
 * Kształt odpowiada docelowemu ekranowi (ta sama szerokość kolumny), żeby
 * podmiana na treść nie przesuwała layoutu.
 */
function LoadingRegion({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div role="status" aria-busy="true" className={className}>
      <span className="sr-only">Ładowanie…</span>
      {children}
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <div>
      <Skeleton className="h-8 w-56" />
      <Skeleton className="mt-2.5 h-4 w-40" />
    </div>
  );
}

export function PageSkeleton({ wide = false }: { wide?: boolean }) {
  return (
    <LoadingRegion className={wide ? "page-wide" : "page"}>
      <HeaderSkeleton />
      <div className="mt-6 flex flex-col gap-3">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </LoadingRegion>
  );
}

export function DashboardSkeleton() {
  return (
    <LoadingRegion className="page-wide">
      <div className="flex items-start justify-between gap-3">
        <HeaderSkeleton />
        <Skeleton className="h-8 w-36" />
      </div>

      <Skeleton className="mt-6 h-11 w-full rounded-xl" />

      <div className="mt-6 grid gap-3 md:grid-cols-6">
        <div className="rounded-2xl border border-white/[0.07] bg-[var(--surface)] p-5 md:col-span-6">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="mt-3 h-6 w-48" />
          <Skeleton className="mt-5 h-2 w-full rounded-full" />
        </div>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/[0.07] bg-[var(--surface)] p-4 md:col-span-2"
          >
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="mt-4 h-7 w-16" />
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </LoadingRegion>
  );
}

export function StageSkeleton() {
  return (
    <LoadingRegion className="mx-auto w-full max-w-[1400px]">
      <HeaderSkeleton />
      <div className="mt-6 grid gap-3 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "rounded-2xl border border-white/[0.07] bg-[var(--surface)] p-4",
              i > 0 && "hidden lg:block"
            )}
          >
            <Skeleton className="h-3.5 w-24" />
            <div className="mt-4 flex flex-col gap-2">
              {[0, 1, 2, 3, 4].map((row) => (
                <Skeleton key={row} className="h-11 w-full rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}
