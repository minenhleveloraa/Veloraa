"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRealtime } from "@/components/realtime/RealtimeProvider";

// ---------------------------------------------------------------------------
// Types — mirrors the Row + counts the admin page computes server-side.
// ---------------------------------------------------------------------------

export interface AdminCounts {
  talent: { pending: number; approved: number; rejected: number; total: number };
  company: { pending: number; approved: number; rejected: number; total: number };
  jobs: { pending: number; approved: number; rejected: number; total: number };
}

// ---------------------------------------------------------------------------
// LiveAdminQueue — wraps the admin dashboard body and refreshes the server
// data whenever a realtime event fires on any of the admin-visible tables.
//
// Because the admin page uses service-role queries to join profiles, AI
// analyses, etc., it's impractical to replicate all that logic client-side.
// Instead we take the pragmatic approach: listen for any change and call
// router.refresh() to re-fetch the server component with fresh data. The
// result is a ~200ms delay (Realtime event → refresh → new HTML) instead of
// a full manual reload. The counts and table both update automatically.
// ---------------------------------------------------------------------------

export default function LiveAdminQueue({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { onChange } = useRealtime();
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  useEffect(() => {
    // Debounce: when multiple events arrive close together (e.g. bulk
    // approve), we only fire one refresh per animation frame.
    let rafId: number | null = null;

    const scheduleRefresh = (label: string) => {
      setLastEvent(label);
      if (rafId != null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        router.refresh();
      });
    };

    const unsubs = [
      onChange("talent_applications", (p) => {
        const status = (p.new as Record<string, unknown>)?.review_status;
        scheduleRefresh(
          `talent_applications:${p.eventType}:${status ?? "?"}`
        );
      }),
      onChange("company_applications", (p) => {
        const status = (p.new as Record<string, unknown>)?.review_status;
        scheduleRefresh(
          `company_applications:${p.eventType}:${status ?? "?"}`
        );
      }),
      onChange("company_jobs", (p) => {
        const status = (p.new as Record<string, unknown>)?.status;
        scheduleRefresh(
          `company_jobs:${p.eventType}:${status ?? "?"}`
        );
      }),
    ];

    return () => {
      unsubs.forEach((fn) => fn());
      if (rafId != null) cancelAnimationFrame(rafId);
    };
  }, [onChange, router]);

  return (
    <>
      {/* Subtle live indicator */}
      {lastEvent && (
        <div className="mb-4 flex items-center gap-2 text-[10px] text-accent font-jetbrains animate-pulse">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          Live — last update just now
        </div>
      )}
      {children}
    </>
  );
}
