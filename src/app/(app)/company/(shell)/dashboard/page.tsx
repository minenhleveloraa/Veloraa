import Link from "next/link";
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Plus,
  Send,
  Sparkles,
  Target,
  Trophy,
  Users,
  XCircle,
} from "lucide-react";
import { requireCompany } from "@/lib/company/guard";
import { planFor } from "@/lib/company/options";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import HiringPulseCard, {
  type PulseDay,
} from "@/components/company/dashboard/HiringPulseCard";
import JobsFeed, {
  type JobsFeedItem,
} from "@/components/company/dashboard/JobsFeed";
import DashboardBackdrop from "@/components/company/dashboard/DashboardBackdrop";

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------

interface SuggestedTalentItem {
  userId: string;
  fullName: string | null;
  headline: string | null;
  skills: string[];
  overallScore: number | null;
  expertiseLevel: string | null;
  jobTitle: string | null;
  jobId: string;
}

// ---------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------

export const metadata = {
  title: "Overview · Veloraa",
};

export default async function CompanyDashboardPage() {
  const { profile, application } = await requireCompany();
  const supabase = await createClient();
  const userId = profile.id;

  // ── Logo signed URL ────────────────────────────────────────────────
  let logoUrl: string | null = null;
  if (application?.logo_path) {
    const { data, error } = await supabase.storage
      .from("company-logos")
      .createSignedUrl(application.logo_path, 60 * 10);
    if (!error) logoUrl = data?.signedUrl ?? null;
  }

  const firstName = profile.full_name?.split(" ")[0] ?? "there";
  const companyName = application?.legal_name ?? "your company";
  const reviewStatus = application?.review_status ?? "pending";
  const planName = planFor(application?.selected_plan)?.name ?? "Free";
  const isApproved = reviewStatus === "approved";

  // ── Data: only meaningful once approved ────────────────────────────
  let totalJobs = 0;
  let activeJobs = 0;
  let pendingJobs = 0;
  let recentJobs: JobsFeedItem[] = [];
  let pulseDays: PulseDay[] = buildEmptyPulseDays();
  let prevWeekTotal = 0;
  let invitesSent = 0;
  let invitesAccepted = 0;
  let suggestedTalent: SuggestedTalentItem[] = [];

  if (isApproved) {
    const fourteenDaysAgo = startOfUTCDay(daysAgo(13));

    const [
      totalRes,
      activeRes,
      pendingRes,
      recentRes,
      activityRes,
      invitesSentRes,
      invitesAcceptedRes,
      invitesActivityRes,
    ] = await Promise.all([
      supabase
        .from("company_jobs")
        .select("id", { count: "exact", head: true })
        .eq("company_id", userId),
      supabase
        .from("company_jobs")
        .select("id", { count: "exact", head: true })
        .eq("company_id", userId)
        .eq("status", "published"),
      supabase
        .from("company_jobs")
        .select("id", { count: "exact", head: true })
        .eq("company_id", userId)
        .eq("status", "pending_review"),
      supabase
        .from("company_jobs")
        .select(
          "id, title, status, role_category, seniority, employment_type, work_arrangement, location, description, created_at"
        )
        .eq("company_id", userId)
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("company_jobs")
        .select("created_at")
        .eq("company_id", userId)
        .gte("created_at", fourteenDaysAgo.toISOString()),
      // `interview_invitations` is approved-only and may not yet have any
      // rows; safe to query and gracefully fall back to 0 on any error.
      supabase
        .from("interview_invitations")
        .select("id", { count: "exact", head: true })
        .eq("company_user_id", userId),
      supabase
        .from("interview_invitations")
        .select("id", { count: "exact", head: true })
        .eq("company_user_id", userId)
        .eq("status", "accepted"),
      supabase
        .from("interview_invitations")
        .select("created_at")
        .eq("company_user_id", userId)
        .gte("created_at", fourteenDaysAgo.toISOString()),
    ]);

    totalJobs = totalRes.count ?? 0;
    activeJobs = activeRes.count ?? 0;
    pendingJobs = pendingRes.count ?? 0;
    invitesSent = invitesSentRes.error ? 0 : (invitesSentRes.count ?? 0);
    invitesAccepted = invitesAcceptedRes.error
      ? 0
      : (invitesAcceptedRes.count ?? 0);

    recentJobs = (recentRes.data ?? []).map(toFeedItem);

    // ── Fetch recommended talent (admin picks) ──────────────────────
    const admin = createAdminClient();
    // Get published job IDs for this company
    const { data: publishedJobs } = await admin
      .from("company_jobs")
      .select("id, title")
      .eq("company_id", userId)
      .eq("status", "published");
    const pubJobs = (publishedJobs ?? []) as { id: string; title: string }[];

    if (pubJobs.length > 0) {
      const jobIds = pubJobs.map((j) => j.id);
      const jobTitleMap = new Map(pubJobs.map((j) => [j.id, j.title]));

      const { data: recsData } = await admin
        .from("job_recommendations")
        .select("talent_user_id, job_id, note")
        .in("job_id", jobIds)
        .limit(6);
      const recs = (recsData ?? []) as { talent_user_id: string; job_id: string; note: string | null }[];

      if (recs.length > 0) {
        const talentIds = [...new Set(recs.map((r) => r.talent_user_id))];
        const [profilesRes2, appsRes, analysesRes2] = await Promise.all([
          admin.from("profiles").select("id, full_name").in("id", talentIds),
          admin.from("talent_applications").select("user_id, headline, skills, location").in("user_id", talentIds),
          admin.from("talent_ai_analyses").select("user_id, overall_score, expertise_level").in("user_id", talentIds),
        ]);

        const pMap = new Map(((profilesRes2.data ?? []) as { id: string; full_name: string | null }[]).map((p) => [p.id, p]));
        const aMap = new Map(((appsRes.data ?? []) as { user_id: string; headline: string | null; skills: string[]; location: string | null }[]).map((a) => [a.user_id, a]));
        const sMap = new Map(((analysesRes2.data ?? []) as { user_id: string; overall_score: number | null; expertise_level: string | null }[]).map((s) => [s.user_id, s]));

        suggestedTalent = recs.map((r) => ({
          userId: r.talent_user_id,
          fullName: pMap.get(r.talent_user_id)?.full_name ?? null,
          headline: aMap.get(r.talent_user_id)?.headline ?? null,
          skills: aMap.get(r.talent_user_id)?.skills ?? [],
          overallScore: sMap.get(r.talent_user_id)?.overall_score ?? null,
          expertiseLevel: sMap.get(r.talent_user_id)?.expertise_level ?? null,
          jobTitle: jobTitleMap.get(r.job_id) ?? null,
          jobId: r.job_id,
        }));
      }
    }

    // Combine job-creation events + invitation-sent events into a 14-day
    // activity series, then split into "this week" and "last week".
    const events: string[] = [
      ...(activityRes.data ?? []).map((r) => r.created_at as string),
      ...((invitesActivityRes.error ? [] : invitesActivityRes.data ?? []).map(
        (r) => r.created_at as string
      )),
    ];
    const series = bucketTwoWeeks(events);
    pulseDays = series.thisWeek;
    prevWeekTotal = series.prevWeekTotal;
  }

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="relative isolate">
      <DashboardBackdrop />
      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pt-10">
        {reviewStatus === "approved" ? (
          <ApprovedHero
            firstName={firstName}
            companyName={companyName}
            logoUrl={logoUrl}
            planName={planName}
            activeJobs={activeJobs}
            pendingJobs={pendingJobs}
          />
        ) : reviewStatus === "rejected" ? (
          <RejectedHero
            firstName={firstName}
            companyName={companyName}
            logoUrl={logoUrl}
            reason={application?.review_reason}
            reapplyAfter={application?.reapply_after}
          />
        ) : (
          <PendingHero
            firstName={firstName}
            companyName={companyName}
            logoUrl={logoUrl}
          />
        )}

        {isApproved ? (
          <ApprovedDashboard
            planName={planName}
            totalJobs={totalJobs}
            invitesSent={invitesSent}
            invitesAccepted={invitesAccepted}
            recentJobs={recentJobs}
            pulseDays={pulseDays}
            prevWeekTotal={prevWeekTotal}
            suggestedTalent={suggestedTalent}
          />
        ) : (
          <PendingPipeline
            submittedAt={application?.stage_1_submitted_at}
            status={reviewStatus}
          />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Hero variants — preserved with light polish
// ─────────────────────────────────────────────────────────────────────

function HeroLogo({
  companyName,
  firstName,
  logoUrl,
  accent = false,
  size = "lg",
}: {
  companyName: string;
  firstName: string;
  logoUrl: string | null;
  accent?: boolean;
  size?: "lg" | "md";
}) {
  const initial = (
    companyName.trim().charAt(0) ||
    firstName.trim().charAt(0) ||
    "C"
  ).toUpperCase();

  const sizeClasses =
    size === "lg"
      ? "h-24 w-24 sm:h-28 sm:w-28 rounded-[2rem]"
      : "h-20 w-20 sm:h-24 sm:w-24 rounded-[1.75rem]";

  const ringColor = accent
    ? "ring-accent/40 shadow-[0_0_40px_-8px_rgba(74,222,128,0.5)]"
    : "ring-edge shadow-[0_0_30px_-8px_rgba(0,0,0,0.3)]";

  return (
    <div className="relative flex-shrink-0">
      <div
        aria-hidden
        className={`absolute inset-0 -m-2 rounded-full blur-2xl ${
          accent
            ? "bg-accent/15"
            : "bg-gradient-to-br from-accent/10 to-transparent"
        }`}
      />
      <div
        className={`relative flex items-center justify-center overflow-hidden ring-[3px] ${sizeClasses} ${ringColor} ${
          accent ? "bg-white" : "bg-surface border border-edge"
        }`}
      >
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={`${companyName} logo`}
            className="h-full w-full object-cover"
          />
        ) : (
          <span
            className={`font-bold uppercase font-raleway ${
              size === "lg"
                ? "text-4xl sm:text-5xl"
                : "text-3xl sm:text-4xl"
            } ${accent ? "text-accent" : "text-heading"}`}
          >
            {initial}
          </span>
        )}
      </div>
    </div>
  );
}

function PendingHero({
  firstName,
  companyName,
  logoUrl,
}: {
  firstName: string;
  companyName: string;
  logoUrl: string | null;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-edge bg-surface p-6 sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-amber-500/5 blur-3xl"
      />

      <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-7">
        <HeroLogo
          companyName={companyName}
          firstName={firstName}
          logoUrl={logoUrl}
          size="md"
        />

        <div className="flex-1 text-center sm:text-left">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.08em] text-amber-600 font-jetbrains">
            <Clock className="h-3.5 w-3.5" />
            Under review
          </div>
          <p className="mb-1 text-[10px] uppercase tracking-[0.12em] text-subtle font-jetbrains">
            {companyName}
          </p>
          <h1 className="text-2xl font-bold text-heading sm:text-3xl lg:text-4xl font-raleway">
            Thanks {firstName} — you&apos;re in the queue.
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-body font-libre italic">
            We review every new company by hand. You&apos;ll hear from us
            within 24 hours — once approved you can post your first job and
            see pre-vetted shortlists delivered to your inbox.
          </p>
        </div>
      </div>
    </section>
  );
}

