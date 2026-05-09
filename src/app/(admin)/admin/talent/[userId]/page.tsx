import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  ExternalLink,
  FileText,
  Globe,
  Mail,
  MapPin,
  Sparkles,
} from "lucide-react";

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
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdmin } from "@/lib/admin";
import type {
  Profile,
  TalentAiAnalysis,
  TalentApplication,
} from "@/lib/types/db";
import DecisionPanel from "@/components/admin/DecisionPanel";
import AssessmentPanel from "@/components/admin/AssessmentPanel";
import AnalysisResults from "@/components/talent/AnalysisResults";
import MessageUserButton from "@/components/admin/MessageUserButton";
import ProfileUpdateDiff from "@/components/admin/ProfileUpdateDiff";

export default async function AdminTalentDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  // Defense-in-depth: layout already guards, but double-check.
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/");

  const { userId } = await params;

  const supabase = createAdminClient();

  const [profileRes, appRes, analysisRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase
      .from("talent_applications")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("talent_ai_analyses")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const profile = (profileRes.data ?? null) as Profile | null;
  const app = (appRes.data ?? null) as TalentApplication | null;
  const analysis = (analysisRes.data ?? null) as TalentAiAnalysis | null;

  if (!profile || !app) notFound();

  // Signed URL for the resume (10 min).
  let resumeSignedUrl: string | null = null;
  if (app.resume_path) {
    const { data } = await supabase.storage
      .from("resumes")
      .createSignedUrl(app.resume_path, 60 * 10);
    resumeSignedUrl = data?.signedUrl ?? null;
  }

  const applicantName = profile.full_name ?? profile.email ?? "Applicant";
  const reapplyDefault = new Date();
  reapplyDefault.setMonth(reapplyDefault.getMonth() + 3);
  const reapplyDefaultStr = reapplyDefault.toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.08em] text-body transition-colors hover:text-heading font-jetbrains"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to queue
        </Link>
        <MessageUserButton userId={userId} />
      </div>

      {/* Header card */}
      <div className="mb-6 rounded-2xl border border-edge bg-surface p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-pill-bg text-accent text-sm font-bold font-jetbrains">
                {initials(profile.full_name, profile.email)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-heading sm:text-3xl font-raleway">
                  {applicantName}
                </h1>
                {app.headline && (
                  <p className="mt-1 text-sm text-body font-raleway">
                    {app.headline}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-body font-jetbrains">
              {profile.email && (
                <IconText icon={<Mail className="h-3.5 w-3.5" />}>
                  {profile.email}
                </IconText>
              )}
              {app.location && (
                <IconText icon={<MapPin className="h-3.5 w-3.5" />}>
                  {app.location}
                </IconText>
              )}
              {app.years_experience != null && (
                <IconText icon={<Briefcase className="h-3.5 w-3.5" />}>
                  {app.years_experience} yrs
                </IconText>
              )}
              {app.stage_1_submitted_at && (
                <IconText icon={<Calendar className="h-3.5 w-3.5" />}>
                  Submitted{" "}
                  {new Date(app.stage_1_submitted_at).toLocaleDateString()}
                </IconText>
              )}
            </div>
          </div>

          {analysis?.overall_score != null && (
            <div className="flex shrink-0 items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3">
              <Sparkles className="h-5 w-5 text-accent" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.08em] text-accent font-jetbrains">
                  AI score
                </p>
                <p className="text-2xl font-bold text-heading font-raleway">
                  {analysis.overall_score}
                  <span className="ml-1 text-xs text-subtle font-jetbrains">
                    / 100
                  </span>
                </p>
                <p className="text-[11px] text-body font-raleway">
                  {analysis.expertise_level ?? "—"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Diff view for updates */}
        {app.review_status === "pending_update" && app.previous_approved_state && (
          <div className="mt-6">
            <ProfileUpdateDiff current={app} previous={app.previous_approved_state} />
          </div>
        )}

        {/* Previous decision banner */}
        {app.review_status !== "pending" && app.review_status !== "pending_update" && (
          <div
            className={`mt-6 rounded-xl border p-4 text-sm ${
              app.review_status === "approved"
                ? "border-accent/30 bg-accent/5 text-accent"
                : "border-red-500/30 bg-red-500/5 text-red-600"
            }`}
          >
            <p className="text-[11px] uppercase tracking-[0.08em] font-jetbrains">
              Previously {app.review_status}
              {app.review_decision_at
                ? ` · ${new Date(app.review_decision_at).toLocaleDateString()}`
                : ""}
            </p>
            {app.review_reason && (
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-heading font-raleway">
                {app.review_reason}
              </p>
            )}
            {app.reapply_after && (
              <p className="mt-2 text-xs font-jetbrains">
                Reapply after: {new Date(app.reapply_after).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Two-column body */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT — application detail */}
        <div className="space-y-6 lg:col-span-2">
          <Section title="Self-summary">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-heading font-raleway">
              {app.bio || (
                <span className="text-subtle">(none provided)</span>
              )}
            </p>
          </Section>

          <Section title="Declared skills">
            {app.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {app.skills.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-pill-bg px-3 py-1 text-xs font-medium text-accent font-raleway"
                  >
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-sm text-subtle">(none)</span>
            )}
          </Section>

          <Section title={`Work experience · ${app.work_experience.length}`}>
            <div className="space-y-3">
              {app.work_experience.map((w) => (
                <div
                  key={w.id}
                  className="rounded-xl border border-edge bg-page-alt p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-heading font-raleway">
                      {w.title}{" "}
                      <span className="text-body">
                        @ {w.company}
                      </span>
                    </p>
                    <p className="text-[11px] text-subtle font-jetbrains">
                      {w.start} – {w.current ? "present" : w.end ?? "?"}
                    </p>
                  </div>
                  {w.description && (
                    <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-body font-raleway">
                      {w.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Section>

          {analysis?.status === "ready" && (
            <div className="rounded-2xl border border-edge bg-surface p-1 sm:p-2">
              <AnalysisResults analysis={analysis} />
            </div>
          )}

          {analysis?.status !== "ready" && (
            <Section title="AI analysis">
              <p className="text-sm text-body font-raleway">
                {analysis?.status === "pending"
                  ? "AI analysis is still running…"
                  : analysis?.status === "failed"
                  ? `Analysis failed: ${analysis.error ?? "Unknown error."}`
                  : "No analysis has been run yet for this applicant."}
              </p>
            </Section>
          )}
        </div>

        {/* RIGHT — links + resume */}
        <aside className="space-y-6">
          <Section title="Links">
            <div className="space-y-2">
              <LinkRow
                href={app.portfolio_url}
                label="Portfolio"
                icon={<Globe className="h-4 w-4" />}
              />
              <LinkRow
                href={app.linkedin_url}
                label="LinkedIn"
                icon={<LinkedinIcon className="h-4 w-4" />}
              />
              <LinkRow
                href={app.github_url}
                label="GitHub"
                icon={<GithubIcon className="h-4 w-4" />}
              />
            </div>
          </Section>

          <Section title="Resume">
            {resumeSignedUrl ? (
              <a
                href={resumeSignedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 p-4 transition-opacity hover:opacity-80"
              >
                <FileText className="h-5 w-5 text-accent" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-heading font-raleway">
                    {app.resume_filename ?? "resume.pdf"}
                  </p>
                  <p className="text-[11px] text-subtle font-jetbrains">
                    Opens in a new tab · expires in 10 min
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-body" />
              </a>
            ) : (
              <p className="text-sm text-subtle font-raleway">
                No resume uploaded.
              </p>
            )}
          </Section>
        </aside>
      </div>

      {/* Post-approval vetting — technical + interview. Only meaningful
          once the applicant has cleared human review. */}
      {app.review_status === "approved" && (
        <div className="mt-10">
          <AssessmentPanel
            userId={userId}
            applicantName={applicantName}
            technicalStatus={app.technical_status}
            technicalReason={app.technical_reason}
            technicalDecisionAt={app.technical_decision_at}
            interviewStatus={app.interview_status}
            interviewReason={app.interview_reason}
            interviewDecisionAt={app.interview_decision_at}
            reapplyDefault={reapplyDefaultStr}
          />
        </div>
      )}

      {/* Decision panel — human review. Sticky so it stays in reach. */}
      <div className="mt-10">
        <DecisionPanel
          userId={userId}
          applicantName={applicantName}
          currentStatus={app.review_status}
          reapplyDefault={reapplyDefaultStr}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// UI bits
// ---------------------------------------------------------------------

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-edge bg-surface p-6">
      <h2 className="mb-4 text-[11px] uppercase tracking-[0.08em] text-subtle font-jetbrains">
        {title}
      </h2>
      {children}
    </section>
  );
}

function IconText({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-accent">{icon}</span>
      {children}
    </span>
  );
}

function LinkRow({
  href,
  label,
  icon,
}: {
  href: string | null;
  label: string;
  icon: React.ReactNode;
}) {
  if (!href) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-edge bg-page-alt px-4 py-2.5 text-xs text-subtle opacity-60 font-jetbrains">
        <span>{icon}</span>
        {label} — not provided
      </div>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-lg border border-edge bg-page-alt px-4 py-2.5 text-xs text-heading transition-opacity hover:opacity-80 font-jetbrains"
    >
      <span className="text-accent">{icon}</span>
      <span className="flex-1 truncate">{href}</span>
      <ExternalLink className="h-3.5 w-3.5 text-body" />
    </a>
  );
}

function initials(full: string | null, email: string | null): string {
  const src = (full ?? email ?? "?").trim();
  const parts = src.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}
