"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  MapPin,
  MessageSquare,
  Sparkles,
  UserRoundCheck,
  UsersRound,
  X,
  XCircle,
} from "lucide-react";
import { updateJobApplicationStatus } from "@/app/actions/job-applications";
import type { JobApplicationStatus } from "@/lib/types/db";
import { cn } from "@/lib/utils";

export interface JobApplicationItem {
  id: string;
  talentUserId: string;
  fullName: string | null;
  headline: string | null;
  location: string | null;
  skills: string[];
  overallScore: number | null;
  expertiseLevel: string | null;
  introNote: string;
  status: JobApplicationStatus;
  statusNote: string | null;
  createdAt: string;
  threadId: string | null;
}

interface Props {
  jobTitle: string;
  applications: JobApplicationItem[];
}

const statusOrder: Record<JobApplicationStatus, number> = {
  pending: 0,
  accepted: 1,
  declined: 2,
  withdrawn: 3,
};

function statusBadge(status: JobApplicationStatus) {
  switch (status) {
    case "accepted":
      return {
        label: "Shortlisted",
        cls: "border-accent/35 bg-accent/10 text-accent",
        icon: CheckCircle2,
      };
    case "declined":
      return {
        label: "Declined",
        cls: "border-red-500/35 bg-red-500/8 text-red-500",
        icon: XCircle,
      };
    case "withdrawn":
      return {
        label: "Withdrawn",
        cls: "border-edge bg-page-alt text-body",
        icon: XCircle,
      };
    default:
      return {
        label: "New interest",
        cls: "border-sky-500/35 bg-sky-500/10 text-sky-700 dark:border-sky-300/30 dark:bg-sky-400/10 dark:text-sky-300",
        icon: Sparkles,
      };
  }
}

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function initials(name: string | null): string {
  const source = (name ?? "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function preview(value: string) {
  const text = value.trim().replace(/\s+/g, " ");
  return text.length > 150 ? `${text.slice(0, 147)}...` : text;
}

export default function JobApplicationsSection({
  jobTitle,
  applications,
}: Props) {
  const [localUpdates, setLocalUpdates] = useState<
    Record<string, JobApplicationItem>
  >({});
  const [selected, setSelected] = useState<JobApplicationItem | null>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actingStatus, setActingStatus] = useState<"accepted" | "declined" | null>(
    null
  );
  const [pendingTransition, startTransition] = useTransition();
  const [isMobile, setIsMobile] = useState(false);

  const items = useMemo(
    () =>
      applications.map((application) => localUpdates[application.id] ?? application),
    [applications, localUpdates]
  );

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!selected) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [selected]);

  const sorted = useMemo(
    () =>
      [...items].sort((a, b) => {
        const byStatus = statusOrder[a.status] - statusOrder[b.status];
        if (byStatus !== 0) return byStatus;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }),
    [items]
  );

  const counts = useMemo(
    () => ({
      total: items.length,
      pending: items.filter((item) => item.status === "pending").length,
      accepted: items.filter((item) => item.status === "accepted").length,
      declined: items.filter((item) => item.status === "declined").length,
    }),
    [items]
  );

  function onDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (isMobile && info.offset.y > 110) setSelected(null);
  }

  function openReview(item: JobApplicationItem) {
    setSelected(item);
    setDecisionNote(item.statusNote ?? "");
    setActionError(null);
    setSuccess(null);
    setActingStatus(null);
  }

  function applyDecision(status: "accepted" | "declined") {
    if (!selected || actingStatus) return;
    setActionError(null);
    setSuccess(null);
    setActingStatus(status);

    startTransition(async () => {
      try {
        const result = await updateJobApplicationStatus({
          applicationId: selected.id,
          status,
          note: decisionNote.trim() || undefined,
        });

        if (!result.ok) {
          setActionError(result.message);
          return;
        }

        const updated: JobApplicationItem = {
          ...selected,
          status: result.data.status,
          threadId: result.data.threadId ?? selected.threadId,
          statusNote: decisionNote.trim() || selected.statusNote,
        };
        setLocalUpdates((current) => ({ ...current, [updated.id]: updated }));
        setSelected(updated);
        setSuccess(result.message);
        setDecisionNote("");
      } catch {
        setActionError("Something went wrong.");
      } finally {
        setActingStatus(null);
      }
    });
  }

  const isBusy = pendingTransition || !!actingStatus;

  return (
    <>
      <section className="relative overflow-hidden rounded-2xl border border-sky-500/30 bg-sky-500/6 p-5 shadow-[0_26px_70px_-54px_rgba(2,132,199,0.45)] dark:border-sky-300/20 dark:bg-sky-400/8 sm:p-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-sky-500 dark:bg-sky-300" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/12 text-sky-700 ring-1 ring-sky-500/25 dark:bg-sky-400/12 dark:text-sky-300 dark:ring-sky-300/25">
              <UsersRound className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sky-700 dark:text-sky-300 font-jetbrains">
                Talent interest
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="mt-1 text-xl font-bold tracking-tight text-heading font-raleway sm:text-2xl">
                  Interested talent
                </h2>
                {counts.pending > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/35 bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-sky-700 dark:border-sky-300/30 dark:bg-sky-400/10 dark:text-sky-300 font-jetbrains">
                    {counts.pending} new
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-body font-raleway sm:text-sm">
                Review intros for this role. Messaging opens only after you
                shortlist a candidate.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[240px]">
            <CountPill label="Pending" value={counts.pending} />
            <CountPill label="Shortlisted" value={counts.accepted} />
            <CountPill label="Declined" value={counts.declined} />
          </div>
        </div>

        {sorted.length === 0 ? (
          <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-sky-500/30 bg-surface px-5 py-10 text-center dark:border-sky-300/20 dark:bg-page-alt">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-300">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-heading font-raleway">
                No interest yet
              </p>
              <p className="mt-1 max-w-sm text-xs leading-relaxed text-body font-raleway">
                When talent apply, their intro notes will appear here before any
                message thread is created.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-3">
            {sorted.map((item) => (
              <ApplicationRow
                key={item.id}
                item={item}
                onReview={() => openReview(item)}
              />
            ))}
          </div>
        )}
      </section>

      <AnimatePresence>
        {selected && (
          <>
            <motion.button
              type="button"
              aria-label="Close application review"
              className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
            />

            <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="job-application-review-title"
                drag={isMobile ? "y" : false}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.18 }}
                onDragEnd={onDragEnd}
                initial={
                  isMobile
                    ? { y: "100%" }
                    : { opacity: 0, y: 16, scale: 0.98 }
                }
                animate={
                  isMobile ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }
                }
                exit={
                  isMobile
                    ? { y: "100%" }
                    : { opacity: 0, y: 12, scale: 0.98 }
                }
                transition={{ type: "spring", stiffness: 360, damping: 34 }}
                className="relative max-h-[92dvh] w-full overflow-hidden rounded-t-3xl border-t border-edge bg-surface shadow-[0_-24px_80px_-20px_rgba(0,0,0,0.45)] sm:max-w-2xl sm:rounded-2xl sm:border sm:shadow-2xl"
              >
                <div className="flex justify-center pt-3 sm:hidden">
                  <span className="h-1 w-10 rounded-full bg-edge" />
                </div>

                <div className="flex items-start gap-3 border-b border-edge px-5 py-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-500/12 text-sky-700 ring-1 ring-sky-500/25 dark:bg-sky-400/12 dark:text-sky-300 dark:ring-sky-300/25">
                    <UserRoundCheck className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-sky-700 dark:text-sky-300 font-jetbrains">
                      Application review
                    </p>
                    <h3
                      id="job-application-review-title"
                      className="mt-1 truncate text-lg font-bold text-heading font-raleway"
                    >
                      {selected.fullName ?? "Interested talent"}
                    </h3>
                    <p className="mt-0.5 truncate text-xs text-body font-raleway">
                      {jobTitle}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    aria-label="Close"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-edge bg-page-alt text-body transition-colors hover:border-sky-500/40 hover:text-sky-700 dark:hover:border-sky-300/35 dark:hover:text-sky-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="max-h-[calc(92dvh-86px)] overflow-y-auto px-5 py-5">
                  <ReviewBody
                    selected={selected}
                    decisionNote={decisionNote}
                    setDecisionNote={setDecisionNote}
                    isBusy={isBusy}
                    actingStatus={actingStatus}
                    actionError={actionError}
                    success={success}
                    onDecline={() => applyDecision("declined")}
                    onShortlist={() => applyDecision("accepted")}
                  />
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function CountPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-sky-500/20 bg-surface px-3 py-2 dark:border-sky-300/15 dark:bg-page-alt">
      <p className="text-base font-bold text-heading font-raleway">{value}</p>
      <p className="mt-0.5 truncate text-[10px] uppercase tracking-[0.08em] text-sky-700/70 dark:text-sky-300/75 font-jetbrains">
        {label}
      </p>
    </div>
  );
}

