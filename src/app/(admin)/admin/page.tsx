import Link from "next/link";
import {
  ArrowUpRight,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  CompanyApplication,
  CompanyJob,
  ReviewStatus,
  TalentAiAnalysis,
  TalentApplication,
} from "@/lib/types/db";
import { labelFor, COMPANY_SIZES } from "@/lib/company/options";
import LiveAdminQueue from "@/components/realtime/LiveAdminQueue";

type ApplicantType = "talent" | "company" | "jobs";
type StatusFilter = "pending" | "approved" | "rejected" | "all";

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "pending", label: "Awaiting review" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

function parseStatus(raw: string | string[] | undefined): StatusFilter {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === "approved" || v === "rejected" || v === "all") return v;
  return "pending";
}
function parseType(raw: string | string[] | undefined): ApplicantType {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === "company") return "company";
  if (v === "jobs") return "jobs";
  return "talent";
}

// Row shape the table expects — same fields for both kinds.
interface Row {
  user_id: string;
  id?: string; // for jobs, this is the job id
  title: string;       // candidate name OR company legal name OR job title
  subtitle: string;    // role/location OR size/industry OR company name
  submitted_at: string | null;
  review_status: ReviewStatus;
  meta: string | null; // AI score (talent) OR plan (company) OR seniority (jobs)
  metaSub: string | null;
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[]; type?: string | string[] }>;
}) {
  const { status: statusRaw, type: typeRaw } = await searchParams;
  const status = parseStatus(statusRaw);
  const type = parseType(typeRaw);

  const admin = createAdminClient();

  // --------------------------------------------------------
  // Combined counts — pulls the bare minimum from both tables.
  // --------------------------------------------------------
  const [talentAllRes, companyAllRes, jobsAllRes] = await Promise.all([
    admin
      .from("talent_applications")
      .select("review_status, stage_1_submitted_at"),
    admin
      .from("company_applications")
      .select("review_status, stage_1_submitted_at"),
    admin
      .from("company_jobs")
      .select("status"),
  ]);

  const talentRows =
    (talentAllRes.data as {
      review_status: ReviewStatus;
      stage_1_submitted_at: string | null;
    }[]) ?? [];
  const companyRows =
    (companyAllRes.data as {
      review_status: ReviewStatus;
      stage_1_submitted_at: string | null;
    }[]) ?? [];
  const jobsRows =
    (jobsAllRes.data as { status: string }[]) ?? [];

  const counts = {
    talent: {
      pending: talentRows.filter(
        (r) => (r.review_status === "pending" || r.review_status === "pending_update") && r.stage_1_submitted_at
      ).length,
      approved: talentRows.filter((r) => r.review_status === "approved").length,
      rejected: talentRows.filter((r) => r.review_status === "rejected").length,
      total: talentRows.filter((r) => r.stage_1_submitted_at).length,
    },
    company: {
      pending: companyRows.filter(
        (r) => r.review_status === "pending" && r.stage_1_submitted_at
      ).length,
      approved: companyRows.filter((r) => r.review_status === "approved").length,
      rejected: companyRows.filter((r) => r.review_status === "rejected").length,
      total: companyRows.filter((r) => r.stage_1_submitted_at).length,
    },
    jobs: {
      pending: jobsRows.filter((r) => r.status === "pending_review").length,
      approved: jobsRows.filter((r) => r.status === "published").length,
      rejected: jobsRows.filter((r) => r.status === "rejected").length,
      total: jobsRows.length,
    },
  };

  // --------------------------------------------------------
  // Pull rows for the active tab + filter
  // --------------------------------------------------------
  const rows: Row[] =
    type === "talent"
      ? await fetchTalentRows(admin, status)
      : type === "company"
      ? await fetchCompanyRows(admin, status)
      : await fetchJobRows(admin, status);

  const activeCounts = counts[type];

  // Determine labels based on type
  const typeLabels = {
    talent: {
      heading: "Talent review",
      description: "Applications that have completed AI analysis, awaiting a human call.",
      totalLabel: "Total applicants",
    },
    company: {
      heading: "Company review",
      description: "Companies that have completed onboarding, awaiting approval to post jobs.",
      totalLabel: "Total companies",
    },
    jobs: {
      heading: "Job postings",
      description: "Job postings from approved companies, awaiting review before going public.",
      totalLabel: "Total job posts",
    },
  }[type];

  return (
    <LiveAdminQueue>
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <span className="mb-2 inline-block text-[11px] uppercase tracking-[0.08em] text-accent font-jetbrains">
          Admin · {typeLabels.heading}
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-heading sm:text-4xl font-raleway">
          Review queue
        </h1>
        <p className="mt-2 text-sm text-body font-raleway">
          {typeLabels.description}
        </p>
      </div>

      {/* Top-level type tabs */}
      <div className="mb-6 inline-flex rounded-2xl border border-edge bg-surface p-1">
        <TypeTab
          active={type === "talent"}
          href="/admin?type=talent"
          icon={<Users className="h-3.5 w-3.5" />}
          label="Talent"
          badge={counts.talent.pending}
        />
        <TypeTab
          active={type === "company"}
          href="/admin?type=company"
          icon={<Building2 className="h-3.5 w-3.5" />}
          label="Companies"
          badge={counts.company.pending}
        />
        <TypeTab
          active={type === "jobs"}
          href="/admin?type=jobs"
          icon={<Briefcase className="h-3.5 w-3.5" />}
          label="Jobs"
          badge={counts.jobs.pending}
        />
      </div>

      {/* Stats for the active type */}
      <div className="mb-8 grid gap-3 sm:grid-cols-4">
        <StatCard
          label="Awaiting review"
          value={activeCounts.pending}
          icon={<Clock className="h-4 w-4" />}
          tone="amber"
        />
        <StatCard
          label={type === "jobs" ? "Published" : "Approved"}
          value={activeCounts.approved}
          icon={<CheckCircle2 className="h-4 w-4" />}
          tone="accent"
        />
        <StatCard
          label="Rejected"
          value={activeCounts.rejected}
          icon={<XCircle className="h-4 w-4" />}
          tone="red"
        />
        <StatCard
          label={typeLabels.totalLabel}
          value={activeCounts.total}
          icon={<TrendingUp className="h-4 w-4" />}
          tone="neutral"
        />
      </div>

      {/* Status filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => {
          const active = f.key === status;
          const href =
            f.key === "pending"
              ? `/admin?type=${type}`
              : `/admin?type=${type}&status=${f.key}`;
          return (
            <Link
              key={f.key}
              href={href}
              className={`inline-flex items-center rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors font-raleway ${
                active
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-edge bg-surface text-body hover:text-heading"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <EmptyState type={type} status={status} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-edge bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-edge bg-page-alt text-[11px] uppercase tracking-[0.08em] text-subtle font-jetbrains">
              <tr>
                <th className="px-5 py-3 font-medium">
                  {type === "talent" ? "Candidate" : type === "company" ? "Company" : "Job posting"}
                </th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">
                  {type === "talent" ? "AI score" : type === "company" ? "Plan" : "Seniority"}
                </th>
                <th className="hidden px-5 py-3 font-medium lg:table-cell">
                  {type === "talent" ? "Level" : type === "company" ? "Size" : "Company"}
                </th>
                <th className="hidden px-5 py-3 font-medium lg:table-cell">
                  Submitted
                </th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id ?? r.user_id}
                  className="border-b border-edge last:border-b-0 hover:bg-page-alt"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pill-bg text-accent text-xs font-bold font-jetbrains">
                        {initials(r.title)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-heading font-raleway">
                          {r.title}
                        </p>
                        <p className="truncate text-xs text-subtle font-raleway">
                          {r.subtitle}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-5 py-4 md:table-cell">
                    {r.meta ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-bold text-heading font-jetbrains">
                        {type === "talent" && (
                          <Sparkles className="h-3.5 w-3.5 text-accent" />
                        )}
                        {r.meta}
                      </span>
                    ) : (
                      <span className="text-xs text-subtle font-jetbrains">
                        —
                      </span>
                    )}
                  </td>
                  <td className="hidden px-5 py-4 text-sm text-body lg:table-cell font-raleway">
                    {r.metaSub ?? "—"}
                  </td>
                  <td className="hidden px-5 py-4 text-xs text-subtle lg:table-cell font-jetbrains">
                    {r.submitted_at
                      ? new Date(r.submitted_at).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={r.review_status} type={type} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={
                        type === "jobs"
                          ? `/admin/jobs/${r.id}`
                          : `/admin/${type}/${r.user_id}`
                      }
                      className="inline-flex items-center gap-1 rounded-lg bg-btn-bg px-3 py-1.5 text-xs font-semibold text-btn-fg transition-opacity hover:opacity-90 font-raleway"
                    >
                      Review
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </LiveAdminQueue>
  );
}

// =====================================================================
// Row fetchers
// =====================================================================

type AdminDb = ReturnType<typeof createAdminClient>;

async function fetchTalentRows(
  admin: AdminDb,
  status: StatusFilter
): Promise<Row[]> {
  const q = admin
    .from("talent_applications")
    .select(
      "user_id, headline, location, years_experience, stage_1_submitted_at, review_status"
    )
    .not("stage_1_submitted_at", "is", null)
    .order("stage_1_submitted_at", { ascending: false })
    .limit(50);
  if (status !== "all") {
    if (status === "pending") {
      q.in("review_status", ["pending", "pending_update"]);
    } else {
      q.eq("review_status", status);
    }
  }

  const { data } = await q;
  const apps = (data as Partial<TalentApplication>[]) ?? [];
  const ids = apps.map((a) => a.user_id!).filter(Boolean);

  const [profilesRes, analysesRes] = await Promise.all([
    ids.length
      ? admin.from("profiles").select("id, full_name, email").in("id", ids)
      : Promise.resolve({
          data: [] as { id: string; full_name: string | null; email: string | null }[],
        }),
    ids.length
      ? admin
          .from("talent_ai_analyses")
          .select("user_id, overall_score, expertise_level")
          .in("user_id", ids)
      : Promise.resolve({
          data: [] as Pick<
            TalentAiAnalysis,
            "user_id" | "overall_score" | "expertise_level"
          >[],
        }),
  ]);

  const profileMap = new Map(
    (profilesRes.data ?? []).map((p) => [p.id as string, p])
  );
  const analysisMap = new Map(
    (analysesRes.data ?? []).map((a) => [a.user_id as string, a])
  );

  return apps.map<Row>((a) => {
    const p = profileMap.get(a.user_id!);
    const an = analysisMap.get(a.user_id!);
    return {
      user_id: a.user_id!,
      title: p?.full_name ?? p?.email ?? "Unknown",
      subtitle: `${a.headline ?? "—"} · ${a.years_experience ?? "—"}y · ${a.location ?? "—"}`,
      submitted_at: a.stage_1_submitted_at ?? null,
      review_status: (a.review_status as ReviewStatus) ?? "pending",
      meta: an?.overall_score != null ? String(an.overall_score) : null,
      metaSub: an?.expertise_level ?? null,
    };
  });
}

async function fetchCompanyRows(
  admin: AdminDb,
  status: StatusFilter
): Promise<Row[]> {
  const q = admin
    .from("company_applications")
    .select(
      "user_id, legal_name, website_url, company_size, hq_country, industries, selected_plan, stage_1_submitted_at, review_status"
    )
    .not("stage_1_submitted_at", "is", null)
    .order("stage_1_submitted_at", { ascending: false })
    .limit(50);
  if (status !== "all") q.eq("review_status", status);

  const { data } = await q;
  const apps = (data as Partial<CompanyApplication>[]) ?? [];

  return apps.map<Row>((a) => {
    const industries = (a.industries ?? []).slice(0, 2).join(", ");
    const plan = a.selected_plan ? a.selected_plan.toUpperCase() : null;
    return {
      user_id: a.user_id!,
      title: a.legal_name ?? "Unnamed company",
      subtitle: `${industries || "—"} · ${a.hq_country ?? "—"}`,
      submitted_at: a.stage_1_submitted_at ?? null,
      review_status: (a.review_status as ReviewStatus) ?? "pending",
      meta: plan,
      metaSub: labelFor(COMPANY_SIZES, a.company_size ?? null),
    };
  });
}

async function fetchJobRows(
  admin: AdminDb,
  status: StatusFilter
): Promise<Row[]> {
  // Map our status filter to the company_jobs status column
  const statusMap: Record<StatusFilter, string | null> = {
    pending: "pending_review",
    approved: "published",
    rejected: "rejected",
    all: null,
  };

  const q = admin
    .from("company_jobs")
    .select(
      "id, company_id, title, role_category, seniority, work_arrangement, location, status, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  const mappedStatus = statusMap[status];
  if (mappedStatus) q.eq("status", mappedStatus);

  const { data } = await q;
  const jobs = (data as Partial<CompanyJob>[]) ?? [];

  // Fetch company names for all unique company_ids
  const companyIds = [...new Set(jobs.map((j) => j.company_id!).filter(Boolean))];
  const companyMap = new Map<string, string>();
  if (companyIds.length > 0) {
    const { data: companies } = await admin
      .from("company_applications")
      .select("user_id, legal_name")
      .in("user_id", companyIds);
    for (const c of (companies ?? []) as { user_id: string; legal_name: string | null }[]) {
      companyMap.set(c.user_id, c.legal_name ?? "Unknown");
    }
  }

  // Map job status to ReviewStatus for the badge
  function jobStatusToReview(s: string): ReviewStatus {
    if (s === "pending_review") return "pending";
    if (s === "published" || s === "approved") return "approved";
    if (s === "rejected") return "rejected";
    return "pending";
  }

  return jobs.map<Row>((j) => ({
    user_id: j.company_id!,
    id: j.id!,
    title: j.title ?? "Untitled",
    subtitle: `${companyMap.get(j.company_id!) ?? "Unknown"} · ${j.work_arrangement ?? "—"} · ${j.location ?? "—"}`,
    submitted_at: j.created_at ?? null,
    review_status: jobStatusToReview(j.status ?? "pending_review"),
    meta: j.seniority ?? null,
    metaSub: companyMap.get(j.company_id!) ?? null,
  }));
}

// =====================================================================
// UI bits
// =====================================================================

function TypeTab({
  active,
  href,
  icon,
  label,
  badge,
}: {
  active: boolean;
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={`relative inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all font-raleway ${
        active
          ? "bg-accent text-white shadow-[0_4px_14px_rgba(74,222,128,0.25)]"
          : "text-body hover:text-heading"
      }`}
    >
      {icon}
      {label}
      {badge != null && badge > 0 && (
        <span
          className={`ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold font-jetbrains ${
            active ? "bg-white text-accent" : "bg-amber-500/15 text-amber-600"
          }`}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: "accent" | "amber" | "red" | "neutral";
}) {
  const iconTone = {
    accent: "bg-accent/10 text-accent",
    amber: "bg-amber-500/10 text-amber-500",
    red: "bg-red-500/10 text-red-500",
    neutral: "bg-pill-bg text-body",
  }[tone];
  return (
    <div className="rounded-2xl border border-edge bg-surface p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.08em] text-subtle font-jetbrains">
          {label}
        </p>
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full ${iconTone}`}
        >
          {icon}
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold text-heading font-raleway">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status, type }: { status: ReviewStatus; type: ApplicantType }) {
  const cfg = {
    pending: {
      label: "Awaiting review",
      className: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    },
    pending_update: {
      label: "Update review",
      className: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    },
    approved: {
      label: type === "jobs" ? "Published" : "Approved",
      className: "bg-accent/10 text-accent border-accent/30",
    },
    rejected: {
      label: "Rejected",
      className: "bg-red-500/10 text-red-500 border-red-500/30",
    },
    hidden: {
      label: "Hidden",
      className: "bg-edge/10 text-body border-edge/30",
    },
  }[status] || {
    label: status,
    className: "bg-edge/10 text-body border-edge/30",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.08em] font-jetbrains ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

function EmptyState({
  type,
  status,
}: {
  type: ApplicantType;
  status: StatusFilter;
}) {
  const label = type === "talent" ? "applications" : type === "company" ? "companies" : "job postings";
  const copy = {
    pending: {
      title: "Inbox zero.",
      sub: `No ${label} are waiting for review right now.`,
    },
    approved: {
      title: type === "jobs" ? "No published jobs yet." : "No approvals yet.",
      sub: `Decisions will show up here.`,
    },
    rejected: {
      title: "No rejections.",
      sub: `Keep the standard high.`,
    },
    all: { title: `No ${label} yet.`, sub: "Hang tight." },
  }[status];
  return (
    <div className="rounded-2xl border border-dashed border-edge bg-surface p-16 text-center">
      <p className="text-lg font-semibold text-heading font-raleway">
        {copy.title}
      </p>
      <p className="mt-1 text-sm text-body font-raleway">{copy.sub}</p>
    </div>
  );
}

function initials(full: string): string {
  const src = (full ?? "?").trim();
  const parts = src.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}
