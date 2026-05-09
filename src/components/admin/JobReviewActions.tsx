"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { approveJob, rejectJob } from "@/app/actions/admin-jobs";
import type { AdminJobActionState } from "@/app/actions/admin-jobs";
import { useState } from "react";

// Pre-selective rejection reason pills
const REJECTION_REASONS = [
  { id: "terms", label: "Violates platform terms" },
  { id: "description", label: "Insufficient job description" },
  { id: "spam", label: "Misleading or spam content" },
  { id: "compensation", label: "Inappropriate compensation terms" },
  { id: "duplicate", label: "Duplicate posting" },
  { id: "verification", label: "Company verification required" },
  { id: "discriminatory", label: "Discriminatory language" },
  { id: "incomplete", label: "Missing required information" },
] as const;

export function ApproveButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    async (prev: AdminJobActionState | undefined, fd: FormData) => {
      const result = await approveJob(prev, fd);
      if (result.ok) {
        setTimeout(() => router.push("/admin?type=jobs"), 1000);
      }
      return result;
    },
    undefined
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="job_id" value={jobId} />
      <button
        type="submit"
        disabled={isPending || (state?.ok === true)}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-xs font-semibold text-white transition-all hover:opacity-90 hover:shadow-[0_0_24px_rgba(74,222,128,0.35)] disabled:cursor-not-allowed disabled:opacity-60 font-raleway"
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : state?.ok ? (
          <CheckCircle2 className="h-3.5 w-3.5" />
        ) : (
          <CheckCircle2 className="h-3.5 w-3.5" />
        )}
        {isPending ? "Approving…" : state?.ok ? "Approved!" : "Approve & publish"}
      </button>
      {state && !state.ok && (
        <p className="mt-2 text-xs text-red-500 font-raleway">{state.message}</p>
      )}
    </form>
  );
}

export function RejectButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState<Set<string>>(new Set());
  const [customReason, setCustomReason] = useState("");

  // Build the final reason string from selected pills + custom text
  const pillText = Array.from(selectedReasons)
    .map((id) => REJECTION_REASONS.find((r) => r.id === id)?.label ?? id)
    .join(" · ");
  const fullReason = [pillText, customReason.trim()].filter(Boolean).join("\n\n");
  const canReject = fullReason.length >= 10;

  function toggleReason(id: string) {
    setSelectedReasons((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const [state, formAction, isPending] = useActionState(
    async (prev: AdminJobActionState | undefined, fd: FormData) => {
      const result = await rejectJob(prev, fd);
      if (result.ok) {
        setTimeout(() => router.push("/admin?type=jobs"), 1000);
      }
      return result;
    },
    undefined
  );

  if (!showForm) {
    return (
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/5 px-5 py-2.5 text-xs font-semibold text-red-500 transition-all hover:bg-red-500/10 font-raleway"
      >
        <XCircle className="h-3.5 w-3.5" />
        Reject
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
      <input type="hidden" name="job_id" value={jobId} />
      <input type="hidden" name="reason" value={fullReason} />

      {/* Heading */}
      <div>
        <p className="text-xs font-semibold text-red-500 uppercase tracking-[0.08em] font-jetbrains">
          Rejection reason
        </p>
        <p className="mt-1 text-[11px] text-body font-raleway">
          Select one or more reasons, then add optional details below.
        </p>
      </div>

      {/* Pre-selective pills */}
      <div className="flex flex-wrap gap-2">
        {REJECTION_REASONS.map((r) => {
          const active = selectedReasons.has(r.id);
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => toggleReason(r.id)}
              className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all font-raleway ${
                active
                  ? "border-red-500 bg-red-500 text-white"
                  : "border-edge bg-surface text-body hover:border-red-500/40 hover:text-red-500"
              }`}
            >
              {r.label}
            </button>
          );
        })}
      </div>

      {/* Custom reason textarea */}
      <div>
        <label className="text-[11px] uppercase tracking-[0.08em] text-subtle font-jetbrains">
          Additional notes (optional)
        </label>
        <textarea
          value={customReason}
          onChange={(e) => setCustomReason(e.target.value)}
          rows={3}
          placeholder="Explain why this job posting was rejected or what the company should fix…"
          className="mt-1.5 w-full resize-y rounded-lg border border-edge bg-surface px-4 py-2.5 text-sm text-heading placeholder:text-subtle transition-colors focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 font-raleway"
        />
        {state && !state.ok && state.fieldErrors?.reason && (
          <p className="mt-1 text-[11px] text-red-500 font-jetbrains">
            {state.fieldErrors.reason[0]}
          </p>
        )}
      </div>

      {/* Preview of assembled reason */}
      {fullReason.length > 0 && (
        <div className="rounded-lg border border-edge bg-surface p-3">
          <p className="text-[10px] uppercase tracking-[0.08em] text-subtle font-jetbrains mb-1">
            Reason preview
          </p>
          <p className="whitespace-pre-wrap text-xs text-heading font-raleway">
            {fullReason}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isPending || !canReject}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-500 px-5 py-2.5 text-xs font-semibold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 font-raleway"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <XCircle className="h-3.5 w-3.5" />
          )}
          {isPending ? "Rejecting…" : "Confirm reject"}
        </button>
        <button
          type="button"
          onClick={() => {
            setShowForm(false);
            setSelectedReasons(new Set());
            setCustomReason("");
          }}
          className="rounded-lg border border-edge bg-surface px-4 py-2.5 text-xs font-semibold text-body transition-opacity hover:opacity-80 font-raleway"
        >
          Cancel
        </button>
      </div>

      {state && !state.ok && !state.fieldErrors && (
        <p className="text-xs text-red-500 font-raleway">{state.message}</p>
      )}
    </form>
  );
}
