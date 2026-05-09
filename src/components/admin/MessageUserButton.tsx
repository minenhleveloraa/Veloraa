"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Loader2 } from "lucide-react";
import { openAdminSupportThread } from "@/app/actions/messages";
import { cn } from "@/lib/utils";

interface MessageUserButtonProps {
  userId: string;
  label?: string;
  className?: string;
  variant?: "primary" | "ghost" | "pill";
}

/**
 * Admin-only button that opens (or finds) an `admin_support` thread with the
 * given user and navigates into the messaging inbox. Idempotent — hitting
 * this button repeatedly on the same user just lands back in their thread.
 */
export default function MessageUserButton({
  userId,
  label = "Message",
  className,
  variant = "primary",
}: MessageUserButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const variantClasses = {
    primary:
      "inline-flex items-center gap-1.5 rounded-lg bg-btn-bg px-3 py-1.5 text-xs font-semibold text-btn-fg transition-opacity hover:opacity-90 disabled:opacity-60",
    ghost:
      "inline-flex items-center gap-1.5 rounded-lg border border-edge bg-surface px-3 py-1.5 text-xs font-semibold text-heading transition-colors hover:border-accent/40 hover:text-accent disabled:opacity-60",
    pill:
      "inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-semibold text-accent transition-colors hover:bg-accent/15 disabled:opacity-60",
  }[variant];

  return (
    <div className={cn("inline-flex flex-col items-end gap-1", className)}>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const res = await openAdminSupportThread({ userId });
            if (!res.ok) {
              setError(res.error);
              return;
            }
            router.push("/admin/messages");
          });
        }}
        className={cn(variantClasses, "font-raleway")}
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <MessageSquare className="h-3.5 w-3.5" />
        )}
        {label}
      </button>
      {error && (
        <span className="text-[10px] text-red-500 font-jetbrains">{error}</span>
      )}
    </div>
  );
}
