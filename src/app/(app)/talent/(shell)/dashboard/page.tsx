import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type {
  AssessmentStatus,
  Profile,
  ReviewStatus,
  TalentAiAnalysis,
  TalentApplication,
} from "@/lib/types/db";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  Bookmark,
  Briefcase,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Eye,
  FileText,
  LineChart,
  Lock,
  MapPin,
  MessageSquare,
  Pencil,
  Settings,
  Sparkles,
  Star,
  Trophy,
  UserCheck,
  Users,
  XCircle,
  Zap,
} from "lucide-react";

import TalentDashboardBackdrop from "@/components/talent/dashboard/TalentDashboardBackdrop";
import TalentActivityPulse from "@/components/talent/dashboard/TalentActivityPulse";
import type { PulseDay } from "@/components/talent/dashboard/TalentActivityPulse";
import JobRecommendationsFeed from "@/components/talent/dashboard/JobRecommendationsFeed";
import CompaniesInterestedCard from "@/components/talent/dashboard/CompaniesInterestedCard";
import ApplicationFunnelCard from "@/components/talent/dashboard/ApplicationFunnelCard";
import TalentUpgradeCard from "@/components/talent/dashboard/TalentUpgradeCard";

export default async function TalentDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  const profile = profileRow as Profile | null;
  if (profile?.role !== "talent") redirect("/profile");

  const { data: appRow } = await supabase
    .from("talent_applications")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  const app = appRow as TalentApplication | null;

  const { data: analysisRow } = await supabase
    .from("talent_ai_analyses")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  const analysis = analysisRow as TalentAiAnalysis | null;

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  // ---------------------------------------------------------------
  // Terminal state â€” passed every stage, live in the talent pool.
  // ---------------------------------------------------------------
  if (
    app?.review_status === "approved" &&
    app.interview_status === "passed"
  ) {
    return (
      <LiveTalentDashboard
        firstName={firstName}
        fullName={profile?.full_name ?? null}
        app={app}
        analysis={analysis}
      />
    );
  }

  // Everything else is the pipeline view.
  return (
    <PipelineView
      firstName={firstName}
      app={app}
      analysis={analysis}
    />
  );
}

// =====================================================================
// PIPELINE VIEW â€” pending / in review / rejected / assessment / interview
// =====================================================================

