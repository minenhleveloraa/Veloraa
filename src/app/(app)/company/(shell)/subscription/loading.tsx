import { Skeleton, SkeletonHeader, SkeletonStat } from "@/components/ui/Skeleton";

export default function CompanySubscriptionLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 sm:px-6 lg:px-10">
      <SkeletonHeader />

      {/* Current plan summary */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-edge bg-surface">
        <div className="flex flex-col gap-4 border-b border-edge p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="space-y-3">
            <Skeleton className="h-3 w-20" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6">
          <SkeletonStat />
          <SkeletonStat />
          <SkeletonStat />
        </div>
      </div>

      {/* Plan cards */}
      <div className="mt-10">
        <Skeleton className="mb-4 h-3 w-24" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-edge bg-surface p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-8 w-24" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-3 w-full" />
                ))}
              </div>
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
