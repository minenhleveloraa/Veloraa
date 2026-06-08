"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import {
  CheckCircle2,
  Loader2,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { applyToJob } from "@/app/actions/job-applications";
import type { JobApplicationStatus } from "@/lib/types/db";
import { cn } from "@/lib/utils";

interface Props {
  jobId: string;
  jobTitle: string;
  companyName: string;
  initialStatus?: JobApplicationStatus | null;
  className?: string;
}

function statusCopy(status: JobApplicationStatus | null) {
  switch (status) {
    case "pending":
      return "Interest sent";
    case "accepted":
      return "Shortlisted";
    case "declined":
      return "Declined";
    case "withdrawn":
      return "Withdrawn";
    default:
      return "Interested and apply";
  }
}

export default function JobApplicationLauncher({
  jobId,
  jobTitle,
  companyName,
  initialStatus = null,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [intro, setIntro] = useState("");
  const [status, setStatus] = useState<JobApplicationStatus | null>(
    initialStatus
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [isMobile, setIsMobile] = useState(false);

  const applied = !!status && status !== "withdrawn";
  const remaining = 1400 - intro.length;

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const canSubmit = useMemo(
    () => intro.trim().length >= 20 && intro.length <= 1400 && !pending,
    [intro, pending]
  );

  function onDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (isMobile && info.offset.y > 110) setOpen(false);
  }

  function submit() {
    if (!canSubmit) return;
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await applyToJob({
        jobId,
        introNote: intro,
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setStatus(result.data.status);
      setMessage(result.message);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={applied}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all font-raleway",
          applied
            ? "border border-accent/30 bg-accent/10 text-accent"
            : "bg-accent text-white hover:opacity-90 hover:shadow-[0_18px_44px_-24px_rgba(74,222,128,0.48)]",
          className
        )}
      >
        {applied ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        {statusCopy(status)}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="Close application dialog"
              className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="job-application-title"
                drag={isMobile ? "y" : false}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.18 }}
                onDragEnd={onDragEnd}
                initial={isMobile ? { y: "100%" } : { opacity: 0, y: 16, scale: 0.98 }}
                animate={isMobile ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
                exit={isMobile ? { y: "100%" } : { opacity: 0, y: 12, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 360, damping: 34 }}
                className="relative max-h-[92dvh] w-full overflow-hidden rounded-t-3xl border-t border-edge bg-surface shadow-[0_-24px_80px_-20px_rgba(0,0,0,0.45)] sm:max-w-lg sm:rounded-2xl sm:border sm:shadow-2xl"
              >
                <div className="flex justify-center pt-3 sm:hidden">
                  <span className="h-1 w-10 rounded-full bg-edge" />
                </div>

                <div className="flex items-start gap-3 border-b border-edge px-5 py-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/12 text-accent">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-accent font-jetbrains">
                      Role interest
                    </p>
                    <h2
                      id="job-application-title"
                      className="mt-1 text-lg font-bold text-heading font-raleway"
                    >
                      Send interest to {companyName}
                    </h2>
                    <p className="mt-0.5 truncate text-xs text-body font-raleway">
                      {jobTitle}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-edge bg-page-alt text-body transition-colors hover:border-accent/40 hover:text-accent"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-4 overflow-y-auto px-5 py-5">
                  {message ? (
                    <div className="flex flex-col items-center gap-3 py-5 text-center">
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/12 text-accent">
                        <CheckCircle2 className="h-7 w-7" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-heading font-raleway">
                          Interest sent
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-body font-raleway">
                          {message}
                        </p>
                      </div>
                      <div className="flex flex-wrap justify-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setOpen(false)}
                          className="rounded-lg border border-edge bg-page-alt px-4 py-2 text-xs font-semibold text-heading transition-colors hover:border-accent/40 hover:text-accent font-raleway"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="rounded-2xl border border-edge bg-page-alt p-4">
                        <p className="text-xs leading-relaxed text-body font-raleway">
                          This lands on the company&apos;s job dashboard first.
                          If they shortlist you, Veloraa opens a conversation in
                          messages.
                        </p>
                      </div>

                      <label className="block">
                        <span className="text-[10px] uppercase tracking-[0.14em] text-subtle font-jetbrains">
                          Introduction note
                        </span>
                        <textarea
                          value={intro}
                          onChange={(event) => {
                            setIntro(event.target.value);
                            setError(null);
                          }}
                          rows={7}
                          maxLength={1400}
                          placeholder="Share why this role fits your work, the kind of problems you want to solve, and any useful context for the hiring team."
                          className="mt-2 w-full resize-none rounded-2xl border border-edge bg-page-alt px-4 py-3 text-sm leading-relaxed text-heading placeholder:text-subtle transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 font-raleway"
                        />
                      </label>

                      <div className="flex items-center justify-between gap-3">
                        <p
                          className={cn(
                            "text-[11px] font-jetbrains",
                            remaining < 80 ? "text-amber-600" : "text-subtle"
                          )}
                        >
                          {remaining} characters left
                        </p>
                        <p className="text-[11px] text-subtle font-raleway">
                          Minimum 20 characters
                        </p>
                      </div>

                      {error && (
                        <p className="rounded-xl border border-red-500/25 bg-red-500/5 px-3 py-2 text-xs text-red-500 font-raleway">
                          {error}
                        </p>
                      )}

                      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          onClick={() => setOpen(false)}
                          className="rounded-xl border border-edge bg-page-alt px-4 py-2.5 text-sm font-semibold text-heading transition-colors hover:border-accent/40 hover:text-accent font-raleway"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={submit}
                          disabled={!canSubmit}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-55 font-raleway"
                        >
                          {pending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          {pending ? "Sending..." : "Interested and apply"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