function PipelineView({
  firstName,
  app,
  analysis,
}: {
  firstName: string;
  app: TalentApplication | null;
  analysis: TalentAiAnalysis | null;
}) {
  const reviewStatus: ReviewStatus = app?.review_status ?? "pending";
  const technicalStatus: AssessmentStatus = app?.technical_status ?? "pending";
  const interviewStatus: AssessmentStatus = app?.interview_status ?? "pending";

  // Figure out *which* stage the rejection came from, so the hero can
  // speak the applicant's language ("your interview" vs "your profile").
  const failedAt: FailedStage | null =
    reviewStatus !== "rejected"
      ? null
      : interviewStatus === "failed"
      ? "interview"
      : technicalStatus === "failed"
      ? "technical"
      : "review";

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-20 sm:px-6 sm:pb-24 sm:pt-32 lg:px-8">
      <span className="mb-3 inline-block text-[11px] uppercase tracking-[0.06em] text-accent font-jetbrains sm:text-xs sm:tracking-[0.08em]">
        Your application
      </span>

      {/* Hero â€” tone matches pipeline status */}
      {reviewStatus === "rejected" ? (
        <RejectedHero
          firstName={firstName}
          failedAt={failedAt ?? "review"}
          reason={app?.review_reason}
          reapplyAfter={app?.reapply_after}
        />
      ) : reviewStatus === "approved" && interviewStatus === "pending" && technicalStatus === "passed" ? (
        <InterviewHero firstName={firstName} />
      ) : reviewStatus === "approved" ? (
        <TechnicalHero firstName={firstName} />
      ) : (
        <>
          <h1 className="text-3xl font-bold text-heading sm:text-4xl font-raleway">
            Hi {firstName} â€” you&apos;re in the queue.
          </h1>
          <p className="mt-3 text-base leading-relaxed text-body font-libre italic">
            We&apos;ll be in touch within 24 hours about your next step.
          </p>
        </>
      )}

      {/* AI grade preview â€” only when we still have the analysis & the
          application hasn't been rejected. */}
      {analysis?.status === "ready" && reviewStatus !== "rejected" && (
        <Link
          href="/talent/onboarding/stage-2"
          className="mt-6 flex items-center gap-4 rounded-2xl border-[3px] border-accent bg-surface p-5 transition-shadow hover:shadow-lg hover:shadow-glow-soft"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-[0.08em] text-accent font-jetbrains">
              Your AI grade
            </p>
            <p className="mt-0.5 text-lg font-bold text-heading font-raleway">
              {analysis.overall_score}/100 Â·{" "}
              <span className="text-accent">
                {analysis.expertise_level ?? "â€”"}
              </span>
            </p>
            <p className="mt-1 text-xs text-body font-raleway">
              Tap to view the full breakdown.
            </p>
          </div>
        </Link>
      )}

      {/* Pipeline */}
      <div className="mt-8 space-y-2.5 sm:mt-10 sm:space-y-3">
        <StageRow
          status={app?.stage_1_submitted_at ? "done" : "active"}
          num="01"
          title="Profile submitted"
          subtitle={
            app?.stage_1_submitted_at
              ? `Submitted ${new Date(app.stage_1_submitted_at).toLocaleDateString()}`
              : "Complete"
          }
        />
        <StageRow
          status={
            analysis?.status === "ready"
              ? "done"
              : analysis?.status === "pending"
              ? "active"
              : analysis?.status === "failed"
              ? "failed"
              : "idle"
          }
          num="02"
          title="AI analysis"
          subtitle={
            analysis?.status === "ready"
              ? "Complete â€” see your grade above."
              : analysis?.status === "pending"
              ? "Running right nowâ€¦"
              : analysis?.status === "failed"
              ? "Something went wrong. Re-run from stage 2."
              : "Queued â€” we'll kick this off shortly."
          }
        />
        <StageRow
          status={
            reviewStatus === "approved"
              ? "done"
              : failedAt === "review"
              ? "failed"
              : analysis?.status === "ready"
              ? "active"
              : "idle"
          }
          num="03"
          title="Human review"
          subtitle={
            reviewStatus === "approved"
              ? "You're through â€” congrats."
              : failedAt === "review"
              ? "Not this time. Reapply when ready."
              : analysis?.status === "ready"
              ? "In review â€” we'll email you within 24 hours."
              : "Queued after AI analysis."
          }
        />
        <StageRow
          status={
            technicalStatus === "passed"
              ? "done"
              : failedAt === "technical"
              ? "failed"
              : reviewStatus === "approved"
              ? "active"
              : "idle"
          }
          num="04"
          title="Technical assessment"
          subtitle={
            technicalStatus === "passed"
              ? "Cleared the technical bar â€” on to the interview."
              : failedAt === "technical"
              ? "Not this time. Review the feedback above."
              : reviewStatus === "approved"
              ? "Active â€” watch your inbox for the assessment link."
              : "Lightweight, tailored to your expertise."
          }
        />
        <StageRow
          status={
            interviewStatus === "passed"
              ? "done"
              : failedAt === "interview"
              ? "failed"
              : technicalStatus === "passed"
              ? "active"
              : "idle"
          }
          num="05"
          title="Senior engineer interview"
          subtitle={
            interviewStatus === "passed"
              ? "You nailed it."
              : failedAt === "interview"
              ? "Not this time. Review the feedback above."
              : technicalStatus === "passed"
              ? "Up next â€” we'll propose time windows by email."
              : "45 minutes with a senior in your field."
          }
        />
        <StageRow
          status={interviewStatus === "passed" ? "done" : "idle"}
          num="06"
          title="You're in the top 1%"
          subtitle={
            interviewStatus === "passed"
              ? "Profile live to vetted employers."
              : "Profile goes live to vetted employers."
          }
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Pipeline hero variants
// ---------------------------------------------------------------------

type FailedStage = "review" | "technical" | "interview";

function TechnicalHero({ firstName }: { firstName: string }) {
  return (
    <div className="rounded-2xl border-[3px] border-accent bg-linear-to-br from-accent/10 via-surface to-surface p-6 sm:p-8">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[11px] uppercase tracking-[0.08em] text-accent font-jetbrains">
        <ClipboardCheck className="h-3.5 w-3.5" />
        Technical assessment
      </div>
      <h1 className="text-3xl font-bold text-heading sm:text-4xl font-raleway">
        Nice work {firstName} â€” you&apos;re through.
      </h1>
      <p className="mt-3 text-base leading-relaxed text-body font-libre italic">
        Our team has reviewed your application. Next up is a lightweight
        technical assessment tailored to your expertise. We&apos;ll email
        you the link shortly â€” it usually takes 45â€“60 minutes and you can
        take it on your own schedule.
      </p>
    </div>
  );
}

function InterviewHero({ firstName }: { firstName: string }) {
  return (
    <div className="rounded-2xl border-[3px] border-accent bg-linear-to-br from-accent/10 via-surface to-surface p-6 sm:p-8">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[11px] uppercase tracking-[0.08em] text-accent font-jetbrains">
        <UserCheck className="h-3.5 w-3.5" />
        Senior engineer interview
      </div>
      <h1 className="text-3xl font-bold text-heading sm:text-4xl font-raleway">
        You crushed the assessment, {firstName}.
      </h1>
      <p className="mt-3 text-base leading-relaxed text-body font-libre italic">
        The final step is a 45-minute interview with a senior engineer in
        your field. We&apos;ll email you shortly with a couple of time
        windows â€” once that&apos;s through, your profile goes live to
        vetted employers.
      </p>
    </div>
  );
}

function RejectedHero({
  firstName,
  failedAt,
  reason,
  reapplyAfter,
}: {
  firstName: string;
  failedAt: FailedStage;
  reason: string | null | undefined;
  reapplyAfter: string | null | undefined;
}) {
  const reapplyDate = reapplyAfter
    ? new Date(reapplyAfter).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const headline =
    failedAt === "technical"
      ? "An update on your technical assessment"
      : failedAt === "interview"
      ? "An update on your interview"
      : "An update on your application";

  const intro =
    failedAt === "technical"
      ? "We appreciate the time you put into the take-home. After a careful review, we're not moving forward to the interview stage this cycle."
      : failedAt === "interview"
      ? "Thanks for making time to interview with us. After comparing notes, we've decided not to move forward with your application at this stage."
      : "We've decided not to move forward at this time. This isn't final â€” use the time to deepen your portfolio and come back stronger.";

  return (
    <div className="rounded-2xl border-2 border-amber-500/40 bg-linear-to-br from-amber-500/5 via-surface to-surface p-6 sm:p-8">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.08em] text-amber-600 font-jetbrains">
        <XCircle className="h-3.5 w-3.5" />
        Not this time
      </div>
      <h1 className="text-2xl font-bold text-heading sm:text-3xl font-raleway">
        Thanks {firstName} â€” {headline.toLowerCase()}.
      </h1>
      <p className="mt-3 text-base leading-relaxed text-body font-libre italic">
        {intro}
      </p>

      {reason && (
        <div className="mt-5 rounded-xl border border-edge bg-page-alt p-4">
          <p className="text-[11px] uppercase tracking-[0.08em] text-subtle font-jetbrains">
            {failedAt === "interview"
              ? "Interviewer notes"
              : "Reviewer notes"}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-heading font-raleway">
            {reason}
          </p>
        </div>
      )}

      {reapplyDate && (
        <p className="mt-5 text-sm text-body font-raleway">
          You&apos;re welcome to reapply on or after{" "}
          <strong className="text-heading">{reapplyDate}</strong>.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Pipeline stage row
// ---------------------------------------------------------------------

type StageStatus = "done" | "active" | "failed" | "idle";

function StageRow({
  num,
  title,
  subtitle,
  status,
}: {
  num: string;
  title: string;
  subtitle: string;
  status: StageStatus;
}) {
  const badge = {
    done: "bg-accent text-white",
    active: "bg-accent/15 text-accent ring-2 ring-accent/30",
    failed: "bg-amber-500/15 text-amber-600",
    idle: "bg-pill-bg text-accent opacity-70",
  }[status];

  const Icon =
    status === "done"
      ? CheckCircle2
      : status === "failed"
      ? XCircle
      : Clock;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-edge bg-surface p-3.5 sm:gap-4 sm:rounded-2xl sm:p-5">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10 ${badge}`}
      >
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-[10px] uppercase tracking-[0.06em] text-accent font-jetbrains sm:text-[11px] sm:tracking-[0.08em]">
            {num}
          </span>
          <p className="truncate text-[13px] font-semibold text-heading font-raleway sm:text-sm">
            {title}
          </p>
        </div>
        <p className="mt-0.5 text-[11px] leading-relaxed text-body font-raleway sm:text-xs">{subtitle}</p>
      </div>
    </div>
  );
}

// =====================================================================
// LIVE TALENT DASHBOARD â€” interview passed, profile is live
// =====================================================================

const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

function buildEmptyPulseDays(): PulseDay[] {
  const out: PulseDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    d.setUTCHours(0, 0, 0, 0);
    out.push({
      dateISO: d.toISOString(),
      label: WEEKDAY_LETTERS[d.getUTCDay()],
      value: 0,
    });
  }
  return out;
}

function LiveTalentDashboard({
  firstName,
  fullName,
  app,
  analysis,
}: {
  firstName: string;
  fullName: string | null;
  app: TalentApplication;
  analysis: TalentAiAnalysis | null;
}) {
  const displayName = fullName ?? firstName;
  const headline = app.headline ?? "Open to opportunities";
  const location = app.location ?? "Remote";
  const scorePct = analysis?.overall_score ?? null;
  const level = analysis?.expertise_level ?? null;
  const skills = app.skills ?? [];

  const completenessChecks = [
    !!app.bio && app.bio.length >= 60,
    !!app.headline,
    !!app.location,
    (app.skills?.length ?? 0) >= 3,
    !!app.resume_path,
    !!app.linkedin_url || !!app.github_url || !!app.portfolio_url,
    (app.work_experience?.length ?? 0) >= 1,
  ];
  const completeness = Math.round(
    (completenessChecks.filter(Boolean).length / completenessChecks.length) * 100
  );

  // TODO: Replace with real data queries when profile-views tracking lands
  const pulseDays = buildEmptyPulseDays();

  const now = new Date();
  const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, ".");
  const timeStamp = now.toISOString().slice(11, 16);

  return (
    <div className="relative isolate">
      <TalentDashboardBackdrop />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-20 pt-4 sm:px-6 sm:pb-24 sm:pt-8 lg:px-8 lg:pt-10">
        {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {/* HERO                                                      */}
        {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="group relative overflow-hidden rounded-[1.5rem] border border-accent/30 bg-gradient-to-br from-surface via-surface to-page-alt p-4 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.35)] sm:rounded-[2rem] sm:p-9">
          {/* Inset highlight ring */}
          <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[1.5rem] ring-1 ring-inset ring-accent/15 sm:rounded-[2rem]" />

          {/* SVG dot-grid background */}
          <svg aria-hidden className="absolute inset-0 h-full w-full text-heading opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="talent-hero-grid" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#talent-hero-grid)" />
          </svg>

          {/* Topographic orbiting rings */}
          <svg aria-hidden viewBox="0 0 400 400" className="velora-orbit-reverse absolute -right-32 -top-32 h-[26rem] w-[26rem] text-accent opacity-[0.30]">
            <g fill="none" stroke="currentColor" strokeWidth="0.6">
              <ellipse cx="200" cy="200" rx="190" ry="118" />
              <ellipse cx="200" cy="200" rx="160" ry="100" />
              <ellipse cx="200" cy="200" rx="130" ry="82" />
              <ellipse cx="200" cy="200" rx="100" ry="64" />
              <ellipse cx="200" cy="200" rx="70" ry="45" />
              <ellipse cx="200" cy="200" rx="40" ry="26" />
            </g>
            <circle cx="200" cy="200" r="4" fill="currentColor" opacity="0.7" />
          </svg>

          {/* Soft accent glow â€” bottom-left */}
          <span aria-hidden className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-accent/12 blur-3xl" />

          {/* Corner cut marks */}
          <CornerMark className="left-3 top-3" rotate={0} />
          <CornerMark className="right-3 top-3" rotate={90} />
          <CornerMark className="right-3 bottom-3" rotate={180} />
          <CornerMark className="left-3 bottom-3" rotate={270} />

          {/* Scan beam */}
          <span aria-hidden className="absolute inset-x-6 bottom-0 h-px overflow-hidden">
            <span className="velora-scan block h-full w-1/2 bg-gradient-to-r from-transparent via-accent to-transparent" />
          </span>

          {/* Glass shimmer overlay */}
          <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[1.5rem] sm:rounded-[2rem]">
            <span className="velora-glass-shimmer absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          </span>

          {/* â”€â”€ Content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="relative">
            {/* System status eyebrow */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-[9px] uppercase tracking-[0.14em] font-jetbrains sm:mb-6 sm:gap-3 sm:text-[10px] sm:tracking-[0.18em]">
              <div className="flex items-center gap-2 text-accent">
                <span className="relative flex h-2 w-2">
                  <span aria-hidden className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                </span>
                SYS Â· ONLINE
              </div>
              <div className="flex items-center gap-3 text-subtle">
                <span className="hidden sm:inline">NODE Â· {firstName.slice(0, 3).toUpperCase() || "VEL"}</span>
                <span aria-hidden className="hidden h-3 w-px bg-edge sm:inline-block" />
                <span>{dateStamp}</span>
                <span aria-hidden className="h-3 w-px bg-edge" />
                <span>{timeStamp} UTC</span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-8">
              {/* AI score halo */}
              {scorePct != null && (
                <div className="relative h-28 w-28 shrink-0 sm:h-36 sm:w-36">
                  <span aria-hidden className="absolute inset-0 -m-3 rounded-full bg-accent/10 blur-2xl" />
                  {/* Outer dashed orbit */}
                  <svg aria-hidden viewBox="0 0 120 120" className="velora-orbit absolute inset-[-18px] h-[calc(100%+36px)] w-[calc(100%+36px)] text-accent">
                    <circle cx="60" cy="60" r="58" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 6" opacity="0.55" />
                  </svg>
                  {/* Reverse inner orbit */}
                  <svg aria-hidden viewBox="0 0 120 120" className="velora-orbit-reverse absolute inset-[-32px] h-[calc(100%+64px)] w-[calc(100%+64px)] text-accent">
                    <circle cx="60" cy="60" r="58" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 14" opacity="0.4" />
                  </svg>
                  {/* Cardinal ticks */}
                  <svg aria-hidden viewBox="0 0 120 120" className="absolute inset-[-18px] h-[calc(100%+36px)] w-[calc(100%+36px)] text-accent">
                    <g stroke="currentColor" strokeWidth="1.4" opacity="0.6">
                      <line x1="60" y1="1" x2="60" y2="7" />
                      <line x1="60" y1="113" x2="60" y2="119" />
                      <line x1="1" y1="60" x2="7" y2="60" />
                      <line x1="113" y1="60" x2="119" y2="60" />
                    </g>
                  </svg>
                  {/* Score ring */}
                  <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[1.75rem] bg-surface shadow-[0_0_50px_-10px_rgba(74,222,128,0.55)] ring-[3px] ring-accent/40">
                    <div className="relative flex flex-col items-center">
                      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="32" className="stroke-edge" fill="none" strokeWidth="4" />
                        <circle cx="40" cy="40" r="32" className="stroke-accent" fill="none" strokeWidth="4" strokeDasharray={`${(scorePct / 100) * 201.1} 201.1`} strokeLinecap="round" />
                      </svg>
                      <span className="relative text-2xl font-bold text-heading font-jetbrains">{scorePct}</span>
                      <span className="relative mt-0.5 text-[9px] uppercase tracking-[0.14em] text-accent font-jetbrains">{level ?? "Score"}</span>
                    </div>
                  </div>
                  {/* Floating status pip */}
                  <span aria-hidden className="velora-pulse-soft absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-accent/40 bg-page text-accent shadow-md">
                    <span className="h-2 w-2 rounded-full bg-accent" />
                  </span>
                </div>
              )}

              <div className="flex-1 text-center sm:text-left">
                <div className="mb-2.5 flex flex-wrap items-center justify-center gap-1.5 sm:mb-3 sm:gap-2 sm:justify-start">
                  <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.06em] text-accent font-jetbrains sm:gap-1.5 sm:px-3 sm:py-1 sm:text-[11px] sm:tracking-[0.08em]">
                    <Trophy className="h-3 w-3 sm:h-3.5 sm:w-3.5" />Live on Veloraa
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-edge bg-surface/60 px-2 py-0.5 text-[9px] uppercase tracking-[0.06em] text-body font-jetbrains backdrop-blur-sm sm:gap-1.5 sm:px-3 sm:py-1 sm:text-[11px] sm:tracking-[0.08em]">
                    <Zap className="h-2.5 w-2.5 text-accent sm:h-3 sm:w-3" />Top 1% verified
                  </span>
                </div>

                <h1 className="text-2xl font-bold leading-[1.05] text-heading sm:text-4xl lg:text-5xl font-raleway">
                  Welcome back, <span className="text-accent">{firstName}</span>.
                </h1>
                <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-body font-libre italic sm:mt-3 sm:text-base">
                  Your profile is live to pre-vetted employers. Keep it fresh, reply quickly, and the best roles come to you.
                </p>

                {/* Skills pills — scrollable on mobile */}
                {skills.length > 0 && (
                  <div className="mt-3 flex gap-1 overflow-x-auto pb-1 scrollbar-none sm:mt-4 sm:gap-1.5 sm:flex-wrap">
                    {skills.slice(0, 6).map((s) => (
                      <span key={s} className="shrink-0 rounded-full bg-pill-bg px-2 py-0.5 text-[9px] font-medium text-pill-text font-raleway sm:px-2.5 sm:py-1 sm:text-[10px]">{s}</span>
                    ))}
                    {skills.length > 6 && (
                      <span className="shrink-0 rounded-full border border-edge bg-surface px-2 py-0.5 text-[9px] font-medium text-subtle font-raleway sm:px-2.5 sm:py-1 sm:text-[10px]">+{skills.length - 6}</span>
                    )}
                  </div>
                )}

                <div className="mt-4 flex flex-col gap-1.5 sm:mt-5 sm:flex-row sm:flex-wrap sm:gap-2">
                  <Link href="/talent/messages" className="group/cta inline-flex items-center justify-center gap-1.5 rounded-full bg-accent px-4 py-2 text-[11px] font-semibold text-white transition-all hover:-translate-y-0.5 hover:opacity-95 hover:shadow-[0_0_28px_rgba(74,222,128,0.5)] font-raleway sm:px-5 sm:py-2.5 sm:text-xs">
                    <MessageSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5" />Open messages
                    <span aria-hidden className="ml-1 h-1 w-1 rounded-full bg-white/80 transition-transform group-hover/cta:scale-150" />
                  </Link>
                  <Link href="/talent/jobs" className="inline-flex items-center justify-center gap-1.5 rounded-full border border-edge bg-surface/60 px-4 py-2 text-[11px] font-semibold text-heading backdrop-blur-sm transition-all hover:border-accent/40 hover:text-accent font-raleway sm:px-5 sm:py-2.5 sm:text-xs">
                    <Briefcase className="h-3 w-3 sm:h-3.5 sm:w-3.5" />Browse jobs
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {/* KPI STRIP                                                  */}
        {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-6 sm:grid-cols-4 sm:gap-4">
          <KpiCard label="Profile views" value="0" hint="Last 30 days" icon={Eye} />
          <KpiCard label="Inbound messages" value="0" hint="From hiring teams" icon={MessageSquare} />
          <KpiCard label="Saved roles" value="0" hint="Across all companies" icon={Bookmark} />
          <KpiCard label="Interview offers" value="0" hint="Pending response" icon={CalendarClock} />
        </section>

        {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {/* MAIN GRID                                                  */}
        {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="mt-5 grid gap-4 sm:mt-8 sm:gap-6 lg:grid-cols-3">
          {/* Left column â€” 2/3 */}
          <div className="space-y-4 sm:space-y-6 lg:col-span-2">
            <TalentActivityPulse days={pulseDays} prevWeekTotal={0} />
            <JobRecommendationsFeed />
          </div>

          {/* Right column â€” 1/3 */}
          <aside className="space-y-4 sm:space-y-6">
            <ProfileSnapshot
              name={displayName}
              headline={headline}
              location={location}
              completeness={completeness}
              skills={skills}
            />
            <CompaniesInterestedCard />
            <TalentUpgradeCard />
          </aside>
        </div>

        {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {/* APPLICATION FUNNEL â€” full-width below the grid             */}
        {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="mt-4 sm:mt-6">
          <ApplicationFunnelCard />
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Corner mark (sci-fi accent)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function CornerMark({ className, rotate }: { className?: string; rotate: 0 | 90 | 180 | 270 }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" fill="none" className={`absolute h-3.5 w-3.5 text-accent/55 ${className ?? ""}`} style={{ transform: `rotate(${rotate}deg)` }}>
      <path d="M 1 7 L 1 1 L 7 1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// KPI card
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function KpiCard({ label, value, hint, icon: Icon }: { label: string; value: string; hint: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-edge bg-surface p-3 transition-all duration-300 hover:-translate-y-1 hover:border-accent/30 hover:shadow-[0_24px_60px_-36px_rgba(10,46,26,0.32)] sm:rounded-2xl sm:p-5">
      {/* Glass shimmer */}
      <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl sm:rounded-2xl">
        <span className="velora-glass-shimmer absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
      </span>
      <div className="relative flex items-center justify-between gap-2">
        <p className="truncate text-[9px] uppercase tracking-[0.08em] text-subtle font-jetbrains sm:text-[10px] sm:tracking-widest">{label}</p>
        <Icon className="h-3.5 w-3.5 shrink-0 text-accent sm:h-4 sm:w-4" />
      </div>
      <p className="relative mt-1.5 text-xl font-bold text-heading font-raleway sm:mt-2 sm:text-3xl">{value}</p>
      <p className="relative mt-0.5 truncate text-[10px] text-subtle font-raleway sm:mt-1 sm:text-[11px]">{hint}</p>
    </div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Profile snapshot (enhanced with skills)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ProfileSnapshot({ name, headline, location, completeness, skills }: { name: string; headline: string; location: string; completeness: number; skills: string[] }) {
  const initials = (() => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  })();

  return (
    <section className="relative overflow-hidden rounded-xl border border-edge bg-surface p-4 transition-all duration-300 hover:border-accent/25 hover:shadow-[0_24px_60px_-42px_rgba(10,46,26,0.3)] sm:rounded-2xl sm:p-5">
      {/* Glass shimmer */}
      <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl sm:rounded-2xl">
        <span className="velora-glass-shimmer absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
      </span>

      <p className="relative text-[10px] uppercase tracking-[0.06em] text-subtle font-jetbrains sm:text-[11px] sm:tracking-[0.08em]">Your public profile</p>

      <div className="relative mt-3 flex items-center gap-2.5 sm:mt-4 sm:gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pill-bg text-sm font-bold text-accent font-jetbrains sm:h-12 sm:w-12">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-heading font-raleway sm:text-sm">{name}</p>
          <p className="truncate text-[11px] text-body font-raleway sm:text-xs">{headline}</p>
        </div>
      </div>

      <div className="relative mt-3 flex flex-wrap items-center gap-2 text-[11px] text-body font-jetbrains sm:mt-4 sm:text-xs">
        <span className="inline-flex items-center gap-1.5"><MapPin className="h-3 w-3 text-accent" />{location}</span>
      </div>

      {/* Top skills */}
      {skills.length > 0 && (
        <div className="relative mt-2.5 flex flex-wrap gap-1.5 sm:mt-3">
          {skills.slice(0, 4).map((s) => (
            <span key={s} className="rounded-full bg-pill-bg px-2 py-0.5 text-[9px] font-medium text-pill-text font-raleway sm:text-[10px]">{s}</span>
          ))}
        </div>
      )}

      {/* Completeness meter */}
      <div className="relative mt-4 sm:mt-5">
        <div className="flex items-center justify-between text-[10px] text-subtle font-jetbrains sm:text-[11px]">
          <span>Profile completeness</span>
          <span className="text-accent">{completeness}%</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-edge">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${completeness}%` }} />
        </div>
        {completeness < 100 && (
          <p className="mt-2 text-[10px] leading-relaxed text-body font-raleway sm:text-[11px]">
            Complete your profile to rank higher in company searches.
          </p>
        )}
      </div>

      <Link href="/talent/profile" className="relative mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-edge bg-page-alt px-3 py-2 text-[11px] font-semibold text-heading transition-all hover:border-accent/30 hover:text-accent font-raleway sm:mt-5 sm:px-4 sm:text-xs">
        <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5" />Edit profile
      </Link>
    </section>
  );
}

