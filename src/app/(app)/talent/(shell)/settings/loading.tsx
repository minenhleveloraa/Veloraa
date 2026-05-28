import { Skeleton, SkeletonCard, SkeletonHeader } from "@/components/ui/Skeleton";

export default function TalentSettingsLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 sm:px-6 lg:px-10">
      <SkeletonHeader />
      <SkeletonCard className="mt-6" lines={4} />
      <SkeletonCard className="mt-6" lines={3} />
      <SkeletonCard className="mt-6" lines={5} />
    </div>
  );
}
