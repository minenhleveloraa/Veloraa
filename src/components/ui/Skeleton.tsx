/**
 * Reusable skeleton primitives for loading states.
 *
 * Uses CSS-only animation — zero JS overhead, instant render.
 */

import { cn } from "@/lib/utils";

/** A single animated bar/block used to represent loading content. */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-edge/60 dark:bg-edge/40",
        className
      )}
      {...props}
    />
  );
}

/** A header skeleton: eyebrow + title + subtitle. */
export function SkeletonHeader({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-8 w-64 max-w-full" />
      <Skeleton className="h-4 w-80 max-w-full" />
    </div>
  );
}

/** A card skeleton with configurable height. */
export function SkeletonCard({
  className,
  lines = 3,
}: {
  className?: string;
  lines?: number;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-edge bg-surface p-5 sm:p-6",
        className
      )}
    >
      <div className="mb-4 flex items-center gap-3">
        <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-3"
            style={{ width: `${85 - i * 12}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/** A row skeleton (like a list item). */
export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 px-5 py-4", className)}>
      <Skeleton className="h-4 w-4 shrink-0 rounded" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-3 w-16 shrink-0" />
    </div>
  );
}

/** A stat/metric skeleton. */
export function SkeletonStat({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-edge bg-page-alt p-4",
        className
      )}
    >
      <Skeleton className="mb-2 h-3 w-20" />
      <Skeleton className="h-6 w-12" />
      <Skeleton className="mt-3 h-1 w-full rounded-full" />
    </div>
  );
}
