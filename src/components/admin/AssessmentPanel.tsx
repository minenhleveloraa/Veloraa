"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  Lock,
  ThumbsDown,
  Trophy,
  UserCheck,
  X,
  XCircle,
} from "lucide-react";
import {
  failInterview,
  failTechnical,
  passInterview,
  passTechnical,
  type AdminActionState,
} from "@/app/actions/admin";
import type { AssessmentStatus } from "@/lib/types/db";

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

type ServerAction = (
  prev: AdminActionState | undefined,
  formData: FormData
) => Promise<AdminActionState>;

type StageKey = "technical" | "interview";

interface StageConfig {
  key: StageKey;
  label: string;
  description: string;
  icon: typeof ClipboardCheck;
  passAction: ServerAction;
  failAction: ServerAction;
}

const STAGES: readonly StageConfig[] = [
  {
    key: "technical",
    label: "Technical assessment",
    description:
      "After you've graded the take-home / live technical, record the outcome here.",
    icon: ClipboardCheck,
    passAction: passTechnical,
    failAction: failTechnical,
  },
  {
    key: "interview",
    label: "Senior engineer interview",
    description:
      "After the 45-minute interview, capture the decision. This is the final gate before going live.",
    icon: UserCheck,
    passAction: passInterview,
    failAction: failInterview,
  },
] as const;

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

