import { Skeleton, SkeletonHeader, SkeletonRow } from "@/components/ui/Skeleton";

export default function CompanyJobsLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 sm:px-6 lg:px-10">
      <SkeletonHeader />

      {/* Quota bar */}
      <div className="mt-6 flex items-center justify-between rounded-xl border border-edge bg-surface px-5 py-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-4 w-16" />
      </div>

      {/* Search + filter */}
      <div className="mt-6 flex gap-3">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>

      {/* Job list */}
      <div className="mt-8 divide-y divide-edge overflow-hidden rounded-2xl border border-edge bg-surface">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    </div>
  );
}
