import Link from "next/link";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Globe2,
  MapPin,
  DollarSign,
  Code2,
  FileText,
  Gift,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CompanyJob, JobStatus } from "@/lib/types/db";
import { ApproveButton, RejectButton } from "@/components/admin/JobReviewActions";
import TalentRecommender from "@/components/admin/TalentRecommender";

export default async function AdminJobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const admin = createAdminClient();

  // Fetch job
  const { data: jobRow } = await admin
    .from("company_jobs")
    .select("*")
    .eq("id", jobId)
    .maybeSingle();

  if (!jobRow) redirect("/admin?type=jobs");
  const job = jobRow as CompanyJob;

  // Fetch company info
  const { data: companyRow } = await admin
    .from("company_applications")
    .select("legal_name, website_url, selected_plan, company_size, hq_country")
    .eq("user_id", job.company_id)
    .maybeSingle();

  const company = companyRow as {
    legal_name: string | null;
    website_url: string | null;
    selected_plan: string | null;
    company_size: string | null;
    hq_country: string | null;
  } | null;

  const isPending = job.status === "pending_review";

  // Fetch existing recommendations for this job
  let existingRecs: { talent_user_id: string; full_name: string | null; headline: string | null; overall_score: number | null; skills: string[] }[] = [];
  if (job.status === "published") {
    const { data: recsData } = await admin
      .from("job_recommendations")
      .select("talent_user_id")
      .eq("job_id", job.id);
    const recRows = (recsData ?? []) as { talent_user_id: string }[];
    if (recRows.length > 0) {
      const talentIds = recRows.map((r) => r.talent_user_id);
      const [profilesRes, appsRes, analysesRes] = await Promise.all([
        admin.from("profiles").select("id, full_name").in("id", talentIds),
        admin.from("talent_applications").select("user_id, headline, skills").in("user_id", talentIds),
        admin.from("talent_ai_analyses").select("user_id, overall_score").in("user_id", talentIds),
      ]);
      const pMap = new Map(((profilesRes.data ?? []) as { id: string; full_name: string | null }[]).map((p) => [p.id, p]));
      const aMap = new Map(((appsRes.data ?? []) as { user_id: string; headline: string | null; skills: string[] }[]).map((a) => [a.user_id, a]));
      const sMap = new Map(((analysesRes.data ?? []) as { user_id: string; overall_score: number | null }[]).map((s) => [s.user_id, s]));
      existingRecs = recRows.map((r) => ({
        talent_user_id: r.talent_user_id,
        full_name: pMap.get(r.talent_user_id)?.full_name ?? null,
        headline: aMap.get(r.talent_user_id)?.headline ?? null,
        overall_score: sMap.get(r.talent_user_id)?.overall_score ?? null,
        skills: aMap.get(r.talent_user_id)?.skills ?? [],
      }));
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href="/admin?type=jobs"
        className="mb-6 inline-flex items-center gap-1.5 text-xs text-body transition-colors hover:text-heading font-raleway"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to job review queue
      </Link>

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="mb-2 inline-block text-[11px] uppercase tracking-[0.08em] text-accent font-jetbrains">
            Admin · Job review
          </span>
          <h1 className="text-2xl font-bold text-heading sm:text-3xl font-raleway">
            {job.title}
          </h1>
          <p className="mt-2 text-sm text-body font-raleway">
            Submitted {new Date(job.created_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <JobStatusBadge status={job.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content — 2 columns */}
        <div className="space-y-6 lg:col-span-2">
          {/* Basics */}
          <DetailSection title="Role details" icon={<Briefcase className="h-4 w-4" />}>
            <DetailGrid>
              <DetailItem label="Role category" value={job.role_category} />
              <DetailItem label="Seniority" value={job.seniority} />
              <DetailItem label="Employment type" value={job.employment_type} />
              <DetailItem
                label="Work arrangement"
                value={job.work_arrangement}
                icon={
                  job.work_arrangement === "remote" ? (
                    <Globe2 className="h-3.5 w-3.5 text-accent" />
                  ) : job.work_arrangement === "onsite" ? (
                    <MapPin className="h-3.5 w-3.5 text-accent" />
                  ) : undefined
                }
              />
              {job.location && (
                <DetailItem
                  label="Location"
                  value={job.location}
                  icon={<MapPin className="h-3.5 w-3.5 text-subtle" />}
                />
              )}
              {job.salary_range && (
                <DetailItem
                  label="Salary range"
                  value={job.salary_range}
                  icon={<DollarSign className="h-3.5 w-3.5 text-accent" />}
                />
              )}
            </DetailGrid>
          </DetailSection>

          {/* Description */}
          <DetailSection title="Description" icon={<FileText className="h-4 w-4" />}>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-body font-raleway">
              {job.description}
            </div>
          </DetailSection>

          {/* Skills */}
          <DetailSection title="Required skills" icon={<Code2 className="h-4 w-4" />}>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center rounded-full bg-pill-bg px-3 py-1 text-xs font-medium text-pill-text font-raleway"
                >
                  {s}
                </span>
              ))}
            </div>
          </DetailSection>

          {/* Benefits */}
          {job.benefits && (
            <DetailSection title="Benefits & perks" icon={<Gift className="h-4 w-4" />}>
              <p className="whitespace-pre-wrap text-sm text-body font-raleway">
                {job.benefits}
              </p>
            </DetailSection>
          )}

          {/* Rejection reason (if already rejected) */}
          {job.status === "rejected" && job.review_reason && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5">
              <p className="text-[11px] uppercase tracking-[0.08em] text-red-500 font-jetbrains">
                Rejection reason
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-heading font-raleway">
                {job.review_reason}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Company info card */}
          <div className="rounded-2xl border border-edge bg-surface p-5">
            <div className="mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-accent" />
              <h3 className="text-sm font-semibold text-heading font-raleway">
                Company
              </h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.08em] text-subtle font-jetbrains">
                  Name
                </p>
                <p className="mt-0.5 text-sm font-semibold text-heading font-raleway">
                  {company?.legal_name ?? "Unknown"}
                </p>
              </div>
              {company?.website_url && (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.08em] text-subtle font-jetbrains">
                    Website
                  </p>
                  <a
                    href={company.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 block truncate text-xs text-accent hover:underline font-raleway"
                  >
                    {company.website_url}
                  </a>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.08em] text-subtle font-jetbrains">
                    Plan
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-heading font-raleway">
                    {(company?.selected_plan ?? "free").toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.08em] text-subtle font-jetbrains">
                    Size
                  </p>
                  <p className="mt-0.5 text-xs text-body font-raleway">
                    {company?.company_size ?? "—"}
                  </p>
                </div>
              </div>
              {company?.hq_country && (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.08em] text-subtle font-jetbrains">
                    HQ
                  </p>
                  <p className="mt-0.5 text-xs text-body font-raleway">
                    {company.hq_country}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          {isPending && (
            <div className="rounded-2xl border-2 border-accent/30 bg-accent/5 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-heading font-raleway">
                Decision
              </h3>
              <ApproveButton jobId={job.id} />
              <RejectButton jobId={job.id} />
            </div>
          )}

          {/* Already decided */}
          {job.status === "published" && (
            <div className="flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/5 p-4 text-sm font-semibold text-accent font-raleway">
              <CheckCircle2 className="h-5 w-5" />
              Published
            </div>
          )}
          {job.status === "rejected" && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm font-semibold text-red-500 font-raleway">
              <XCircle className="h-5 w-5" />
              Rejected
            </div>
          )}

          {/* Talent recommender (only for published jobs) */}
          {job.status === "published" && (
            <TalentRecommender jobId={job.id} existingRecs={existingRecs} />
          )}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// UI helpers
// ------------------------------------------------------------------

function JobStatusBadge({ status }: { status: JobStatus }) {
  const cfg: Record<JobStatus, { label: string; cls: string }> = {
    draft: { label: "Draft", cls: "border-edge bg-page-alt text-body" },
    pending_review: {
      label: "Pending review",
      cls: "border-amber-500/40 bg-amber-500/10 text-amber-600",
    },
    approved: {
      label: "Approved",
      cls: "border-accent/40 bg-accent/10 text-accent",
    },
    published: {
      label: "Published",
      cls: "border-accent/40 bg-accent/10 text-accent",
    },
    rejected: {
      label: "Rejected",
      cls: "border-red-500/40 bg-red-500/10 text-red-500",
    },
  };
  const c = cfg[status] ?? cfg.draft;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.08em] font-jetbrains ${c.cls}`}
    >
      {c.label}
    </span>
  );
}

function DetailSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-edge bg-surface p-5">
      <div className="mb-4 flex items-center gap-2 text-accent">
        {icon}
        <h2 className="text-sm font-semibold text-heading font-raleway">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function DetailGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">{children}</div>
  );
}

function DetailItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.08em] text-subtle font-jetbrains">
        {label}
      </p>
      <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-heading font-raleway">
        {icon}
        {value}
      </p>
    </div>
  );
}
