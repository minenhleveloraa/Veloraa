import { Skeleton, SkeletonCard, SkeletonHeader } from "@/components/ui/Skeleton";

export default function CompanySettingsLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 sm:px-6 lg:px-10">
      <SkeletonHeader />

      {/* Profile shortcut */}
      <div className="mt-6 flex items-center gap-4 rounded-2xl border border-edge bg-surface p-4 sm:p-5">
        <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-64" />
        </div>
        <Skeleton className="h-4 w-12" />
      </div>

      {/* Settings cards */}
      <SkeletonCard className="mt-6" lines={4} />
      <SkeletonCard className="mt-6" lines={3} />
      <SkeletonCard className="mt-6" lines={5} />
      <SkeletonCard className="mt-6" lines={3} />
    </div>
  );
}
