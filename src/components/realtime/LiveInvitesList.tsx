"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRealtime } from "@/components/realtime/RealtimeProvider";

// ---------------------------------------------------------------------------
// LiveInvitesList — wraps the talent invites page body.
//
// When a new interview_invitations INSERT or UPDATE arrives via Realtime,
// we trigger router.refresh() so the server component re-fetches the
// hydrated invite list (with job titles, company names, etc.). This keeps
// the page live without duplicating the server-side join logic.
// ---------------------------------------------------------------------------

export default function LiveInvitesList({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { onChange } = useRealtime();

  useEffect(() => {
    let rafId: number | null = null;

    const scheduleRefresh = () => {
      if (rafId != null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        router.refresh();
      });
    };

    const unsub = onChange("interview_invitations", () => {
      scheduleRefresh();
    });

    return () => {
      unsub();
      if (rafId != null) cancelAnimationFrame(rafId);
    };
  }, [onChange, router]);

  return <>{children}</>;
}
