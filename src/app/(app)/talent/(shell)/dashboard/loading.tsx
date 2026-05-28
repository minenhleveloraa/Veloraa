import { Skeleton, SkeletonCard, SkeletonStat } from "@/components/ui/Skeleton";

export default function TalentDashboardLoading() {
  return (
    <div className="relative z-10 mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pt-10">
      {/* Hero skeleton */}
      <div className="overflow-hidden rounded-2xl border border-edge bg-surface p-6 sm:p-8">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-7">
          <Skeleton className="h-20 w-20 shrink-0 rounded-2xl sm:h-24 sm:w-24" />
          <div className="flex-1 space-y-3 text-center sm:text-left">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-64 max-w-full" />
            <Skeleton className="h-4 w-96 max-w-full" />
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-28 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
      </div>

      {/* Content cards */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SkeletonCard lines={4} />
        <SkeletonCard lines={4} />
      </div>
    </div>
  );
}
