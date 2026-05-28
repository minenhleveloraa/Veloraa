import { Skeleton } from "@/components/ui/Skeleton";

export default function MarketingLoading() {
  return (
    <div className="bg-page transition-colors duration-300">
      {/* Hero skeleton */}
      <section className="relative overflow-hidden pb-16 pt-32 sm:pt-40">
        <div className="mx-auto max-w-4xl px-6 text-center lg:px-8 space-y-6">
          <Skeleton className="mx-auto h-7 w-36 rounded-full" />
          <Skeleton className="mx-auto h-12 w-[28rem] max-w-full" />
          <Skeleton className="mx-auto h-12 w-[24rem] max-w-full" />
          <Skeleton className="mx-auto h-5 w-[32rem] max-w-full" />
          <Skeleton className="mx-auto h-5 w-[28rem] max-w-full" />
          <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
            <Skeleton className="h-12 w-40 rounded-lg" />
            <Skeleton className="h-12 w-36 rounded-lg" />
          </div>
        </div>
      </section>

      {/* Feature grid skeleton */}
      <section className="px-6 pb-24 lg:px-8">
        <div className="mx-auto mb-14 max-w-2xl text-center space-y-3">
          <Skeleton className="mx-auto h-3 w-20" />
          <Skeleton className="mx-auto h-8 w-72" />
        </div>
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-edge bg-surface p-6 sm:p-8 space-y-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
