"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Loader2,
  ThumbsDown,
  X,
} from "lucide-react";
import {
  approveTalent,
  rejectTalent,
  approveCompany,
  rejectCompany,
  type AdminActionState,
} from "@/app/actions/admin";
import type { ReviewStatus } from "@/lib/types/db";

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

type ApplicantType = "talent" | "company";

function getActionsFor(type: ApplicantType) {
  return type === "company"
    ? { approve: approveCompany, reject: rejectCompany }
    : { approve: approveTalent, reject: rejectTalent };
}

export default function DecisionPanel({
  userId,
  applicantName,
  currentStatus,
  reapplyDefault,
  applicantType = "talent",
}: {
  userId: string;
  applicantName: string;
  currentStatus: ReviewStatus;
  reapplyDefault: string; // YYYY-MM-DD
  applicantType?: ApplicantType;
}) {
  const actions = getActionsFor(applicantType);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [confirmApprove, setConfirmApprove] = useState(false);

  return (
    <>
      <div className="sticky bottom-4 z-20 rounded-2xl border border-edge bg-surface p-5 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.08em] text-subtle font-jetbrains">
              Decision
            </p>
            <p className="mt-0.5 text-sm font-semibold text-heading font-raleway">
              {currentStatus === "pending"
                ? `Grade ${applicantName} and send the outcome.`
                : currentStatus === "pending_update"
                ? `Review the proposed updates from ${applicantName}.`
                : currentStatus === "approved"
                ? `${applicantName} has been approved.`
                : `${applicantName} has been rejected.`}
            </p>
          </div>

          {currentStatus === "pending" || currentStatus === "pending_update" ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRejectOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-2 text-xs font-semibold text-red-600 transition-opacity hover:opacity-80 font-raleway"
              >
                <ThumbsDown className="h-3.5 w-3.5" />
                Reject
              </button>
              <ApproveForm
                userId={userId}
                confirming={confirmApprove}
                onRequestConfirm={() => setConfirmApprove(true)}
                onCancelConfirm={() => setConfirmApprove(false)}
                action={actions.approve}
              />
            </div>
          ) : (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.08em] font-jetbrains ${
                currentStatus === "approved"
                  ? "border-accent/30 bg-accent/10 text-accent"
                  : "border-red-500/30 bg-red-500/10 text-red-500"
              }`}
            >
              {currentStatus === "approved" ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Approved
                </>
              ) : (
                <>
                  <X className="h-3.5 w-3.5" /> Rejected
                </>
              )}
            </span>
          )}
        </div>
      </div>

      <RejectDialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        userId={userId}
        applicantName={applicantName}
        reapplyDefault={reapplyDefault}
        action={actions.reject}
      />
    </>
  );
}

type ServerAction = (
  prev: AdminActionState | undefined,
  formData: FormData
) => Promise<AdminActionState>;

// ---------------------------------------------------------------------
// Approve (two-step: click → confirm)
// ---------------------------------------------------------------------

function ApproveForm({
  userId,
  confirming,
  onRequestConfirm,
  onCancelConfirm,
  action: approveAction,
}: {
  userId: string;
  confirming: boolean;
  onRequestConfirm: () => void;
  onCancelConfirm: () => void;
  action: ServerAction;
}) {
  const [state, action] = useActionState<
    AdminActionState | undefined,
    FormData
  >(approveAction, undefined);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={onRequestConfirm}
        className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition-all hover:opacity-90 hover:shadow-[0_0_24px_rgba(74,222,128,0.35)] font-raleway"
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
        Approve
      </button>
    );
  }

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="user_id" value={userId} />
      <button
        type="button"
        onClick={onCancelConfirm}
        className="inline-flex items-center rounded-lg border border-ghost-border bg-surface px-3 py-2 text-xs font-semibold text-heading transition-opacity hover:opacity-80 font-raleway"
      >
        Cancel
      </button>
      <ApproveSubmit />
      {state?.ok === false && (
        <span className="text-xs text-red-500 font-raleway">
          {state.message}
        </span>
      )}
    </form>
  );
}

function ApproveSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 font-raleway"
    >
      {pending ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Approving…
        </>
      ) : (
        <>
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
          Confirm approval
        </>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------
// Reject dialog
// ---------------------------------------------------------------------

function RejectDialog(props: {
  open: boolean;
  onClose: () => void;
  userId: string;
  applicantName: string;
  reapplyDefault: string;
  action: ServerAction;
}) {
  // The body is extracted so its local state resets naturally each time
  // the dialog is opened (mount/unmount is the reset mechanism — no
  // effect-driven setState needed).
  return (
    <AnimatePresence>
      {props.open && <RejectDialogBody {...props} />}
    </AnimatePresence>
  );
}

function RejectDialogBody({
  onClose,
  userId,
  applicantName,
  reapplyDefault,
  action: rejectAction,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  applicantName: string;
  reapplyDefault: string;
  action: ServerAction;
}) {
  const [state, action] = useActionState<
    AdminActionState | undefined,
    FormData
  >(rejectAction, undefined);

  const [reason, setReason] = useState("");
  const [reapply, setReapply] = useState(reapplyDefault);

  // Auto-close on success.
  useEffect(() => {
    if (state?.ok) {
      const t = setTimeout(onClose, 600);
      return () => clearTimeout(t);
    }
  }, [state, onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/50 p-0 sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: EASE_OUT }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
        transition={{ duration: 0.25, ease: EASE_OUT }}
        className="w-full max-w-lg rounded-t-3xl border border-edge bg-surface p-6 shadow-2xl sm:rounded-2xl sm:p-8"
      >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.08em] text-red-500 font-jetbrains">
                  <AlertCircle className="h-3 w-3" />
                  Rejection
                </div>
                <h2 className="text-xl font-bold text-heading font-raleway">
                  Reject {applicantName}?
                </h2>
                <p className="mt-1 text-sm text-body font-raleway">
                  They&apos;ll receive your notes by email along with the date
                  they can reapply.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-body transition-colors hover:bg-page-alt hover:text-heading"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form action={action} className="space-y-5">
              <input type="hidden" name="user_id" value={userId} />

              <div>
                <label
                  htmlFor="reason"
                  className="mb-1.5 block text-xs uppercase tracking-[0.08em] text-body font-jetbrains"
                >
                  Reasons (sent to applicant)
                </label>
                <textarea
                  id="reason"
                  name="reason"
                  required
                  minLength={20}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={6}
                  maxLength={2000}
                  placeholder="Be specific and kind. e.g. Strong breadth but limited evidence of production ownership; recommend 1-2 shipped projects with measurable impact before reapplying."
                  className="w-full resize-y rounded-lg border border-edge bg-page-alt px-4 py-2.5 text-sm text-heading placeholder:text-subtle transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 font-raleway"
                />
                <div className="mt-1 flex items-center justify-between">
                  {state && state.ok === false && state.fieldErrors?.reason?.[0] ? (
                    <p className="text-xs text-red-500 font-raleway">
                      {state.fieldErrors.reason[0]}
                    </p>
                  ) : (
                    <span />
                  )}
                  <p className="text-[11px] text-subtle font-jetbrains">
                    {reason.length} / 2000
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="reapply_after"
                  className="mb-1.5 block text-xs uppercase tracking-[0.08em] text-body font-jetbrains"
                >
                  Can reapply after
                </label>
                <input
                  id="reapply_after"
                  name="reapply_after"
                  type="date"
                  required
                  value={reapply}
                  onChange={(e) => setReapply(e.target.value)}
                  className="w-full rounded-lg border border-edge bg-page-alt px-4 py-2.5 text-sm text-heading transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 font-raleway"
                />
                <p className="mt-1 text-[11px] text-subtle font-raleway">
                  Defaults to 3 months from today.
                </p>
                {state && state.ok === false && state.fieldErrors?.reapply_after?.[0] && (
                  <p className="mt-1 text-xs text-red-500 font-raleway">
                    {state.fieldErrors.reapply_after[0]}
                  </p>
                )}
              </div>

              {state && state.ok === false && !state.fieldErrors && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-500 font-raleway">
                  {state.message}
                </div>
              )}

              {state?.ok && (
                <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 text-xs text-accent font-raleway">
                  Rejection saved and emailed.
                </div>
              )}

              <div className="flex items-center justify-end gap-2 border-t border-edge pt-5">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center rounded-lg border border-ghost-border bg-surface px-4 py-2 text-xs font-semibold text-heading transition-opacity hover:opacity-80 font-raleway"
                >
                  Cancel
                </button>
                <RejectSubmit />
              </div>
            </form>
      </motion.div>
    </motion.div>
  );
}

function RejectSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 font-raleway"
    >
      {pending ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Sending…
        </>
      ) : (
        <>
          <ThumbsDown className="h-3.5 w-3.5" />
          Reject &amp; notify
        </>
      )}
    </button>
  );
}
