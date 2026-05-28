import { Skeleton, SkeletonCard, SkeletonHeader } from "@/components/ui/Skeleton";

export default function CompanyJobDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 sm:px-6 lg:px-10">
      <Skeleton className="mb-4 h-4 w-20" />
      <SkeletonHeader />
      <SkeletonCard className="mt-6" lines={6} />
      <SkeletonCard className="mt-6" lines={4} />
    </div>
  );
}
