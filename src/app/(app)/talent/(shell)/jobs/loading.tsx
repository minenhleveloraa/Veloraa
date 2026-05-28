import { Skeleton, SkeletonHeader, SkeletonRow } from "@/components/ui/Skeleton";

export default function TalentJobsLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 sm:px-6 lg:px-10">
      <SkeletonHeader />
      <div className="mt-6 flex gap-3">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 w-24 rounded-lg" />
      </div>
      <div className="mt-8 divide-y divide-edge overflow-hidden rounded-2xl border border-edge bg-surface">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    </div>
  );
}