export default function AssessmentPanel({
  userId,
  applicantName,
  technicalStatus,
  technicalReason,
  technicalDecisionAt,
  interviewStatus,
  interviewReason,
  interviewDecisionAt,
  reapplyDefault,
}: {
  userId: string;
  applicantName: string;
  technicalStatus: AssessmentStatus;
  technicalReason: string | null;
  technicalDecisionAt: string | null;
  interviewStatus: AssessmentStatus;
  interviewReason: string | null;
  interviewDecisionAt: string | null;
  reapplyDefault: string; // YYYY-MM-DD
}) {
  const statuses: Record<
    StageKey,
    {
      status: AssessmentStatus;
      reason: string | null;
      decisionAt: string | null;
    }
  > = {
    technical: {
      status: technicalStatus,
      reason: technicalReason,
      decisionAt: technicalDecisionAt,
    },
    interview: {
      status: interviewStatus,
      reason: interviewReason,
      decisionAt: interviewDecisionAt,
    },
  };

  const everythingDone =
    (technicalStatus === "passed" && interviewStatus === "passed") ||
    technicalStatus === "failed" ||
    interviewStatus === "failed";

  return (
    <div className="rounded-2xl border border-edge bg-surface p-5 sm:p-6">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.08em] text-accent font-jetbrains">
            Post-approval vetting
          </p>
          <h2 className="mt-1 text-lg font-bold text-heading font-raleway">
            Assessment &amp; interview
          </h2>
          <p className="mt-1 text-xs text-body font-raleway">
            Record the outcome of each stage so{" "}
            <span className="text-heading">{applicantName}</span> and the
            candidate&apos;s dashboard stay in sync.
          </p>
        </div>
        {everythingDone && (
          <OverallBadge
            technicalStatus={technicalStatus}
            interviewStatus={interviewStatus}
          />
        )}
      </header>

      <div className="space-y-3">
        {STAGES.map((stage, i) => {
          const prev = i === 0 ? null : STAGES[i - 1];
          const prevDone =
            !prev || statuses[prev.key].status === "passed";
          const locked = !prevDone;
          return (
            <StageRow
              key={stage.key}
              stage={stage}
              userId={userId}
              applicantName={applicantName}
              status={statuses[stage.key].status}
              reason={statuses[stage.key].reason}
              decisionAt={statuses[stage.key].decisionAt}
              reapplyDefault={reapplyDefault}
              locked={locked}
            />
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overall outcome badge (only shown once the pipeline is terminal)
// ---------------------------------------------------------------------------

function OverallBadge({
  technicalStatus,
  interviewStatus,
}: {
  technicalStatus: AssessmentStatus;
  interviewStatus: AssessmentStatus;
}) {
  if (technicalStatus === "passed" && interviewStatus === "passed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[10px] uppercase tracking-[0.08em] text-accent font-jetbrains">
        <Trophy className="h-3 w-3" />
        Live on platform
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.08em] text-red-500 font-jetbrains">
      <XCircle className="h-3 w-3" />
      Application closed
    </span>
  );
}

// ---------------------------------------------------------------------------
// Single stage row
// ---------------------------------------------------------------------------

function StageRow({
  stage,
  userId,
  applicantName,
  status,
  reason,
  decisionAt,
  reapplyDefault,
  locked,
}: {
  stage: StageConfig;
  userId: string;
  applicantName: string;
  status: AssessmentStatus;
  reason: string | null;
  decisionAt: string | null;
  reapplyDefault: string;
  locked: boolean;
}) {
  const [failOpen, setFailOpen] = useState(false);
  const [confirmPass, setConfirmPass] = useState(false);

  const Icon = stage.icon;

  return (
    <>
      <div
        className={`rounded-xl border p-4 transition-colors sm:p-5 ${
          status === "passed"
            ? "border-accent/30 bg-accent/5"
            : status === "failed"
            ? "border-red-500/30 bg-red-500/5"
            : locked
            ? "border-edge bg-page-alt opacity-70"
            : "border-edge bg-page-alt"
        }`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                status === "passed"
                  ? "bg-accent text-white"
                  : status === "failed"
                  ? "bg-red-500/15 text-red-500"
                  : locked
                  ? "bg-pill-bg text-subtle"
                  : "bg-pill-bg text-accent"
              }`}
            >
              {status === "passed" ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : status === "failed" ? (
                <XCircle className="h-5 w-5" />
              ) : locked ? (
                <Lock className="h-4 w-4" />
              ) : (
                <Icon className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-heading font-raleway">
                  {stage.label}
                </p>
                <StatusChip status={status} locked={locked} />
              </div>
              <p className="mt-1 text-xs text-body font-raleway">
                {locked
                  ? "Unlocks once the previous stage is marked passed."
                  : stage.description}
              </p>
              {decisionAt && (
                <p className="mt-1.5 text-[11px] text-subtle font-jetbrains">
                  Decision: {new Date(decisionAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {status === "pending" && !locked && (
            <div className="flex shrink-0 flex-wrap gap-2 sm:ml-4">
              <button
                type="button"
                onClick={() => setFailOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/5 px-3.5 py-2 text-xs font-semibold text-red-600 transition-opacity hover:opacity-80 font-raleway"
              >
                <ThumbsDown className="h-3.5 w-3.5" />
                Mark failed
              </button>
              <PassForm
                userId={userId}
                action={stage.passAction}
                label={stage.key === "technical" ? "Mark passed" : "Mark passed · go live"}
                confirming={confirmPass}
                onRequestConfirm={() => setConfirmPass(true)}
                onCancelConfirm={() => setConfirmPass(false)}
              />
            </div>
          )}
        </div>

        {/* Previously-captured reason — always visible if a fail was recorded */}
        {status === "failed" && reason && (
          <div className="mt-4 rounded-lg border border-red-500/20 bg-surface p-3">
            <p className="text-[10px] uppercase tracking-[0.08em] text-red-500 font-jetbrains">
              Reviewer notes (sent to applicant)
            </p>
            <p className="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed text-heading font-raleway">
              {reason}
            </p>
          </div>
        )}
      </div>

      <FailDialog
        open={failOpen}
        onClose={() => setFailOpen(false)}
        userId={userId}
        applicantName={applicantName}
        stageLabel={stage.label}
        reapplyDefault={reapplyDefault}
        action={stage.failAction}
      />
    </>
  );
}

function StatusChip({
  status,
  locked,
}: {
  status: AssessmentStatus;
  locked: boolean;
}) {
  if (locked) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-edge bg-surface px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-subtle font-jetbrains">
        Locked
      </span>
    );
  }
  if (status === "passed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-accent font-jetbrains">
        <CheckCircle2 className="h-3 w-3" />
        Passed
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-red-500 font-jetbrains">
        <XCircle className="h-3 w-3" />
        Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-amber-600 font-jetbrains">
      Awaiting decision
    </span>
  );
}

// ---------------------------------------------------------------------------
// Pass form (two-step: click → confirm)
// ---------------------------------------------------------------------------

function PassForm({
  userId,
  action: passAction,
  label,
  confirming,
  onRequestConfirm,
  onCancelConfirm,
}: {
  userId: string;
  action: ServerAction;
  label: string;
  confirming: boolean;
  onRequestConfirm: () => void;
  onCancelConfirm: () => void;
}) {
  const [state, action] = useActionState<
    AdminActionState | undefined,
    FormData
  >(passAction, undefined);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={onRequestConfirm}
        className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-white transition-all hover:opacity-90 hover:shadow-[0_0_24px_rgba(74,222,128,0.35)] font-raleway"
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
        {label}
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
      <PassSubmit />
      {state?.ok === false && (
        <span className="text-xs text-red-500 font-raleway">
          {state.message}
        </span>
      )}
    </form>
  );
}

function PassSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 font-raleway"
    >
      {pending ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
        </>
      ) : (
        <>
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
          Confirm &amp; notify
        </>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Fail dialog — mirrors the human-review rejection dialog
// ---------------------------------------------------------------------------

function FailDialog(props: {
  open: boolean;
  onClose: () => void;
  userId: string;
  applicantName: string;
  stageLabel: string;
  reapplyDefault: string;
  action: ServerAction;
}) {
  return (
    <AnimatePresence>
      {props.open && <FailDialogBody {...props} />}
    </AnimatePresence>
  );
}

function FailDialogBody({
  onClose,
  userId,
  applicantName,
  stageLabel,
  reapplyDefault,
  action: failAction,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  applicantName: string;
  stageLabel: string;
  reapplyDefault: string;
  action: ServerAction;
}) {
  const [state, action] = useActionState<
    AdminActionState | undefined,
    FormData
  >(failAction, undefined);

  const [reason, setReason] = useState("");
  const [reapply, setReapply] = useState(reapplyDefault);

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
              {stageLabel}
            </div>
            <h2 className="text-xl font-bold text-heading font-raleway">
              Fail {applicantName}?
            </h2>
            <p className="mt-1 text-sm text-body font-raleway">
              This closes the application. They&apos;ll receive your notes
              by email along with the date they can reapply.
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
              placeholder="Be specific and kind. e.g. The solution worked but had several race conditions in the concurrency handling — would like to see more production-ready code before next round."
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
            {state &&
              state.ok === false &&
              state.fieldErrors?.reapply_after?.[0] && (
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
              Saved and emailed.
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
            <FailSubmit />
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function FailSubmit() {
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
          Fail &amp; notify
        </>
      )}
    </button>
  );
}