function ApprovedHero({
  firstName,
  companyName,
  logoUrl,
  planName,
  activeJobs,
  pendingJobs,
}: {
  firstName: string;
  companyName: string;
  logoUrl: string | null;
  planName: string;
  activeJobs: number;
  pendingJobs: number;
}) {
  // Server-rendered "system status" stamps. Always UTC so the value is
  // consistent regardless of the user's locale and reads as a futuristic
  // node identifier rather than a personal clock.
  const now = new Date();
  const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, ".");
  const timeStamp = now.toISOString().slice(11, 16);

  return (
    <section className="group relative overflow-hidden rounded-[2rem] border border-accent/30 bg-gradient-to-br from-surface via-surface to-page-alt p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.35)] sm:p-9">
      {/* Inset highlight ring */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-accent/15"
      />

      {/* Layer 1 — futuristic dot-grid */}
      <svg
        aria-hidden
        className="absolute inset-0 h-full w-full text-heading opacity-[0.05]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="hero-grid"
            x="0"
            y="0"
            width="22"
            height="22"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="1" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-grid)" />
      </svg>

      {/* Layer 2 — concentric topographic rings, top-right, slowly rotating */}
      <svg
        aria-hidden
        viewBox="0 0 400 400"
        className="velora-orbit-reverse absolute -right-32 -top-32 h-[26rem] w-[26rem] text-accent opacity-[0.30]"
      >
        <g fill="none" stroke="currentColor" strokeWidth="0.6">
          <ellipse cx="200" cy="200" rx="190" ry="118" />
          <ellipse cx="200" cy="200" rx="160" ry="100" />
          <ellipse cx="200" cy="200" rx="130" ry="82" />
          <ellipse cx="200" cy="200" rx="100" ry="64" />
          <ellipse cx="200" cy="200" rx="70" ry="45" />
          <ellipse cx="200" cy="200" rx="40" ry="26" />
          <ellipse cx="200" cy="200" rx="15" ry="10" />
        </g>
        <circle
          cx="200"
          cy="200"
          r="4"
          fill="currentColor"
          opacity="0.7"
        />
      </svg>

      {/* Layer 3 — soft accent glow at the bottom-left */}
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-accent/12 blur-3xl"
      />

      {/* Layer 4 — corner cut marks (sci-fi UI accents) */}
      <CornerMark className="left-3 top-3" rotate={0} />
      <CornerMark className="right-3 top-3" rotate={90} />
      <CornerMark className="right-3 bottom-3" rotate={180} />
      <CornerMark className="left-3 bottom-3" rotate={270} />

      {/* Layer 5 — animated scan beam at the bottom edge */}
      <span
        aria-hidden
        className="absolute inset-x-6 bottom-0 h-px overflow-hidden"
      >
        <span className="velora-scan block h-full w-1/2 bg-gradient-to-r from-transparent via-accent to-transparent" />
      </span>

      {/* ── Content ────────────────────────────────────────────────── */}
      <div className="relative">
        {/* System status eyebrow row */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-[10px] uppercase tracking-[0.18em] font-jetbrains">
          <div className="flex items-center gap-2 text-accent">
            <span className="relative flex h-2 w-2">
              <span
                aria-hidden
                className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60"
              />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            SYS · ONLINE
          </div>
          <div className="flex items-center gap-3 text-subtle">
            <span className="hidden sm:inline">
              NODE · {firstName.slice(0, 3).toUpperCase() || "VEL"}
            </span>
            <span aria-hidden className="hidden h-3 w-px bg-edge sm:inline-block" />
            <span>{dateStamp}</span>
            <span aria-hidden className="h-3 w-px bg-edge" />
            <span>{timeStamp} UTC</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
          <FuturisticHeroLogo
            companyName={companyName}
            firstName={firstName}
            logoUrl={logoUrl}
          />

          <div className="flex-1 text-center sm:text-left">
            <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-subtle font-jetbrains">
              {companyName}
            </p>
            <h1 className="text-3xl font-bold leading-[1.05] text-heading sm:text-4xl lg:text-5xl font-raleway">
              Welcome back, <span className="text-accent">{firstName}</span>.
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-body font-libre italic">
              {activeJobs > 0
                ? `${activeJobs} role${activeJobs === 1 ? " is" : "s are"} live across Veloraa. Here's how the week is shaping up.`
                : "Post a role to start receiving a shortlist of pre-vetted candidates within 48 hours."}
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[11px] uppercase tracking-[0.08em] text-accent font-jetbrains">
                <Trophy className="h-3.5 w-3.5" />
                Approved
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-edge bg-surface/60 px-3 py-1 text-[11px] uppercase tracking-[0.08em] text-body font-jetbrains backdrop-blur-sm">
                {planName} plan
              </span>
              {pendingJobs > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.08em] text-amber-600 font-jetbrains">
                  {pendingJobs} job{pendingJobs === 1 ? "" : "s"} in review
                </span>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Link
                href="/company/jobs/new"
                className="group/cta inline-flex items-center justify-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-xs font-semibold text-white transition-all hover:-translate-y-0.5 hover:opacity-95 hover:shadow-[0_0_28px_rgba(74,222,128,0.5)] font-raleway"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={3} />
                Post a job
                <span
                  aria-hidden
                  className="ml-1 h-1 w-1 rounded-full bg-white/80 transition-transform group-hover/cta:scale-150"
                />
              </Link>
              <Link
                href="/company/candidates"
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-edge bg-surface/60 px-5 py-2.5 text-xs font-semibold text-heading backdrop-blur-sm transition-all hover:border-accent/40 hover:text-accent font-raleway"
              >
                <Users className="h-3.5 w-3.5" />
                Browse candidates
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Futuristic logo halo — twin orbiting dashed rings + cardinal ticks
// ─────────────────────────────────────────────────────────────────────

function FuturisticHeroLogo({
  companyName,
  firstName,
  logoUrl,
}: {
  companyName: string;
  firstName: string;
  logoUrl: string | null;
}) {
  const initial = (
    companyName.trim().charAt(0) ||
    firstName.trim().charAt(0) ||
    "C"
  ).toUpperCase();

  return (
    <div className="relative h-32 w-32 shrink-0 sm:h-36 sm:w-36">
      {/* Outer halo */}
      <span
        aria-hidden
        className="absolute inset-0 -m-3 rounded-full bg-accent/10 blur-2xl"
      />

      {/* Outer rotating dashed ring */}
      <svg
        aria-hidden
        viewBox="0 0 120 120"
        className="velora-orbit absolute inset-[-18px] h-[calc(100%+36px)] w-[calc(100%+36px)] text-accent"
      >
        <circle
          cx="60"
          cy="60"
          r="58"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeDasharray="2 6"
          opacity="0.55"
        />
      </svg>

      {/* Inner reverse rotating thin ring */}
      <svg
        aria-hidden
        viewBox="0 0 120 120"
        className="velora-orbit-reverse absolute inset-[-32px] h-[calc(100%+64px)] w-[calc(100%+64px)] text-accent"
      >
        <circle
          cx="60"
          cy="60"
          r="58"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          strokeDasharray="1 14"
          opacity="0.4"
        />
      </svg>

      {/* Cardinal tick marks (static, layered above the rings) */}
      <svg
        aria-hidden
        viewBox="0 0 120 120"
        className="absolute inset-[-18px] h-[calc(100%+36px)] w-[calc(100%+36px)] text-accent"
      >
        <g stroke="currentColor" strokeWidth="1.4" opacity="0.6">
          <line x1="60" y1="1" x2="60" y2="7" />
          <line x1="60" y1="113" x2="60" y2="119" />
          <line x1="1" y1="60" x2="7" y2="60" />
          <line x1="113" y1="60" x2="119" y2="60" />
        </g>
      </svg>

      {/* Logo plate */}
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[1.75rem] bg-white shadow-[0_0_50px_-10px_rgba(74,222,128,0.55)] ring-[3px] ring-accent/40">
        {logoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={logoUrl}
            alt={`${companyName} logo`}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-4xl font-bold uppercase text-accent font-raleway sm:text-5xl">
            {initial}
          </span>
        )}
      </div>

      {/* Tiny status chip floating below-right */}
      <span
        aria-hidden
        className="velora-pulse-soft absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-accent/40 bg-page text-accent shadow-md"
      >
        <span className="h-2 w-2 rounded-full bg-accent" />
      </span>
    </div>
  );
}

// Small sci-fi corner mark used at each corner of the hero card.
function CornerMark({
  className,
  rotate,
}: {
  className?: string;
  rotate: 0 | 90 | 180 | 270;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      fill="none"
      className={`absolute h-3.5 w-3.5 text-accent/55 ${className ?? ""}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <path
        d="M 1 7 L 1 1 L 7 1"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RejectedHero({
  firstName,
  companyName,
  logoUrl,
  reason,
  reapplyAfter,
}: {
  firstName: string;
  companyName: string;
  logoUrl: string | null;
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

  return (
    <section className="relative overflow-hidden rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/5 via-surface to-surface p-6 sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-amber-500/5 blur-3xl"
      />

      <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-7">
        <HeroLogo
          companyName={companyName}
          firstName={firstName}
          logoUrl={logoUrl}
          size="md"
        />

        <div className="flex-1 text-center sm:text-left">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.08em] text-amber-600 font-jetbrains">
            <XCircle className="h-3.5 w-3.5" />
            Not this time
          </div>
          <p className="mb-1 text-[10px] uppercase tracking-[0.12em] text-subtle font-jetbrains">
            {companyName}
          </p>
          <h1 className="text-xl font-bold text-heading sm:text-2xl lg:text-3xl font-raleway">
            Thanks {firstName} — an update on your application.
          </h1>
          <p className="mt-3 text-base leading-relaxed text-body font-libre italic">
            We&apos;ve decided not to move forward at this time. Nothing is
            permanent — address the notes below and reapply when ready.
          </p>
          {reason && (
            <div className="mt-5 rounded-xl border border-edge bg-page-alt p-4 text-left">
              <p className="text-[11px] uppercase tracking-[0.08em] text-subtle font-jetbrains">
                Reviewer notes
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
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Approved dashboard — the main feed
// ─────────────────────────────────────────────────────────────────────

function ApprovedDashboard({
  planName,
  totalJobs,
  invitesSent,
  invitesAccepted,
  recentJobs,
  pulseDays,
  prevWeekTotal,
  suggestedTalent,
}: {
  planName: string;
  totalJobs: number;
  invitesSent: number;
  invitesAccepted: number;
  recentJobs: JobsFeedItem[];
  pulseDays: PulseDay[];
  prevWeekTotal: number;
  suggestedTalent: SuggestedTalentItem[];
}) {
  const isFree = planName.toLowerCase() === "free";
  const hires = invitesAccepted; // proxy until a dedicated "hires" event exists

  return (
    <div className="mt-8 space-y-6">
      {/* ── Row 1: Pulse + Jobs feed ─────────────────────────────── */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <HiringPulseCard
            days={pulseDays}
            prevWeekTotal={prevWeekTotal}
            unit="events"
          />
        </div>
        <div className="lg:col-span-1">
          <JobsFeed jobs={recentJobs} />
        </div>
      </section>

      {/* ── Row 2: Suggested talent + Upgrade + Funnel ───────────── */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <SuggestedTalent talents={suggestedTalent} />
        {isFree ? (
          <UpgradeCallout />
        ) : (
          <ScaleInsightCallout planName={planName} />
        )}
        <HiringFunnelCard
          totalJobs={totalJobs}
          invitesSent={invitesSent}
          hires={hires}
        />
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Suggested talent — real recommendations from admin picks
// ─────────────────────────────────────────────────────────────────────

function SuggestedTalent({ talents }: { talents: SuggestedTalentItem[] }) {
  return (
    <section className="relative flex flex-col overflow-hidden rounded-2xl border border-edge bg-surface p-4 transition-all duration-300 hover:border-accent/25 hover:shadow-[0_24px_60px_-42px_rgba(10,46,26,0.3)] sm:rounded-3xl sm:p-6 max-h-[22rem] sm:max-h-none">
      <header className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold text-heading sm:text-base font-raleway">
            Suggested talent
          </h3>
          <p className="mt-0.5 text-[11px] text-subtle font-jetbrains">
            Hand-picked by Veloraa
          </p>
        </div>
        <Link
          href="/company/candidates"
          className="text-[11px] font-semibold text-accent transition-opacity hover:opacity-80 font-raleway"
        >
          See all
        </Link>
      </header>

      {talents.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-3 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Users className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-heading font-raleway">
            No recommendations yet
          </p>
          <p className="max-w-55 text-[11px] leading-relaxed text-subtle font-jetbrains">
            Once your published roles are reviewed, the Veloraa team will
            hand-pick top candidates here.
          </p>
        </div>
      ) : (
        <ul className="mt-4 flex-1 space-y-2.5 overflow-y-auto scrollbar-none">
          {talents.map((t) => (
            <li
              key={`${t.userId}-${t.jobId}`}
              className="group flex items-center gap-3 rounded-2xl border border-edge bg-page-alt p-2.5 transition-colors hover:border-accent/30"
            >
              <span
                aria-hidden
                className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-400/30 to-emerald-700/30"
              >
                <span className="text-sm font-bold text-heading font-raleway">
                  {talentInitials(t.fullName)}
                </span>
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-semibold text-heading font-raleway">
                    {t.fullName ?? "Anonymous"}
                  </p>
                  {t.expertiseLevel && (
                    <span className="rounded-full border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.1em] text-accent font-jetbrains">
                      {t.expertiseLevel}
                    </span>
                  )}
                </div>
                <p className="truncate text-[11px] text-subtle font-jetbrains">
                  {t.headline ?? "—"}
                </p>
                {t.jobTitle && (
                  <p className="mt-0.5 truncate text-[10px] text-body font-raleway">
                    For: <span className="font-medium text-heading">{t.jobTitle}</span>
                  </p>
                )}
              </div>
              <Link
                href={`/company/jobs/${t.jobId}`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-edge bg-surface text-subtle transition-colors hover:border-accent/40 hover:text-accent"
                aria-label={`View ${t.fullName ?? "talent"}`}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function talentInitials(name: string | null): string {
  const src = (name ?? "?").trim();
  const parts = src.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

// ─────────────────────────────────────────────────────────────────────
// Upgrade callout — Free plan only
// ─────────────────────────────────────────────────────────────────────

function UpgradeCallout() {
  return (
    <section className="group relative overflow-hidden rounded-2xl border border-edge bg-page-alt p-4 transition-all duration-300 hover:border-accent/25 hover:shadow-[0_24px_60px_-42px_rgba(10,46,26,0.3)] sm:rounded-3xl sm:p-6 max-h-[22rem] sm:max-h-none">
      {/* Layered SVG mesh — beige base + green grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 60% at 100% 0%, rgba(74,222,128,0.18), transparent 65%), radial-gradient(80% 50% at 0% 100%, rgba(22,163,74,0.12), transparent 70%)",
        }}
      />
      <svg
        aria-hidden
        className="absolute inset-0 h-full w-full opacity-30"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="upgrade-dots"
            width="14"
            height="14"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="1" fill="currentColor" />
          </pattern>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="url(#upgrade-dots)"
          className="text-accent"
        />
      </svg>

      {/* Floating sparkle decoration */}
      <span
        aria-hidden
        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-accent/30 bg-surface/80 text-accent backdrop-blur-sm"
      >
        <Sparkles className="h-3.5 w-3.5" />
      </span>

      <div className="relative">
        <span className="inline-block text-[10px] uppercase tracking-[0.12em] text-accent font-jetbrains">
          Premium
        </span>
        <h3 className="mt-2 text-lg font-bold leading-tight text-heading font-raleway sm:text-xl">
          Unlock the full Veloraa experience
        </h3>
        <p className="mt-2 text-[12px] leading-relaxed text-body font-raleway">
          Unlimited job posts, deeper candidate insights, priority shortlist
          delivery and hands-on hiring support.
        </p>

        <Link
          href="/company/subscription"
          className="mt-5 inline-flex w-full items-center justify-between gap-2 rounded-full bg-heading px-4 py-2.5 text-xs font-semibold text-page transition-transform hover:-translate-y-0.5 font-raleway"
        >
          Upgrade now
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-page text-heading">
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      </div>
    </section>
  );
}

function ScaleInsightCallout({ planName }: { planName: string }) {
  return (
    <section className="relative flex flex-col overflow-hidden rounded-2xl border border-edge bg-gradient-to-br from-accent/10 via-surface to-surface p-4 transition-all duration-300 hover:border-accent/25 hover:shadow-[0_24px_60px_-42px_rgba(10,46,26,0.3)] sm:rounded-3xl sm:p-6 max-h-[22rem] sm:max-h-none">
      <span
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-accent/15 blur-3xl"
      />
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-accent font-jetbrains">
        <Sparkles className="h-3 w-3" />
        {planName}
      </span>
      <h3 className="mt-3 text-lg font-bold text-heading font-raleway sm:text-xl">
        Tip of the week
      </h3>
      <p className="mt-1.5 text-[12px] leading-relaxed text-body font-raleway">
        Companies that reply to candidate intros within 24 hours close hires
        roughly 3× faster on Veloraa. Your messaging inbox is one click away.
      </p>

      <Link
        href="/company/messages"
        className="mt-auto inline-flex items-center justify-between gap-2 rounded-full border border-edge bg-surface px-4 py-2.5 text-xs font-semibold text-heading transition-all hover:border-accent/40 hover:text-accent font-raleway"
      >
        Open inbox
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Hiring funnel card
// ─────────────────────────────────────────────────────────────────────

function HiringFunnelCard({
  totalJobs,
  invitesSent,
  hires,
}: {
  totalJobs: number;
  invitesSent: number;
  hires: number;
}) {
  const today = new Date().toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Compose three stat columns. Each gets a tiny per-col bar viz that
  // scales relative to the funnel's max value, so the chart visually
  // narrows as we move down the funnel — even with small totals.
  const cols: { label: string; value: number; icon: typeof Briefcase }[] = [
    { label: "Jobs posted", value: totalJobs, icon: Briefcase },
    { label: "Invites sent", value: invitesSent, icon: Send },
    { label: "Hires", value: hires, icon: Target },
  ];
  const max = Math.max(1, ...cols.map((c) => c.value));

  return (
    <section className="relative flex flex-col overflow-hidden rounded-2xl border border-edge bg-surface p-4 transition-all duration-300 hover:border-accent/25 hover:shadow-[0_24px_60px_-42px_rgba(10,46,26,0.3)] sm:rounded-3xl sm:p-6 max-h-[22rem] sm:max-h-none">
      <header className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-heading sm:text-base font-raleway">
          Hiring funnel
        </h3>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-edge bg-page-alt px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] text-subtle font-jetbrains">
          <Calendar className="h-3 w-3" />
          {today}
        </span>
      </header>

      <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-4">
        {cols.map((c, i) => {
          const Icon = c.icon;
          const ratio = c.value / max;
          return (
            <div key={c.label} className="min-w-0">
              <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em] text-subtle font-jetbrains">
                <Icon className="h-3 w-3" />
                <span className="truncate">{c.label}</span>
              </p>
              <p className="mt-1.5 text-2xl font-bold text-heading font-raleway sm:text-3xl">
                {c.value}
              </p>
              {/* Bars — 14 narrow segments per column for the screenshot vibe */}
              <FunnelBars ratio={ratio} accent={i === 0} />
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-[10px] text-subtle font-jetbrains">
        Hires figure currently reflects accepted interview invitations. A
        dedicated hires event lands in a future release.
      </p>
    </section>
  );
}

function FunnelBars({ ratio, accent }: { ratio: number; accent: boolean }) {
  const SEGMENTS = 14;
  const filled = Math.round(SEGMENTS * Math.max(0, Math.min(1, ratio)));
  return (
    <div className="mt-3 flex h-10 items-end gap-[2px]">
      {Array.from({ length: SEGMENTS }).map((_, idx) => {
        const isFilled = idx < filled;
        const heightPct = 35 + (idx / SEGMENTS) * 60; // grow gently across
        return (
          <span
            key={idx}
            className={
              isFilled
                ? accent
                  ? "w-1 rounded-sm bg-accent shadow-[0_0_4px_rgba(74,222,128,0.5)]"
                  : "w-1 rounded-sm bg-heading"
                : "w-1 rounded-sm bg-edge"
            }
            style={{ height: `${heightPct}%` }}
          />
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Pending / rejected pipeline (preserved)
// ─────────────────────────────────────────────────────────────────────

function PendingPipeline({
  submittedAt,
  status,
}: {
  submittedAt: string | null | undefined;
  status: string;
}) {
  return (
    <section className="mt-10">
      <h2 className="mb-4 text-[11px] uppercase tracking-[0.08em] text-subtle font-jetbrains">
        Your progress
      </h2>
      <div className="space-y-3">
        <StageRow
          status={submittedAt ? "done" : "active"}
          num="01"
          title="Onboarding submitted"
          subtitle={
            submittedAt
              ? `Submitted ${new Date(submittedAt).toLocaleDateString()}`
              : "Complete onboarding to continue"
          }
        />
        <StageRow
          status={
            status === "approved"
              ? "done"
              : status === "rejected"
                ? "failed"
                : "active"
          }
          num="02"
          title="Human review"
          subtitle={
            status === "approved"
              ? "Approved — you're in."
              : status === "rejected"
                ? "Not this time — see notes above."
                : "In review — we'll email you within 24 hours."
          }
        />
        <StageRow
          status={status === "approved" ? "active" : "idle"}
          num="03"
          title="Post your first job"
          subtitle={
            status === "approved"
              ? "Free tier includes one post, no card required."
              : "Unlocks after approval."
          }
        />
        <StageRow
          status="idle"
          num="04"
          title="Shortlist delivered"
          subtitle="Pre-vetted candidates matched to your role — typically within 48 hours."
        />
      </div>
    </section>
  );
}

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
        : status === "active"
          ? Briefcase
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

// ─────────────────────────────────────────────────────────────────────
// Pure helpers (date math + bucketing)
// ─────────────────────────────────────────────────────────────────────

const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

function startOfUTCDay(d: Date): Date {
  const out = new Date(d);
  out.setUTCHours(0, 0, 0, 0);
  return out;
}

function buildEmptyPulseDays(): PulseDay[] {
  const out: PulseDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = startOfUTCDay(daysAgo(i));
    out.push({
      dateISO: d.toISOString(),
      label: WEEKDAY_LETTERS[d.getUTCDay()],
      value: 0,
    });
  }
  return out;
}

/**
 * Bucket an array of ISO timestamps into "this week" (last 7 days, oldest
 * → newest) and "previous week" (the 7 days before that). Returns the
 * formatted PulseDay[] for this week and the raw integer total for the
 * previous week so the caller can compute a delta.
 */
function bucketTwoWeeks(events: string[]): {
  thisWeek: PulseDay[];
  prevWeekTotal: number;
} {
  const thisWeekStart = startOfUTCDay(daysAgo(6));
  const prevWeekStart = startOfUTCDay(daysAgo(13));

  // Build empty buckets keyed on UTC date string YYYY-MM-DD for this week.
  const thisBuckets = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = startOfUTCDay(daysAgo(i));
    thisBuckets.set(toUTCDateKey(d), 0);
  }

  let prevTotal = 0;

  for (const iso of events) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) continue;
    if (d >= thisWeekStart) {
      const key = toUTCDateKey(d);
      thisBuckets.set(key, (thisBuckets.get(key) ?? 0) + 1);
    } else if (d >= prevWeekStart) {
      prevTotal += 1;
    }
  }

  const thisWeek: PulseDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = startOfUTCDay(daysAgo(i));
    thisWeek.push({
      dateISO: d.toISOString(),
      label: WEEKDAY_LETTERS[d.getUTCDay()],
      value: thisBuckets.get(toUTCDateKey(d)) ?? 0,
    });
  }

  return { thisWeek, prevWeekTotal: prevTotal };
}

function toUTCDateKey(d: Date): string {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toFeedItem(
  row: Record<string, unknown> & { id: string }
): JobsFeedItem {
  return {
    id: String(row.id),
    title: String(row.title ?? "Untitled role"),
    status: (row.status as JobsFeedItem["status"]) ?? "draft",
    roleCategory: (row.role_category as string | null) ?? null,
    seniority: (row.seniority as string | null) ?? null,
    employmentType: (row.employment_type as string | null) ?? null,
    workArrangement: (row.work_arrangement as string | null) ?? null,
    location: (row.location as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}
