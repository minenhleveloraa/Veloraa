"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRealtime } from "@/components/realtime/RealtimeProvider";
import type { ReviewStatus, AssessmentStatus } from "@/lib/types/db";

export interface ProfileSnapshot {
  review_status: ReviewStatus;
  review_reason: string | null;
  technical_status: AssessmentStatus;
  interview_status: AssessmentStatus;
  previous_approved_state: Record<string, unknown> | null;
}

/**
 * Listens for talent_applications UPDATE via RealtimeProvider and triggers
 * a server refresh when the review/technical/interview status changes. This
 * lets the server-rendered banners + form swap instantly when an admin acts.
 */
export default function LiveProfileBanners({
  initial,
  children,
}: {
  initial: ProfileSnapshot;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { onChange } = useRealtime();
  const [statusState, setStatusState] = useState({
    base: initial.review_status,
    current: initial.review_status,
  });
  const lastStatus =
    statusState.base === initial.review_status
      ? statusState.current
      : initial.review_status;

  useEffect(() => {
    const unsub = onChange("talent_applications", (payload) => {
      if (payload.eventType !== "UPDATE") return;
      const row = payload.new as Record<string, unknown>;
      const newStatus = row.review_status as ReviewStatus | undefined;

      if (newStatus && newStatus !== lastStatus) {
        setStatusState({ base: initial.review_status, current: newStatus });
        // Let the server re-render banners with the authoritative state.
        router.refresh();
      }
    });

    return unsub;
  }, [onChange, router, lastStatus, initial.review_status]);

  return <>{children}</>;
}
