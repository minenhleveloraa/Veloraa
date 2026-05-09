"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarCheck,
  Check,
  Loader2,
  X,
  XCircle,
} from "lucide-react";
import {
  acceptInvitation,
  declineInvitation,
} from "@/app/actions/interview-invitations";

export default function InvitationActions({
  invitationId,
  proposedDates,
}: {
  invitationId: string;
  proposedDates: string[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "accept" | "decline">("idle");
  const [selectedDate, setSelectedDate] = useState<string>(proposedDates[0] ?? "");
  const [declineReason, setDeclineReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState<"accepted" | "declined" | null>(null);

  function handleAccept() {
    if (!selectedDate) return;
    startTransition(async () => {
      const res = await acceptInvitation({
        invitation_id: invitationId,
        selected_date: selectedDate,
      });
      if (res.ok) {
        setDone("accepted");
        setTimeout(() => router.refresh(), 1500);
      }
    });
  }

  function handleDecline() {
    startTransition(async () => {
      const res = await declineInvitation({
        invitation_id: invitationId,
        reason: declineReason.trim() || undefined,
      });
      if (res.ok) {
        setDone("declined");
        setTimeout(() => router.refresh(), 1500);
      }
    });
  }

  if (done === "accepted") {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-lg bg-accent/10 border border-accent/30 px-3 py-2 text-xs font-semibold text-accent font-raleway">
        <CalendarCheck className="h-3.5 w-3.5" />
        Interview confirmed!
      </div>
    );
  }
  if (done === "declined") {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-500 font-raleway">
        <XCircle className="h-3.5 w-3.5" />
        Declined
      </div>
    );
  }

  if (mode === "idle") {
    return (
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => setMode("accept")}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white transition-all hover:opacity-92 hover:shadow-[0_18px_40px_-24px_rgba(74,222,128,0.42)] font-raleway"
        >
          <Check className="h-3.5 w-3.5" />
          Accept
        </button>
        <button
          type="button"
          onClick={() => setMode("decline")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs font-semibold text-red-500 transition-all hover:bg-red-500/10 font-raleway"
        >
          <X className="h-3.5 w-3.5" />
          Decline
        </button>
      </div>
    );
  }

  if (mode === "accept") {
    return (
      <div className="rounded-xl border border-accent/20 bg-accent/5 p-3 space-y-3">
        <p className="text-[10px] uppercase tracking-[0.08em] text-accent font-jetbrains">
          Pick your preferred time
        </p>
        <div className="space-y-1.5">
          {proposedDates.map((d) => {
            const date = new Date(d);
            const isSelected = d === selectedDate;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setSelectedDate(d)}
                className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all font-raleway ${
                  isSelected
                    ? "border-accent bg-accent text-white"
                    : "border-edge bg-surface text-heading hover:border-accent/40"
                }`}
              >
                <CalendarCheck className="h-3.5 w-3.5" />
                {date.toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}{" "}
                at{" "}
                {date.toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleAccept}
            disabled={isPending || !selectedDate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 font-raleway"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            Confirm
          </button>
          <button
            type="button"
            onClick={() => setMode("idle")}
            className="rounded-lg border border-edge bg-surface px-3 py-2 text-xs font-semibold text-body hover:opacity-80 font-raleway"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Decline mode
  return (
    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 space-y-3">
      <p className="text-[10px] uppercase tracking-[0.08em] text-red-500 font-jetbrains">
        Decline this invite?
      </p>
      <textarea
        value={declineReason}
        onChange={(e) => setDeclineReason(e.target.value)}
        rows={2}
        placeholder="Optional: let them know why…"
        className="w-full resize-y rounded-lg border border-edge bg-surface px-3 py-2 text-xs text-heading placeholder:text-subtle focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 font-raleway"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleDecline}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 font-raleway"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <XCircle className="h-3.5 w-3.5" />
          )}
          Decline
        </button>
        <button
          type="button"
          onClick={() => setMode("idle")}
          className="rounded-lg border border-edge bg-surface px-3 py-2 text-xs font-semibold text-body hover:opacity-80 font-raleway"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
