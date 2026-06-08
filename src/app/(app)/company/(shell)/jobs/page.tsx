import Link from "next/link";
import {
  ArrowUpRight,
  Briefcase,
  Clock,
  CheckCircle2,
  Filter,
  Plus,
  Search,
  UsersRound,
  XCircle,
} from "lucide-react";
import { requireApprovedCompany } from "@/lib/company/guard";
import { planFor } from "@/lib/company/options";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { CompanyJob, JobApplicationStatus, JobStatus } from "@/lib/types/db";

type JobApplicationCounts = {
  total: number;
  pending: number;
  accepted: number;
  declined: number;
};

const emptyApplicationCounts: JobApplicationCounts = {
  total: 0,
  pending: 0,
  accepted: 0,
  declined: 0,
};

export default async function CompanyJobsPage() {
  const { profile, application } = await requireApprovedCompany();
  const planName = planFor(application?.selected_plan)?.name ?? "Free";

  // Fetch real jobs from company_jobs
  const supabase = await createClient();
  const { data: jobRows } = await supabase
    .from("company_jobs")
    .select("*")
    .eq("company_id", profile.id)
    .order("created_at", { ascending: false });

  const jobs = (jobRows as CompanyJob[] | null) ?? [];
  const applicationCounts = new Map<string, JobApplicationCounts>();

  if (jobs.length > 0) {
    const admin = createAdminClient();
    const { data: applicationRows } = await admin
      .from("job_applications")
      .select("job_id, status")
      .eq("company_user_id", profile.id)
      .in(
        "job_id",
        jobs.map((job) => job.id)
      );

    for (const row of (applicationRows ?? []) as {
      job_id: string;
      status: JobApplicationStatus;
    }[]) {
      const current = applicationCounts.get(row.job_id) ?? {
        ...emptyApplicationCounts,
      };
      current.total += 1;
      if (row.status === "pending") current.pending += 1;
      if (row.status === "accepted") current.accepted += 1;
      if (row.status === "declined") current.declined += 1;
      applicationCounts.set(row.job_id, current);
    }
  }

  // Count active (non-rejected) jobs for quota display
  const activeJobCount = jobs.filter((j) => j.status !== "rejected").length;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 sm:px-6 lg:px-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="mb-2 inline-block text-[11px] uppercase tracking-[0.08em] text-accent font-jetbrains">
            Jobs
          </span>
          <h1 className="text-3xl font-bold text-heading font-raleway">
            Your job postings
          </h1>
          <p className="mt-2 max-w-xl text-sm text-body font-raleway">
            Post a role, track applicants, and manage hiring pipelines from
            one place.
          </p>
        </div>
        <Link
          href="/company/jobs/new"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-xs font-semibold text-white transition-all hover:opacity-90 hover:shadow-[0_0_24px_rgba(74,222,128,0.35)] font-raleway"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={3} />
          Post a job
        </Link>
      </div>

      {/* Quota indicator */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-edge bg-surface px-5 py-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.1em] text-subtle font-jetbrains">
            Posting quota
          </p>
          <p className="mt-1 text-sm font-semibold text-heading font-raleway">
            {planName === "Free"
              ? `${activeJobCount} / 1 post used`
              : "Unlimited posts available"}
          </p>
        </div>
        {planName === "Free" && (
          <Link
            href="/company/subscription"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent transition-opacity hover:opacity-80 font-raleway"
          >
            Upgrade
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {/* Search + filters (non-functional placeholder) */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
          <input
            type="text"
            disabled
            placeholder="Search your jobs…"
            className="w-full rounded-lg border border-edge bg-surface py-2.5 pl-10 pr-4 text-sm text-heading placeholder:text-subtle focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-60 font-raleway"
          />
        </label>
        <button
          type="button"
          disabled
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-edge bg-surface px-4 py-2.5 text-xs font-semibold text-heading transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60 font-raleway"
        >
          <Filter className="h-3.5 w-3.5" />
          All statuses
        </button>
      </div>

      {/* List / empty state */}
      <div className="mt-8">
        {jobs.length === 0 ? (
          <EmptyJobs />
        ) : (
          <ul className="divide-y divide-edge overflow-hidden rounded-2xl border border-edge bg-surface">
            {jobs.map((j) => (
              <JobRow
                key={j.id}
                job={j}
                counts={applicationCounts.get(j.id) ?? emptyApplicationCounts}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function EmptyJobs() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-edge bg-surface px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-pill-bg text-accent">
        <Briefcase className="h-6 w-6" />
      </div>
      <div className="max-w-sm">
        <h2 className="text-lg font-semibold text-heading font-raleway">
          No jobs yet
        </h2>
        <p className="mt-1 text-sm text-body font-raleway">
          Post your first role and Veloraa will send a curated shortlist of
          pre-vetted candidates within 48 hours.
        </p>
      </div>
      <Link
        href="/company/jobs/new"
        className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 font-raleway"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={3} />
        Post your first job
      </Link>
    </div>
  );
}

function JobRow({
  job,
  counts,
}: {
  job: CompanyJob;
  counts: JobApplicationCounts;
}) {
  const statusConfig: Record<
    JobStatus,
    { label: string; cls: string; icon: React.ReactNode }
  > = {
    draft: {
      label: "Draft",
      cls: "border-edge bg-page-alt text-body",
      icon: <Clock className="h-3 w-3" />,
    },
    pending_review: {
      label: "Pending review",
      cls: "border-amber-500/40 bg-amber-500/10 text-amber-600",
      icon: <Clock className="h-3 w-3" />,
    },
    approved: {
      label: "Approved",
      cls: "border-accent/40 bg-accent/10 text-accent",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    published: {
      label: "Published",
      cls: "border-accent/40 bg-accent/10 text-accent",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    rejected: {
      label: "Rejected",
      cls: "border-red-500/40 bg-red-500/10 text-red-500",
      icon: <XCircle className="h-3 w-3" />,
    },
  };

  const cfg = statusConfig[job.status] ?? statusConfig.draft;
  const isClickable = job.status === "published" || job.status === "approved";

  const inner = (
    <li className={`flex flex-col gap-3 p-5 transition-colors hover:bg-page-alt/50 sm:flex-row sm:items-center sm:justify-between ${isClickable ? "cursor-pointer" : ""}`}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-heading font-raleway">
            {job.title}
          </p>
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] font-jetbrains ${cfg.cls}`}
          >
            {cfg.icon}
            {cfg.label}
          </span>
          {counts.pending > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/35 bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-sky-700 dark:border-sky-300/30 dark:bg-sky-400/10 dark:text-sky-300 font-jetbrains">
              <UsersRound className="h-3 w-3" />
              {counts.pending} new
            </span>
          )}
        </div>
        <p className="mt-1 truncate text-xs text-body font-raleway">
          {job.location || job.work_arrangement} · {job.seniority} · {job.role_category}
        </p>
      </div>
      <div className="flex items-center gap-4 text-xs text-body font-raleway">
        {counts.total > 0 && (
          <span className="hidden items-center gap-1 text-[11px] font-semibold text-heading sm:inline-flex">
            <UsersRound className="h-3.5 w-3.5 text-sky-700 dark:text-sky-300" />
            {counts.total} interested
          </span>
        )}
        <span className="text-[11px] text-subtle font-jetbrains">
          {new Date(job.created_at).toLocaleDateString()}
        </span>
        {job.status === "rejected" && job.review_reason && (
          <span
            className="max-w-[200px] truncate text-[11px] text-red-500 font-raleway"
            title={job.review_reason}
          >
            {job.review_reason}
          </span>
        )}
        {isClickable && (
          <ArrowUpRight className="h-3.5 w-3.5 text-accent shrink-0" />
        )}
      </div>
    </li>
  );

  if (isClickable) {
    return <Link href={`/company/jobs/${job.id}`}>{inner}</Link>;
  }
  return inner;
}
