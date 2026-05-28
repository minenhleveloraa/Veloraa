import { Skeleton } from "@/components/ui/Skeleton";

export default function TalentMessagesLoading() {
  return (
    <div className="fixed inset-x-0 top-16 bottom-[calc(4.5rem_+_env(safe-area-inset-bottom))] bg-page lg:bottom-0">
      <div className="flex h-full">
        {/* Thread list */}
        <div className="w-full border-r border-edge sm:w-80 lg:w-96">
          <div className="border-b border-edge p-4">
            <Skeleton className="h-8 w-full rounded-lg" />
          </div>
          <div className="space-y-1 p-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl p-3">
                <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-3 w-10 shrink-0" />
              </div>
            ))}
          </div>
        </div>
        {/* Message pane */}
        <div className="hidden flex-1 flex-col sm:flex">
          <div className="border-b border-edge p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-4 p-6">
            <div className="flex gap-3">
              <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
              <Skeleton className="h-16 w-64 rounded-2xl" />
            </div>
            <div className="flex justify-end">
              <Skeleton className="h-12 w-48 rounded-2xl" />
            </div>
          </div>
          <div className="border-t border-edge p-4">
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
