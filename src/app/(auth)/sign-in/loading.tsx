import { Skeleton } from "@/components/ui/Skeleton";

export default function SignInLoading() {
  return (
    <div className="w-full max-w-md">
      <div className="mb-6 text-center sm:mb-8 space-y-3">
        <Skeleton className="mx-auto h-3 w-32" />
        <Skeleton className="mx-auto h-8 w-56" />
        <Skeleton className="mx-auto h-4 w-64" />
      </div>
      <div className="rounded-none p-0 sm:rounded-2xl sm:border sm:border-edge sm:bg-surface sm:p-8 space-y-5">
        <div className="space-y-2">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <Skeleton className="h-10 w-full rounded-lg" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-px flex-1" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-px flex-1" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