function ApplicationRow({
  item,
  onReview,
}: {
  item: JobApplicationItem;
  onReview: () => void;
}) {
  const badge = statusBadge(item.status);
  const Icon = badge.icon;

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border bg-surface p-4 transition-all dark:bg-page-alt sm:flex-row sm:items-start",
        item.status === "pending"
          ? "border-sky-500/35 shadow-[0_18px_44px_-36px_rgba(2,132,199,0.55)] dark:border-sky-300/25"
          : "border-edge hover:border-sky-500/25 dark:hover:border-sky-300/20"
      )}
    >
      <div className="flex min-w-0 flex-1 gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-500/12 text-sm font-bold text-sky-700 ring-1 ring-sky-500/25 dark:bg-sky-400/12 dark:text-sky-300 dark:ring-sky-300/25 font-jetbrains">
          {initials(item.fullName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-heading font-raleway">
              {item.fullName ?? "Anonymous talent"}
            </p>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] font-jetbrains",
                badge.cls
              )}
            >
              <Icon className="h-3 w-3" />
              {badge.label}
            </span>
          </div>
          <p className="mt-1 line-clamp-1 text-xs text-body font-raleway">
            {item.headline ?? "Approved Veloraa talent"}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-subtle font-raleway">
            {item.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3 text-sky-700 dark:text-sky-300" />
                {item.location}
              </span>
            )}
            <span>{formatDate(item.createdAt)}</span>
          </div>
          <p className="mt-3 rounded-xl border border-edge bg-surface px-3 py-2 text-xs leading-relaxed text-body font-raleway">
            {preview(item.introNote)}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
        {item.overallScore != null && (
          <div className="rounded-xl border border-accent/25 bg-accent/8 px-3 py-1.5 text-left sm:text-right">
            <p className="text-[10px] uppercase tracking-[0.1em] text-accent font-jetbrains">
              Score
            </p>
            <p className="text-lg font-bold text-heading font-raleway">
              {item.overallScore}
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={onReview}
          className={cn(
            "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all font-raleway",
            item.status === "pending"
              ? "bg-sky-600 text-white hover:bg-sky-700 dark:bg-sky-400 dark:text-[#061509] dark:hover:bg-sky-300"
              : "border border-edge bg-surface text-heading hover:border-sky-500/30 hover:text-sky-700 dark:hover:border-sky-300/30 dark:hover:text-sky-300"
          )}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Review
        </button>
        {item.status === "accepted" && item.threadId && (
          <Link
            href={`/company/messages?thread=${item.threadId}`}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-edge bg-surface px-3 py-2 text-xs font-semibold text-heading transition-colors hover:border-accent/30 hover:text-accent font-raleway"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Messages
          </Link>
        )}
      </div>
    </div>
  );
}

