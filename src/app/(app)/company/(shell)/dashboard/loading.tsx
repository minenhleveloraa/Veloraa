import {
  Skeleton,
  SkeletonCard,
  SkeletonHeader,
  SkeletonRow,
  SkeletonStat,
} from "@/components/ui/Skeleton";

export default function CompanyDashboardLoading() {
  return (
    <div className="relative isolate">
      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pt-10">
        {/* Hero skeleton */}
        <div className="overflow-hidden rounded-[2rem] border border-edge bg-surface p-6 sm:p-9">
          <div className="mb-6 flex items-center justify-between">
            <Skeleton className="h-3 w-24" />
            <div className="flex gap-3">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
            <Skeleton className="h-32 w-32 shrink-0 rounded-[1.75rem] sm:h-36 sm:w-36" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-10 w-72 max-w-full" />
              <Skeleton className="h-4 w-96 max-w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="h-7 w-20 rounded-full" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-10 w-28 rounded-full" />
                <Skeleton className="h-10 w-36 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard grid skeleton */}
        <div className="mt-8 space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Pulse card */}
            <div className="lg:col-span-2">
              <SkeletonCard lines={4} className="min-h-[260px]" />
            </div>
            {/* Jobs feed */}
            <div className="lg:col-span-1">
              <div className="rounded-2xl border border-edge bg-surface p-5">
                <Skeleton className="mb-4 h-5 w-28" />
                <div className="space-y-1 divide-y divide-edge">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid gap-4 sm:grid-cols-3">
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
          </div>

          {/* Suggested talent */}
          <SkeletonCard lines={5} />
        </div>
      </div>
    </div>
  );
}
