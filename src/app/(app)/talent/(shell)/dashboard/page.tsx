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
  // Terminal state — passed every stage, live in the talent pool.
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
// PIPELINE VIEW — pending / in review / rejected / assessment / interview
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
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-24 sm:px-6 sm:pt-32 lg:px-8">
      <span className="mb-3 inline-block text-xs uppercase tracking-[0.08em] text-accent font-jetbrains">
        Your application
      </span>

      {/* Hero — tone matches pipeline status */}
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
            Hi {firstName} — you&apos;re in the queue.
          </h1>
          <p className="mt-3 text-base leading-relaxed text-body font-libre italic">
            We&apos;ll be in touch within 24 hours about your next step.
          </p>
        </>
      )}

      {/* AI grade preview — only when we still have the analysis & the
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
              {analysis.overall_score}/100 ·{" "}
              <span className="text-accent">
                {analysis.expertise_level ?? "—"}
              </span>
            </p>
            <p className="mt-1 text-xs text-body font-raleway">
              Tap to view the full breakdown.
            </p>
          </div>
        </Link>
      )}

      {/* Pipeline */}
      <div className="mt-10 space-y-3">
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
              ? "Complete — see your grade above."
              : analysis?.status === "pending"
              ? "Running right now…"
              : analysis?.status === "failed"
              ? "Something went wrong. Re-run from stage 2."
              : "Queued — we'll kick this off shortly."
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
              ? "You're through — congrats."
              : failedAt === "review"
              ? "Not this time. Reapply when ready."
              : analysis?.status === "ready"
              ? "In review — we'll email you within 24 hours."
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
              ? "Cleared the technical bar — on to the interview."
              : failedAt === "technical"
              ? "Not this time. Review the feedback above."
              : reviewStatus === "approved"
              ? "Active — watch your inbox for the assessment link."
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
              ? "Up next — we'll propose time windows by email."
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
        Nice work {firstName} — you&apos;re through.
      </h1>
      <p className="mt-3 text-base leading-relaxed text-body font-libre italic">
        Our team has reviewed your application. Next up is a lightweight
        technical assessment tailored to your expertise. We&apos;ll email
        you the link shortly — it usually takes 45–60 minutes and you can
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
        windows — once that&apos;s through, your profile goes live to
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
      : "We've decided not to move forward at this time. This isn't final — use the time to deepen your portfolio and come back stronger.";

  return (
    <div className="rounded-2xl border-2 border-amber-500/40 bg-linear-to-br from-amber-500/5 via-surface to-surface p-6 sm:p-8">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.08em] text-amber-600 font-jetbrains">
        <XCircle className="h-3.5 w-3.5" />
        Not this time
      </div>
      <h1 className="text-2xl font-bold text-heading sm:text-3xl font-raleway">
        Thanks {firstName} — {headline.toLowerCase()}.
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
    <div className="flex items-center gap-4 rounded-2xl border border-edge bg-surface p-5">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${badge}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <span className="text-[11px] uppercase tracking-[0.08em] text-accent font-jetbrains">
            {num}
          </span>
          <p className="text-sm font-semibold text-heading font-raleway">
            {title}
          </p>
        </div>
        <p className="mt-0.5 text-xs text-body font-raleway">{subtitle}</p>
      </div>
    </div>
  );
}

