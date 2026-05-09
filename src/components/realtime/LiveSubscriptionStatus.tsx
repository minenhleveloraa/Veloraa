"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRealtime } from "@/components/realtime/RealtimeProvider";

// ---------------------------------------------------------------------------
// LiveSubscriptionStatus — wraps the company subscription page body.
//
// When a Paddle/PayFast webhook updates company_applications (subscription
// columns), the Realtime event fires and we trigger router.refresh() so the
// server component re-renders with the new status, period dates, etc.
// ---------------------------------------------------------------------------

export default function LiveSubscriptionStatus({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { onChange } = useRealtime();

  useEffect(() => {
    const unsub = onChange("company_applications", (payload) => {
      if (payload.eventType !== "UPDATE") return;
      router.refresh();
    });

    return unsub;
  }, [onChange, router]);

  return <>{children}</>;
}