function ReviewBody({
  selected,
  decisionNote,
  setDecisionNote,
  isBusy,
  actingStatus,
  actionError,
  success,
  onDecline,
  onShortlist,
}: {
  selected: JobApplicationItem;
  decisionNote: string;
  setDecisionNote: (value: string) => void;
  isBusy: boolean;
  actingStatus: "accepted" | "declined" | null;
  actionError: string | null;
  success: string | null;
  onDecline: () => void;
  onShortlist: () => void;
}) {
  const badge = statusBadge(selected.status);
  const Icon = badge.icon;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-sky-500/25 bg-sky-500/6 p-4 dark:border-sky-300/20 dark:bg-sky-400/8 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky-500/12 text-base font-bold text-sky-700 ring-1 ring-sky-500/25 dark:bg-sky-400/12 dark:text-sky-300 dark:ring-sky-300/25 font-jetbrains">
            {initials(selected.fullName)}
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-heading font-raleway">
              {selected.fullName ?? "Anonymous talent"}
            </p>
            <p className="mt-1 text-sm text-body font-raleway">
              {selected.headline ?? "Approved Veloraa talent"}
            </p>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-subtle font-raleway">
              {selected.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-sky-700 dark:text-sky-300" />
                  {selected.location}
                </span>
              )}
              <span>Sent {formatDate(selected.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-end">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] font-jetbrains",
              badge.cls
            )}
          >
            <Icon className="h-3 w-3" />
            {badge.label}
          </span>
          {selected.overallScore != null && (
            <span className="rounded-xl border border-sky-500/25 bg-sky-500/8 px-3 py-1.5 text-xs font-semibold text-heading dark:border-sky-300/20 dark:bg-sky-400/10 font-raleway">
              Score {selected.overallScore}
              {selected.expertiseLevel ? ` - ${selected.expertiseLevel}` : ""}
            </span>
          )}
        </div>
      </div>

      {selected.skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.skills.slice(0, 10).map((skill) => (
            <span
              key={skill}
              className="rounded-full border border-edge bg-page-alt px-3 py-1 text-xs font-medium text-heading font-raleway"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-edge bg-page-alt p-4">
        <p className="text-[10px] uppercase tracking-[0.14em] text-subtle font-jetbrains">
          Introduction note
        </p>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-heading font-raleway">
          {selected.introNote}
        </p>
      </div>

      {selected.status === "pending" && (
        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.14em] text-subtle font-jetbrains">
            Decision note optional
          </span>
          <textarea
            value={decisionNote}
            onChange={(event) => setDecisionNote(event.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Add context for the candidate. A shortlist note becomes the first message; a decline note is sent as an update."
            className="mt-2 w-full resize-none rounded-2xl border border-edge bg-page-alt px-4 py-3 text-sm leading-relaxed text-heading placeholder:text-subtle transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 font-raleway"
          />
        </label>
      )}

      {success && (
        <p className="rounded-xl border border-accent/25 bg-accent/8 px-3 py-2 text-xs font-semibold text-accent font-raleway">
          {success}
        </p>
      )}
      {actionError && (
        <p className="rounded-xl border border-red-500/25 bg-red-500/5 px-3 py-2 text-xs font-semibold text-red-500 font-raleway">
          {actionError}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 border-t border-edge pt-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={`/company/talent/${selected.talentUserId}`}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-edge bg-page-alt px-4 py-2.5 text-sm font-semibold text-heading transition-colors hover:border-sky-500/40 hover:text-sky-700 dark:hover:border-sky-300/35 dark:hover:text-sky-300 font-raleway"
        >
          <ExternalLink className="h-4 w-4" />
          View profile
        </Link>

        {selected.status === "pending" ? (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={isBusy}
              onClick={onDecline}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-2.5 text-sm font-semibold text-red-500 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-55 font-raleway"
            >
              {actingStatus === "declined" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              Decline
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={onShortlist}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-55 font-raleway"
            >
              {actingStatus === "accepted" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Shortlist and message
            </button>
          </div>
        ) : selected.status === "accepted" && selected.threadId ? (
          <Link
            href={`/company/messages?thread=${selected.threadId}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 font-raleway"
          >
            <MessageSquare className="h-4 w-4" />
            Open messages
          </Link>
        ) : (
          <span className="rounded-xl border border-edge bg-page-alt px-4 py-2.5 text-sm font-semibold text-body font-raleway">
            Decision recorded
          </span>
        )}
      </div>
    </div>
  );
}
