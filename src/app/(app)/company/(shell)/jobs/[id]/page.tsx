import Link from "next/link";
import {
  ArrowLeft,
  Briefcase,
  Globe2,
  MapPin,
} from "lucide-react";
import { redirect } from "next/navigation";
import { requireApprovedCompany } from "@/lib/company/guard";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CompanyJob, JobStatus } from "@/lib/types/db";
import { labelFor, SALARY_RANGES } from "@/lib/company/options";
import RecommendedTalentSection from "@/components/company/RecommendedTalentSection";

export default async function CompanyJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: jobId } = await params;
  const { profile } = await requireApprovedCompany();

  const supabase = await createClient();
  const { data: jobRow } = await supabase
    .from("company_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("company_id", profile.id)
    .maybeSingle();

  if (!jobRow) redirect("/company/jobs");
  const job = jobRow as CompanyJob;

  // Fetch recommended talent (using admin client to access cross-table data)
  const admin = createAdminClient();
  const { data: recs } = await admin
    .from("job_recommendations")
    .select("talent_user_id, note")
    .eq("job_id", jobId);

  const recommendations = (recs ?? []) as { talent_user_id: string; note: string | null }[];

  // Hydrate talent profiles
  let talentCards: {
    user_id: string;
    full_name: string | null;
    headline: string | null;
    skills: string[];
    overall_score: number | null;
    expertise_level: string | null;
    location: string | null;
    note: string | null;
  }[] = [];

  if (recommendations.length > 0) {
    const talentIds = recommendations.map((r) => r.talent_user_id);

    const [profilesRes, appsRes, analysesRes] = await Promise.all([
      admin.from("profiles").select("id, full_name").in("id", talentIds),
      admin
        .from("talent_applications")
        .select("user_id, headline, skills, location")
        .in("user_id", talentIds),
      admin
        .from("talent_ai_analyses")
        .select("user_id, overall_score, expertise_level")
        .in("user_id", talentIds),
    ]);

    const pMap = new Map(
      ((profilesRes.data ?? []) as { id: string; full_name: string | null }[]).map(
        (p) => [p.id, p]
      )
    );
    const aMap = new Map(
      (
        (appsRes.data ?? []) as {
          user_id: string;
          headline: string | null;
          skills: string[];
          location: string | null;
        }[]
      ).map((a) => [a.user_id, a])
    );
    const sMap = new Map(
      (
        (analysesRes.data ?? []) as {
          user_id: string;
          overall_score: number | null;
          expertise_level: string | null;
        }[]
      ).map((s) => [s.user_id, s])
    );

    talentCards = recommendations.map((r) => ({
      user_id: r.talent_user_id,
      full_name: pMap.get(r.talent_user_id)?.full_name ?? null,
      headline: aMap.get(r.talent_user_id)?.headline ?? null,
      skills: aMap.get(r.talent_user_id)?.skills ?? [],
      overall_score: sMap.get(r.talent_user_id)?.overall_score ?? null,
      expertise_level: sMap.get(r.talent_user_id)?.expertise_level ?? null,
      location: aMap.get(r.talent_user_id)?.location ?? null,
      note: r.note,
    }));
  }

  // Fetch existing invitations for this job
  const { data: invRows } = await admin
    .from("interview_invitations")
    .select("talent_user_id, status")
    .eq("job_id", jobId)
    .eq("company_user_id", profile.id);
  const invitationsByTalent = new Map(
    ((invRows ?? []) as { talent_user_id: string; status: string }[]).map((i) => [
      i.talent_user_id,
      i.status,
    ])
  );

  const statusConfig: Record<JobStatus, { label: string; cls: string }> = {
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
  const cfg = statusConfig[job.status] ?? statusConfig.draft;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 sm:px-6 lg:px-10">
      <Link
        href="/company/jobs"
        className="mb-6 inline-flex items-center gap-1.5 text-xs text-body transition-colors hover:text-heading font-raleway"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to jobs
      </Link>

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="mb-2 inline-block text-[11px] uppercase tracking-[0.08em] text-accent font-jetbrains">
            Job details
          </span>
          <h1 className="text-2xl font-bold text-heading sm:text-3xl font-raleway">
            {job.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-body font-raleway">
            <span className="flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5 text-accent" />
              {job.role_category}
            </span>
            <span>·</span>
            <span>{job.seniority}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              {job.work_arrangement === "remote" ? (
                <Globe2 className="h-3.5 w-3.5 text-accent" />
              ) : (
                <MapPin className="h-3.5 w-3.5 text-accent" />
              )}
              {job.location || job.work_arrangement}
            </span>
            {job.salary_range && (
              <>
                <span>·</span>
                <span>{labelFor(SALARY_RANGES, job.salary_range)}</span>
              </>
            )}
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.08em] font-jetbrains ${cfg.cls}`}
        >
          {cfg.label}
        </span>
      </div>

      {/* Rejection reason */}
      {job.status === "rejected" && job.review_reason && (
        <div className="mb-8 rounded-xl border border-red-500/30 bg-red-500/5 p-5">
          <p className="text-[11px] uppercase tracking-[0.08em] text-red-500 font-jetbrains">
            Rejection reason
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-heading font-raleway">
            {job.review_reason}
          </p>
        </div>
      )}

      {/* Recommended talent section — only for published jobs */}
      {job.status === "published" && (
        <RecommendedTalentSection
          jobId={job.id}
          jobTitle={job.title}
          talents={talentCards}
          invitationsByTalent={Object.fromEntries(invitationsByTalent)}
        />
      )}

      {/* Job details */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-edge bg-surface p-5">
          <h2 className="mb-3 text-sm font-semibold text-heading font-raleway">
            Description
          </h2>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-body font-raleway">
            {job.description}
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-edge bg-surface p-5">
            <h2 className="mb-3 text-sm font-semibold text-heading font-raleway">
              Required skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-pill-bg px-3 py-1 text-xs font-medium text-pill-text font-raleway"
                >
                  {s}
                </span>
              ))}
            </div>
          </section>

          {job.benefits && (
            <section className="rounded-2xl border border-edge bg-surface p-5">
              <h2 className="mb-3 text-sm font-semibold text-heading font-raleway">
                Benefits & perks
              </h2>
              <p className="whitespace-pre-wrap text-sm text-body font-raleway">
                {job.benefits}
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
