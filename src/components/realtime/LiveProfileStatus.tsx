"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRealtime } from "@/components/realtime/RealtimeProvider";
import type { ReviewStatus, AssessmentStatus } from "@/lib/types/db";

// The subset of talent_applications the profile page cares about.
export interface ProfileStatusSnapshot {
  review_status: ReviewStatus;
  review_reason: string | null;
  technical_status: AssessmentStatus;
  technical_reason: string | null;
  interview_status: AssessmentStatus;
  interview_reason: string | null;
  previous_approved_state: Record<string, unknown> | null;
  avatar_url: string | null;
  headline: string | null;
}

export default function LiveProfileStatus({
  initial,
  children,
}: {
  initial: ProfileStatusSnapshot;
  children: (snapshot: ProfileStatusSnapshot) => React.ReactNode;
}) {
  const router = useRouter();
  const { onChange } = useRealtime();
  const [snapshotState, setSnapshotState] = useState<{
    base: ProfileStatusSnapshot;
    value: ProfileStatusSnapshot;
  } | null>(null);
  const snapshot =
    snapshotState?.base === initial ? snapshotState.value : initial;

  // Subscribe to talent_applications UPDATE via the RealtimeProvider.
  useEffect(() => {
    const unsub = onChange("talent_applications", (payload) => {
      if (payload.eventType !== "UPDATE") return;
      const row = payload.new as Record<string, unknown>;

      setSnapshotState((prevState) => {
        const prev =
          prevState?.base === initial ? prevState.value : initial;

        return {
          base: initial,
          value: {
            ...prev,
            review_status:
              (row.review_status as ReviewStatus) ?? prev.review_status,
            review_reason:
              (row.review_reason as string | null) ?? prev.review_reason,
            technical_status:
              (row.technical_status as AssessmentStatus) ??
              prev.technical_status,
            technical_reason:
              (row.technical_reason as string | null) ??
              prev.technical_reason,
            interview_status:
              (row.interview_status as AssessmentStatus) ??
              prev.interview_status,
            interview_reason:
              (row.interview_reason as string | null) ??
              prev.interview_reason,
            previous_approved_state:
              (row.previous_approved_state as Record<string, unknown> | null) ??
              prev.previous_approved_state,
            avatar_url: (row.avatar_url as string | null) ?? prev.avatar_url,
            headline: (row.headline as string | null) ?? prev.headline,
          },
        };
      });

      // Also trigger a server refresh so form data etc. stays consistent.
      router.refresh();
    });

    return unsub;
  }, [onChange, router, initial]);

  return <>{children(snapshot)}</>;
}
