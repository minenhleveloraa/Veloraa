import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";

export default function TalentProfileLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 sm:px-6 lg:px-10">
      {/* Banner */}
      <div className="overflow-hidden rounded-2xl border border-edge bg-surface">
        <Skeleton className="h-32 w-full rounded-none sm:h-40" />
        <div className="relative px-5 pb-5 sm:px-6 sm:pb-6">
          <Skeleton className="-mt-12 h-24 w-24 rounded-2xl border-4 border-surface sm:-mt-14 sm:h-28 sm:w-28" />
          <div className="mt-4 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-12 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
        </div>
      </div>
      <SkeletonCard className="mt-6" lines={5} />
      <SkeletonCard className="mt-6" lines={4} />
    </div>
  );
}
