import { Skeleton, SkeletonHeader, SkeletonRow } from "@/components/ui/Skeleton";

export default function TalentNotificationsLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 sm:px-6 lg:px-10">
      <SkeletonHeader />
      <div className="mt-8 divide-y divide-edge overflow-hidden rounded-2xl border border-edge bg-surface">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    </div>
  );
}
