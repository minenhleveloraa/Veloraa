"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Briefcase,
  ChevronDown,
  Clock,
  ExternalLink,
  MapPin,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Recent-jobs feed.
 *
 * A vertical list of recent company_jobs rows. Each row collapses to its
 * title + status pill + meta. Tapping the chevron expands an inline
 * description, plus location/seniority/posted-at meta. The first row
 * starts expanded so the card has a confident, populated feel above the
 * fold.
 */

export type JobsFeedItem = {
  id: string;
  title: string;
  status: JobStatus;
  roleCategory: string | null;
  seniority: string | null;
  employmentType: string | null;
  workArrangement: string | null;
  location: string | null;
  description: string | null;
  createdAt: string;
};

type JobStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "published";

interface JobsFeedProps {
  jobs: JobsFeedItem[];
}

export default function JobsFeed({ jobs }: JobsFeedProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    jobs[0]?.id ?? null
  );

  return (
    <section className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-edge bg-surface p-5 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.25)] sm:p-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-heading sm:text-xl font-raleway">
            Your recent jobs
          </h2>
          <p className="mt-0.5 text-[11px] text-subtle font-jetbrains">
            Most recent first
          </p>
        </div>
        <Link
          href="/company/jobs"
          className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold text-accent transition-colors hover:bg-accent/10 font-raleway"
        >
          See all jobs
        </Link>
      </header>

      <div className="mt-4 flex-1 space-y-2 overflow-y-auto">
        {jobs.length === 0 ? (
          <EmptyJobsState />
        ) : (
          jobs.map((job) => (
            <JobRow
              key={job.id}
              job={job}
              expanded={expandedId === job.id}
              onToggle={() =>
                setExpandedId((cur) => (cur === job.id ? null : job.id))
              }
            />
          ))
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Row
// ─────────────────────────────────────────────────────────────────────

function JobRow({
  job,
  expanded,
  onToggle,
}: {
  job: JobsFeedItem;
  expanded: boolean;
  onToggle: () => void;
}) {
  const accent = jobAccentFor(job.title, job.roleCategory);

  return (
    <article
      className={cn(
        "rounded-2xl border bg-page-alt transition-colors",
        expanded
          ? "border-accent/30"
          : "border-edge hover:border-accent/20"
      )}
    >
      {/* Collapsed header — always visible */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={`job-${job.id}-body`}
        className="flex w-full items-center gap-3 px-3 py-3 text-left sm:gap-4 sm:px-4"
      >
        {/* Squircle icon */}
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm",
            accent.bg
          )}
          aria-hidden
        >
          <Briefcase className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="truncate text-sm font-semibold text-heading font-raleway">
              {job.title}
            </p>
            <StatusPill status={job.status} />
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-subtle font-jetbrains">
            {job.seniority && <span>{labelize(job.seniority)}</span>}
            {job.employmentType && (
              <>
                <span aria-hidden>·</span>
                <span>{labelize(job.employmentType)}</span>
              </>
            )}
            {job.workArrangement && (
              <>
                <span aria-hidden>·</span>
                <span>{labelize(job.workArrangement)}</span>
              </>
            )}
          </div>
        </div>

        <motion.span
          aria-hidden
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-edge bg-surface text-subtle"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </motion.span>
      </button>

      {/* Expanded body */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="body"
            id={`job-${job.id}-body`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-edge px-3 py-3 sm:px-4">
              {/* Pills row — work style / location */}
              <div className="mb-2 flex flex-wrap gap-1.5">
                {job.workArrangement && (
                  <Tag>{labelize(job.workArrangement)}</Tag>
                )}
                {job.employmentType && (
                  <Tag>{labelize(job.employmentType)}</Tag>
                )}
              </div>

              {/* Description preview */}
              {job.description ? (
                <p className="text-xs leading-relaxed text-body sm:text-[13px] font-raleway">
                  {truncate(job.description, 220)}
                </p>
              ) : (
                <p className="text-xs italic text-subtle font-libre">
                  No description on file yet.
                </p>
              )}

              {/* Footer meta */}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-subtle font-jetbrains">
                {job.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {job.location}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeAgo(job.createdAt)}
                </span>
                <Link
                  href={`/company/jobs/${job.id}`}
                  className="ml-auto inline-flex items-center gap-1 text-accent transition-opacity hover:opacity-80"
                >
                  Open
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────

function EmptyJobsState() {
  return (
    <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-edge bg-page-alt px-6 py-10 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-pill-bg text-accent">
        <Briefcase className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm font-semibold text-heading font-raleway">
        No jobs yet
      </p>
      <p className="mt-1 max-w-[18rem] text-[11px] text-body font-raleway">
        Post your first role to get a curated shortlist within 48 hours.
      </p>
      <Link
        href="/company/jobs/new"
        className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-[11px] font-semibold text-white transition-opacity hover:opacity-90 font-raleway"
      >
        <Plus className="h-3 w-3" strokeWidth={3} />
        Post a job
      </Link>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Status pill
// ─────────────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: JobStatus }) {
  const map: Record<
    JobStatus,
    { label: string; cls: string }
  > = {
    published: {
      label: "Live",
      cls: "border-accent/40 bg-accent/10 text-accent",
    },
    approved: {
      label: "Approved",
      cls: "border-accent/40 bg-accent/10 text-accent",
    },
    pending_review: {
      label: "In review",
      cls: "border-amber-500/40 bg-amber-500/10 text-amber-600",
    },
    draft: {
      label: "Draft",
      cls: "border-edge bg-surface text-subtle",
    },
    rejected: {
      label: "Closed",
      cls: "border-red-500/30 bg-red-500/10 text-red-500",
    },
  };
  const meta = map[status];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] font-jetbrains",
        meta.cls
      )}
    >
      {meta.label}
    </span>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-edge bg-surface px-2 py-0.5 text-[10px] font-medium text-body font-jetbrains">
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

const ACCENT_PALETTE = [
  { bg: "bg-[#16A34A]" }, // mid-green
  { bg: "bg-[#0A2E1A]" }, // dark-green
  { bg: "bg-[#4ADE80]" }, // bright-green (text-page friendly)
  { bg: "bg-[#B8B09A]" }, // muted-beige
];

function jobAccentFor(
  title: string,
  category: string | null | undefined
): { bg: string } {
  const seed = `${title}|${category ?? ""}`;
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return ACCENT_PALETTE[h % ACCENT_PALETTE.length];
}

function labelize(value: string): string {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function truncate(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trimEnd()}…`;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms) || ms < 0) return "just now";
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  const yr = Math.floor(day / 365);
  return `${yr}y ago`;
}