// =====================================================================
// LIVE TALENT DASHBOARD — interview passed, profile is live
// =====================================================================

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

  // Profile completeness — cheap heuristic that rewards filling the
  // stage-1 fields that actually show up to employers.
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
    (completenessChecks.filter(Boolean).length / completenessChecks.length) *
      100
  );

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-24 sm:px-6 sm:pt-28 lg:px-8">
      {/* Hero */}
      <section className="overflow-hidden rounded-2xl border-[3px] border-accent bg-linear-to-br from-accent/10 via-surface to-surface p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[10px] uppercase tracking-[0.08em] text-accent font-jetbrains">
            <Trophy className="h-3 w-3" />
            Live on Veloraa
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-edge bg-surface px-3 py-1 text-[10px] uppercase tracking-[0.08em] text-body font-jetbrains">
            <Zap className="h-3 w-3 text-accent" />
            Top 1% verified
          </span>
        </div>
        <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-heading sm:text-4xl font-raleway">
              Welcome back, {firstName}.
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-body font-libre italic">
              Your profile is live to pre-vetted employers. Keep it fresh,
              reply quickly, and the best roles come to you.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/talent/messages"
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-xs font-semibold text-white transition-all hover:opacity-90 hover:shadow-[0_0_24px_rgba(74,222,128,0.35)] font-raleway"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Open messages
              </Link>
              <Link
                href="/talent/jobs"
                className="inline-flex items-center gap-1.5 rounded-lg border border-ghost-border bg-surface px-5 py-2.5 text-xs font-semibold text-heading transition-all hover:border-accent/30 hover:text-accent hover:shadow-[0_12px_30px_-20px_rgba(74,222,128,0.45)] font-raleway"
              >
                <Briefcase className="h-3.5 w-3.5" />
                Browse jobs
              </Link>
            </div>
          </div>

          {/* AI grade mini-card */}
          {scorePct != null && (
            <div className="flex shrink-0 items-center gap-3 rounded-xl border border-accent/30 bg-surface/70 px-5 py-4 backdrop-blur-sm">
              <div className="relative flex h-14 w-14 items-center justify-center">
                <svg
                  className="absolute inset-0 h-14 w-14 -rotate-90"
                  viewBox="0 0 44 44"
                >
                  <circle
                    cx="22"
                    cy="22"
                    r="18"
                    className="stroke-edge"
                    fill="none"
                    strokeWidth="4"
                  />
                  <circle
                    cx="22"
                    cy="22"
                    r="18"
                    className="stroke-accent"
                    fill="none"
                    strokeWidth="4"
                    strokeDasharray={`${(scorePct / 100) * 113.1} 113.1`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="relative text-sm font-bold text-heading font-jetbrains">
                  {scorePct}
                </span>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.08em] text-accent font-jetbrains">
                  AI grade
                </p>
                <p className="text-sm font-semibold text-heading font-raleway">
                  {level ?? "Engineer"}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* KPI strip */}
      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <KpiCard label="Profile views" value="0" hint="Last 30 days" icon={Eye} />
        <KpiCard label="Inbound messages" value="0" hint="From hiring teams" icon={MessageSquare} />
        <KpiCard label="Saved roles" value="0" hint="Across all companies" icon={Bookmark} />
        <KpiCard label="Interview offers" value="0" hint="Pending response" icon={CalendarClock} />
      </section>

      {/* Main grid */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* LEFT: opportunities feed + recent activity */}
        <div className="space-y-6 lg:col-span-2">
          <OpportunitiesCard displayName={displayName} headline={headline} />
          <RecentActivity />
        </div>

        {/* RIGHT: profile snapshot + quick actions */}
        <aside className="space-y-6">
          <ProfileSnapshot
            name={displayName}
            headline={headline}
            location={location}
            completeness={completeness}
          />
          <AvailabilityCard />
          <QuickActions />
        </aside>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Live dashboard parts
// ---------------------------------------------------------------------

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-edge bg-surface p-4 transition-all duration-300 hover:-translate-y-1 hover:border-accent/30 hover:shadow-[0_24px_60px_-36px_rgba(10,46,26,0.32)] sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.1em] text-subtle font-jetbrains">
          {label}
        </p>
        <Icon className="h-4 w-4 text-accent" />
      </div>
      <p className="mt-2 text-2xl font-bold text-heading sm:text-3xl font-raleway">
        {value}
      </p>
      <p className="mt-1 text-[11px] text-subtle font-raleway">{hint}</p>
    </div>
  );
}

interface FakeOpportunity {
  id: string;
  company: string;
  title: string;
  location: string;
  stack: string[];
  compensation: string;
  matchScore: number;
  locked?: boolean;
}

const FAKE_OPPS: readonly FakeOpportunity[] = [
  {
    id: "o1",
    company: "Halcyon Labs",
    title: "Senior Backend Engineer · Payments",
    location: "Remote · EU",
    stack: ["TypeScript", "Postgres", "AWS"],
    compensation: "€110–140k",
    matchScore: 94,
  },
  {
    id: "o2",
    company: "Meridian AI",
    title: "Staff ML Engineer · Evaluation",
    location: "London, UK · Hybrid",
    stack: ["Python", "PyTorch", "Ray"],
    compensation: "£140–180k",
    matchScore: 89,
  },
  {
    id: "o3",
    company: "Sable",
    title: "Full-stack Engineer · 0→1 product",
    location: "Berlin · On-site",
    stack: ["Next.js", "Supabase", "Tailwind"],
    compensation: "€95–120k",
    matchScore: 86,
    locked: true,
  },
] as const;

