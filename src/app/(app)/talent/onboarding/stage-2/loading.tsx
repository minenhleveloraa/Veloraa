import { Skeleton } from "@/components/ui/Skeleton";

export default function TalentOnboardingStage2Loading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="text-center space-y-3 mb-10">
        <Skeleton className="mx-auto h-3 w-20" />
        <Skeleton className="mx-auto h-8 w-64" />
        <Skeleton className="mx-auto h-4 w-80" />
      </div>
      <div className="rounded-2xl border border-edge bg-surface p-6 sm:p-8 space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}
