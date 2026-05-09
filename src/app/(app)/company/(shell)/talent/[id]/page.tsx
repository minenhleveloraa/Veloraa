import Link from "next/link";
import {
  ArrowLeft,
  Briefcase,
  ExternalLink,
  Globe2,
  MapPin,
  MessageSquare,
  Sparkles,
  Star,
  User,
} from "lucide-react";
import { redirect } from "next/navigation";
import { requireApprovedCompany } from "@/lib/company/guard";
import {
  canBrowseFullCandidatePool,
  CANDIDATE_POOL_ORDER_COLUMN,
  FREE_CANDIDATE_PREVIEW_LIMIT,
  getEffectiveCompanyPlanId,
} from "@/lib/company/candidate-access";
import { createAdminClient } from "@/lib/supabase/admin";

// lucide-react in this version doesn't export Github / Linkedin icons — inline SVGs below.
function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 .5C5.7.5.6 5.6.6 11.9c0 5 3.2 9.3 7.7 10.8.6.1.8-.2.8-.6v-2.2c-3.1.7-3.8-1.5-3.8-1.5-.5-1.3-1.2-1.6-1.2-1.6-1-.7.1-.7.1-.7 1.1.1 1.6 1.1 1.6 1.1 1 1.7 2.6 1.2 3.2.9.1-.7.4-1.2.7-1.5-2.5-.3-5.1-1.2-5.1-5.5 0-1.2.4-2.2 1.1-3-.1-.3-.5-1.4.1-2.9 0 0 .9-.3 3 1.1.9-.2 1.8-.4 2.8-.4s1.9.1 2.8.4c2.1-1.4 3-1.1 3-1.1.6 1.5.2 2.6.1 2.9.7.8 1.1 1.8 1.1 3 0 4.3-2.6 5.2-5.1 5.5.4.3.7 1 .7 2v3c0 .3.2.7.8.6 4.5-1.5 7.7-5.8 7.7-10.8C23.4 5.6 18.3.5 12 .5z" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.62 0 4.29 2.38 4.29 5.48v6.26zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.23 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.99 0 1.78-.77 1.78-1.72V1.72C24 .77 23.21 0 22.23 0z" />
    </svg>
  );
}
type TalentProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
};

type TalentApplicationRow = {
  headline: string | null;
  location: string | null;
  bio: string | null;
  skills: string[];
  work_experience: {
    id: string;
    company: string;
    title: string;
    start: string;
    end: string | null;
    current: boolean;
    description: string;
  }[];
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  years_experience: number | null;
  review_status: string;
};

type TalentAnalysisRow = {
  overall_score: number | null;
  expertise_level: string | null;
  summary: string | null;
  strengths: string[];
  dimensions: {
    domain_expertise?: number;
    leadership?: number;
    depth?: number;
    breadth?: number;
    communication?: number;
  } | null;
};

