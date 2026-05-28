import { Skeleton } from "@/components/ui/Skeleton";

export default function SignUpLoading() {
  return (
    <div className="w-full max-w-xl">
      <div className="mb-8 text-center sm:mb-10 space-y-3">
        <Skeleton className="mx-auto h-3 w-32" />
        <Skeleton className="mx-auto h-8 w-56" />
        <Skeleton className="mx-auto h-4 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-edge bg-surface p-6 space-y-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