function OpportunitiesCard({
  displayName,
  headline,
}: {
  displayName: string;
  headline: string;
}) {
  return (
    <section className="rounded-2xl border border-edge bg-surface p-5 transition-all duration-300 hover:border-accent/25 hover:shadow-[0_24px_60px_-42px_rgba(10,46,26,0.3)] sm:p-6">
      <header className="mb-5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.08em] text-accent font-jetbrains">
            Top matches for you
          </p>
          <h2 className="mt-1 truncate text-lg font-bold text-heading font-raleway">
            Hand-picked for {displayName.split(" ")[0]}
          </h2>
          <p className="mt-0.5 truncate text-xs text-body font-raleway">
            Based on {headline.toLowerCase()} and your declared skills.
          </p>
        </div>
        <Link
          href="/talent/jobs"
          className="shrink-0 text-[11px] uppercase tracking-[0.08em] text-accent transition-opacity hover:opacity-80 font-jetbrains"
        >
          View all
        </Link>
      </header>

      <div className="space-y-3">
        {FAKE_OPPS.map((o) =>
          o.locked ? (
            <LockedOpportunityRow key={o.id} opp={o} />
          ) : (
            <OpportunityRow key={o.id} opp={o} />
          )
        )}
      </div>
    </section>
  );
}

function OpportunityRow({ opp }: { opp: FakeOpportunity }) {
  return (
    <article className="group flex flex-col gap-3 rounded-xl border border-edge bg-page-alt p-4 transition-all hover:border-accent/40 sm:flex-row sm:items-center sm:gap-5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface text-accent">
        <Building2 className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-heading font-raleway">
            {opp.title}
          </p>
          <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-accent font-jetbrains">
            <Star className="h-3 w-3" />
            {opp.matchScore}% match
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-body font-raleway">
          {opp.company} · {opp.location} · {opp.compensation}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {opp.stack.map((s) => (
            <span
              key={s}
              className="rounded-full bg-pill-bg px-2 py-0.5 text-[10px] font-medium text-pill-text font-raleway"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 sm:flex-col sm:items-end">
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-1.5 rounded-lg border border-edge bg-surface px-3 py-1.5 text-[11px] font-semibold text-heading transition-opacity hover:opacity-80 disabled:opacity-70 font-raleway"
        >
          <Bookmark className="h-3 w-3" />
          Save
        </button>
        <Link
          href="/talent/jobs"
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[11px] font-semibold text-white transition-all hover:opacity-90 hover:shadow-[0_12px_30px_-18px_rgba(74,222,128,0.45)] font-raleway"
        >
          View role
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    </article>
  );
}

function LockedOpportunityRow({ opp }: { opp: FakeOpportunity }) {
  return (
    <article className="relative overflow-hidden rounded-xl border border-dashed border-edge bg-page-alt p-4">
      <div className="pointer-events-none select-none blur-[3px]">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface text-accent">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-heading font-raleway">
              {opp.title}
            </p>
            <p className="mt-0.5 truncate text-xs text-body font-raleway">
              {opp.company} · {opp.location} · {opp.compensation}
            </p>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center gap-3 bg-surface/60 px-4 backdrop-blur-[2px]">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
          <Lock className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-heading font-raleway">
            Finish your profile to unlock more matches
          </p>
          <p className="mt-0.5 text-[11px] text-body font-raleway">
            Add at least one portfolio link and a resume.
          </p>
        </div>
      </div>
    </article>
  );
}

function RecentActivity() {
  return (
    <section className="rounded-2xl border border-edge bg-surface p-5 transition-all duration-300 hover:border-accent/25 hover:shadow-[0_24px_60px_-42px_rgba(10,46,26,0.3)] sm:p-6">
      <header className="mb-4">
        <p className="text-[11px] uppercase tracking-[0.08em] text-accent font-jetbrains">
          Recent activity
        </p>
        <h2 className="mt-1 text-lg font-bold text-heading font-raleway">
          What&apos;s been happening
        </h2>
      </header>

      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-edge bg-page-alt px-6 py-10 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pill-bg text-accent">
          <LineChart className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-heading font-raleway">
            Activity will appear here
          </p>
          <p className="mt-1 max-w-sm text-xs text-body font-raleway">
            As companies view your profile, save you, or reach out,
            you&apos;ll see it all here in one feed.
          </p>
        </div>
      </div>
    </section>
  );
}

function ProfileSnapshot({
  name,
  headline,
  location,
  completeness,
}: {
  name: string;
  headline: string;
  location: string;
  completeness: number;
}) {
  const initials = (() => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  })();

  return (
    <section className="rounded-2xl border border-edge bg-surface p-5 transition-all duration-300 hover:border-accent/25 hover:shadow-[0_24px_60px_-42px_rgba(10,46,26,0.3)]">
      <p className="text-[11px] uppercase tracking-[0.08em] text-subtle font-jetbrains">
        Your public profile
      </p>
      <div className="mt-4 flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pill-bg text-sm font-bold text-accent font-jetbrains">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-heading font-raleway">
            {name}
          </p>
          <p className="truncate text-xs text-body font-raleway">{headline}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-body font-jetbrains">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-3 w-3 text-accent" />
          {location}
        </span>
      </div>

      {/* Completeness meter */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-[11px] text-subtle font-jetbrains">
          <span>Profile completeness</span>
          <span className="text-accent">{completeness}%</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-edge">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${completeness}%` }}
          />
        </div>
        {completeness < 100 && (
          <p className="mt-2 text-[11px] text-body font-raleway">
            Complete your profile to rank higher in company searches.
          </p>
        )}
      </div>

      <button
        type="button"
        disabled
        className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-edge bg-page-alt px-4 py-2 text-xs font-semibold text-heading transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60 font-raleway"
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit profile
      </button>
    </section>
  );
}

function AvailabilityCard() {
  return (
    <section className="rounded-2xl border border-edge bg-surface p-5 transition-all duration-300 hover:border-accent/25 hover:shadow-[0_24px_60px_-42px_rgba(10,46,26,0.3)]">
      <p className="text-[11px] uppercase tracking-[0.08em] text-subtle font-jetbrains">
        Availability
      </p>
      <p className="mt-2 text-sm font-semibold text-heading font-raleway">
        Open to offers
      </p>
      <p className="mt-1 text-xs text-body font-raleway">
        You&apos;ll appear in company searches and can receive inbound
        messages.
      </p>

      <div className="mt-4 divide-y divide-edge overflow-hidden rounded-xl border border-edge">
        <AvailabilityRow
          label="Open to offers"
          sub="Visible, receive messages"
          active
        />
        <AvailabilityRow
          label="Only top matches"
          sub="Hidden from broad search"
        />
        <AvailabilityRow
          label="Taking a break"
          sub="Profile paused for 30 days"
        />
      </div>
    </section>
  );
}

function AvailabilityRow({
  label,
  sub,
  active = false,
}: {
  label: string;
  sub: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      disabled
      className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
        active
          ? "bg-accent/5"
          : "bg-surface hover:bg-page-alt/50"
      } disabled:cursor-not-allowed`}
    >
      <span>
        <span className="block text-sm font-semibold text-heading font-raleway">
          {label}
        </span>
        <span className="block text-[11px] text-subtle font-jetbrains">
          {sub}
        </span>
      </span>
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
          active
            ? "border-accent bg-accent text-white"
            : "border-edge bg-surface"
        }`}
        aria-hidden
      >
        {active && <CheckCircle2 className="h-3 w-3" />}
      </span>
    </button>
  );
}

function QuickActions() {
  return (
    <section className="rounded-2xl border border-edge bg-surface p-5 transition-all duration-300 hover:border-accent/25 hover:shadow-[0_24px_60px_-42px_rgba(10,46,26,0.3)]">
      <p className="text-[11px] uppercase tracking-[0.08em] text-subtle font-jetbrains">
        Quick actions
      </p>
      <ul className="mt-3 space-y-2">
        <QuickActionItem
          href="/talent/jobs"
          icon={Briefcase}
          label="Browse available jobs"
        />
        <QuickActionItem
          href="/talent/invites"
          icon={Users}
          label="Open invites"
        />
        <QuickActionItem
          href="/talent/messages"
          icon={MessageSquare}
          label="Messages inbox"
        />
        <QuickActionItem
          href="/talent/notifications"
          icon={Bell}
          label="Notification center"
        />
        <QuickActionItem
          href="/profile"
          icon={FileText}
          label="Profile and role"
        />
        <QuickActionItem
          href="/talent/settings"
          icon={Settings}
          label="Account settings"
        />
      </ul>
    </section>
  );
}

function QuickActionItem({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="group flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2 text-left text-sm text-body transition-all hover:border-edge hover:bg-page-alt hover:text-heading hover:shadow-[0_12px_28px_-22px_rgba(10,46,26,0.3)] font-raleway"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-pill-bg text-accent">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="flex-1">{label}</span>
        <ArrowRight className="h-3.5 w-3.5 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
      </Link>
    </li>
  );
}
