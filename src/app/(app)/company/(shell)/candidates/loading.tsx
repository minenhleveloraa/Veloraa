import { Skeleton, SkeletonHeader } from "@/components/ui/Skeleton";

export default function CompanyCandidatesLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 sm:px-6 lg:px-10">
      <SkeletonHeader />

      {/* Search + filter */}
      <div className="mt-6 flex gap-3">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 w-24 rounded-lg" />
      </div>

      {/* Candidate cards grid */}
      <div className="mt-8 grid gap-3 sm:gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl sm:rounded-[1.75rem] border border-edge bg-surface p-1 sm:p-[5px]"
          >
            {/* Image area */}
            <Skeleton className="h-32 w-full rounded-xl sm:h-72 sm:rounded-[1.35rem]" />
            {/* Info area */}
            <div className="space-y-3 px-3 py-3 sm:px-3.5 sm:pb-3.5">
              <div className="flex justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="space-y-2 text-right">
                  <Skeleton className="ml-auto h-3 w-10" />
                  <Skeleton className="ml-auto h-4 w-16" />
                </div>
              </div>
              <div className="flex gap-1.5">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-12 rounded-full" />
                <Skeleton className="h-5 w-10 rounded-full" />
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <Skeleton className="h-9 rounded-xl" />
                <Skeleton className="h-9 rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