export default async function CompanyTalentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: talentId } = await params;
  const { profile: companyProfile, application } =
    await requireApprovedCompany();
  const companyPlanId = getEffectiveCompanyPlanId(application);

  const admin = createAdminClient();

  const [companyJobsRes, profileRes, appRes, analysisRes] = await Promise.all([
    admin
      .from("company_jobs")
      .select("id")
      .eq("company_id", companyProfile.id)
      .eq("status", "published"),
    admin.from("profiles").select("*").eq("id", talentId).maybeSingle(),
    admin.from("talent_applications").select("*").eq("user_id", talentId).maybeSingle(),
    admin.from("talent_ai_analyses").select("*").eq("user_id", talentId).maybeSingle(),
  ]);

  const talentProfile = profileRes.data as TalentProfileRow | null;
  const talentApp = appRes.data as TalentApplicationRow | null;
  const analysis = analysisRes.data as TalentAnalysisRow | null;
  const isApproved = talentApp?.review_status === "approved";

  const publishedCompanyJobIds =
    (companyJobsRes.data as { id: string }[] | null)?.map((job) => job.id) ??
    [];

  let hasRecommendedAccess = false;
  if (publishedCompanyJobIds.length > 0) {
    const { count } = await admin
      .from("job_recommendations")
      .select("id", { count: "exact", head: true })
      .eq("talent_user_id", talentId)
      .in("job_id", publishedCompanyJobIds);

    hasRecommendedAccess = (count ?? 0) > 0;
  }

  let hasCandidatePoolAccess = false;
  if (isApproved) {
    if (canBrowseFullCandidatePool(companyPlanId)) {
      hasCandidatePoolAccess = true;
    } else {
      const { data: previewRows } = await admin
        .from("talent_applications")
        .select("user_id")
        .eq("review_status", "approved")
        .order(CANDIDATE_POOL_ORDER_COLUMN, { ascending: false })
        .limit(FREE_CANDIDATE_PREVIEW_LIMIT);

      hasCandidatePoolAccess = (
        (previewRows ?? []) as { user_id: string }[]
      ).some((row) => row.user_id === talentId);
    }
  }

  if (!hasRecommendedAccess && !hasCandidatePoolAccess) {
    redirect(isApproved ? "/company/subscription" : "/company/candidates");
  }

  const name = talentProfile?.full_name ?? "Candidate";
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const avatarUrl = talentProfile?.avatar_url;

  if (!isApproved) {
    return (
      <div className="mx-auto max-w-5xl px-4 pb-24 pt-12 sm:px-6 lg:px-10 text-center">
        <div className="flex justify-center mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface border border-edge">
            <User className="h-6 w-6 text-subtle" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-heading font-raleway mb-2">Candidate Unavailable</h1>
        <p className="text-body font-raleway max-w-md mx-auto mb-8">
          This candidate&apos;s profile is currently hidden or under review and is not accessible at this time.
        </p>
        <Link
          href="/company/candidates"
          className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-5 py-2.5 text-sm font-semibold text-heading transition-opacity border border-edge hover:opacity-80 font-raleway"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Candidates
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 sm:px-6 lg:px-10">
      <Link
        href="/company/jobs"
        className="mb-6 inline-flex items-center gap-1.5 text-xs text-body transition-colors hover:text-heading font-raleway"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to jobs
      </Link>

      {/* Profile header */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 overflow-hidden items-center justify-center rounded-2xl bg-accent/15 text-accent text-xl font-bold font-jetbrains border border-accent/20">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div>
            <span className="mb-1 inline-block text-[11px] uppercase tracking-[0.08em] text-accent font-jetbrains">
              Recommended talent
            </span>
            <h1 className="text-2xl font-bold text-heading font-raleway">
              {name}
            </h1>
            <p className="mt-1 text-sm text-body font-raleway">
              {talentApp?.headline ?? "—"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-body font-raleway">
              {talentApp?.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-accent" />
                  {talentApp.location}
                </span>
              )}
              {talentApp?.years_experience != null && (
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3 text-accent" />
                  {talentApp.years_experience}+ years
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Score badge */}
        {analysis?.overall_score != null && (
          <div className="rounded-2xl border border-accent/25 bg-accent/8 px-5 py-3 text-center">
            <p className="text-[10px] uppercase tracking-[0.1em] text-accent font-jetbrains">
              Veloraa score
            </p>
            <p className="text-2xl font-bold text-heading font-raleway">
              {analysis.overall_score}
            </p>
            {analysis.expertise_level && (
              <p className="text-[11px] text-body font-jetbrains">
                {analysis.expertise_level}
              </p>
            )}
          </div>
        )}
      </div>

      {/* External links */}
      {(talentApp?.linkedin_url || talentApp?.github_url || talentApp?.portfolio_url) && (
        <div className="mt-6 flex flex-wrap gap-3">
          {talentApp.linkedin_url && (
            <a
              href={talentApp.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-edge bg-surface px-4 py-2 text-xs font-semibold text-heading transition-all hover:border-accent/30 hover:text-accent font-raleway"
            >
              <LinkedinIcon className="h-3.5 w-3.5" />
              LinkedIn
              <ExternalLink className="h-3 w-3 text-subtle" />
            </a>
          )}
          {talentApp.github_url && (
            <a
              href={talentApp.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-edge bg-surface px-4 py-2 text-xs font-semibold text-heading transition-all hover:border-accent/30 hover:text-accent font-raleway"
            >
              <GithubIcon className="h-3.5 w-3.5" />
              GitHub
              <ExternalLink className="h-3 w-3 text-subtle" />
            </a>
          )}
          {talentApp.portfolio_url && (
            <a
              href={talentApp.portfolio_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-edge bg-surface px-4 py-2 text-xs font-semibold text-heading transition-all hover:border-accent/30 hover:text-accent font-raleway"
            >
              <Globe2 className="h-3.5 w-3.5" />
              Portfolio
              <ExternalLink className="h-3 w-3 text-subtle" />
            </a>
          )}
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Left column */}
        <div className="space-y-6">
          {/* Bio */}
          {talentApp?.bio && (
            <section className="rounded-2xl border border-edge bg-surface p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-heading font-raleway">
                <User className="h-4 w-4 text-accent" />
                About
              </h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-body font-raleway">
                {talentApp.bio}
              </p>
            </section>
          )}

          {/* Work experience */}
          {talentApp?.work_experience && talentApp.work_experience.length > 0 && (
            <section className="rounded-2xl border border-edge bg-surface p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-heading font-raleway">
                <Briefcase className="h-4 w-4 text-accent" />
                Experience
              </h2>
              <div className="space-y-5">
                {talentApp.work_experience.map((exp) => (
                  <div key={exp.id} className="relative pl-6 before:absolute before:left-0 before:top-1 before:h-full before:w-px before:bg-edge">
                    <div className="absolute left-[-3px] top-1.5 h-2 w-2 rounded-full bg-accent" />
                    <div>
                      <p className="text-sm font-semibold text-heading font-raleway">
                        {exp.title}
                      </p>
                      <p className="text-xs text-accent font-raleway">
                        {exp.company}
                      </p>
                      <p className="mt-0.5 text-[11px] text-subtle font-jetbrains">
                        {exp.start} — {exp.current ? "Present" : exp.end ?? "—"}
                      </p>
                      {exp.description && (
                        <p className="mt-2 text-xs leading-relaxed text-body font-raleway">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Skills */}
          {talentApp?.skills && talentApp.skills.length > 0 && (
            <section className="rounded-2xl border border-edge bg-surface p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-heading font-raleway">
                <Star className="h-4 w-4 text-accent" />
                Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {talentApp.skills.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-pill-bg px-3 py-1 text-xs font-medium text-pill-text font-raleway"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* AI Analysis summary */}
          {analysis?.summary && (
            <section className="rounded-2xl border border-accent/20 bg-accent/5 p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-heading font-raleway">
                <Sparkles className="h-4 w-4 text-accent" />
                Veloraa analysis
              </h2>
              <p className="text-xs leading-relaxed text-body font-raleway">
                {analysis.summary}
              </p>
              {analysis.strengths && analysis.strengths.length > 0 && (
                <div className="mt-3">
                  <p className="text-[10px] uppercase tracking-[0.08em] text-accent font-jetbrains mb-1.5">
                    Key strengths
                  </p>
                  <ul className="space-y-1">
                    {analysis.strengths.map((s, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-1.5 text-xs text-body font-raleway"
                      >
                        <Star className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* Dimensions */}
          {analysis?.dimensions && (
            <section className="rounded-2xl border border-edge bg-surface p-5">
              <h2 className="mb-3 text-sm font-semibold text-heading font-raleway">
                Competency scores
              </h2>
              <div className="space-y-3">
                {Object.entries(analysis.dimensions).map(([key, val]) =>
                  val != null ? (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] uppercase tracking-[0.08em] text-subtle font-jetbrains">
                          {key.replace(/_/g, " ")}
                        </p>
                        <span className="text-xs font-bold text-heading font-jetbrains">
                          {val}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-edge">
                        <div
                          className="h-1.5 rounded-full bg-accent transition-all"
                          style={{ width: `${val}%` }}
                        />
                      </div>
                    </div>
                  ) : null
                )}
              </div>
            </section>
          )}

          {/* CTA */}
          <div className="rounded-2xl border border-edge bg-surface p-5 space-y-3">
            <Link
              href="/company/messages"
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-xs font-semibold text-white transition-all hover:opacity-90 hover:shadow-[0_0_24px_rgba(74,222,128,0.35)] font-raleway"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Message {name.split(" ")[0]}
            </Link>
            <Link
              href="/company/jobs"
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-edge bg-page-alt px-5 py-2.5 text-xs font-semibold text-heading transition-opacity hover:opacity-80 font-raleway"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to jobs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
