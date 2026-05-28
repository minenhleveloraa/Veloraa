import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";

export default function TalentDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 sm:px-6 lg:px-10">
      <Skeleton className="mb-4 h-4 w-20" />
      {/* Profile header */}
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-7">
        <Skeleton className="h-24 w-24 shrink-0 rounded-2xl sm:h-28 sm:w-28" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-12 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      </div>
      <SkeletonCard className="mt-6" lines={5} />
      <SkeletonCard className="mt-6" lines={4} />
    </div>
  );
}
