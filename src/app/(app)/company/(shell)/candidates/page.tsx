import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Bookmark,
  BriefcaseBusiness,
  Eye,
  Filter,
  Lock,
  MapPin,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { requireApprovedCompany } from "@/lib/company/guard";
import { planFor } from "@/lib/company/options";
import {
  canBrowseFullCandidatePool,
  CANDIDATE_POOL_ORDER_COLUMN,
  FREE_CANDIDATE_PREVIEW_LIMIT,
  getEffectiveCompanyPlanId,
} from "@/lib/company/candidate-access";
import { createAdminClient } from "@/lib/supabase/admin";

interface Candidate {
  id: string;
  name: string;
  headline: string;
  location: string;
  level: string;
  score: number;
  skills: string[];
  avatar_url: string | null;
}

type ProfileRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

type AnalysisRow = {
  user_id: string;
  overall_score: number | null;
  expertise_level: string | null;
};

export default async function CompanyCandidatesPage() {
  const { application } = await requireApprovedCompany();
  const planId = getEffectiveCompanyPlanId(application);
  const planName = planFor(planId)?.name ?? "Free";

  const admin = createAdminClient();
  const { data: appsData } = await admin
    .from("talent_applications")
    .select("user_id, headline, location, skills")
    .eq("review_status", "approved")
    .order(CANDIDATE_POOL_ORDER_COLUMN, { ascending: false })
    .limit(50);

  const apps = (appsData ?? []) as {
    user_id: string;
    headline: string | null;
    location: string | null;
    skills: string[] | null;
  }[];

  let candidates: Candidate[] = [];

  if (apps.length > 0) {
    const userIds = apps.map((a) => a.user_id);
    const [profilesRes, analysesRes] = await Promise.all([
      admin
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds),
      admin
        .from("talent_ai_analyses")
        .select("user_id, overall_score, expertise_level")
        .in("user_id", userIds),
    ]);

    const pMap = new Map(
      ((profilesRes.data ?? []) as ProfileRow[]).map((p) => [p.id, p])
    );
    const aMap = new Map(
      ((analysesRes.data ?? []) as AnalysisRow[]).map((a) => [a.user_id, a])
    );

    candidates = apps.map((app) => {
      const p = pMap.get(app.user_id);
      const a = aMap.get(app.user_id);

      return {
        id: app.user_id,
        name: p?.full_name ?? "Unknown Candidate",
        headline: app.headline ?? "AI-vetted specialist",
        location: app.location ?? "Remote-ready",
        level: a?.expertise_level ?? "Verified",
        score: a?.overall_score ?? 0,
        skills: app.skills ?? [],
        avatar_url: p?.avatar_url ?? null,
      };
    });
  }

  const previewLimit = canBrowseFullCandidatePool(planId)
    ? candidates.length
    : FREE_CANDIDATE_PREVIEW_LIMIT;
  const visible = candidates.slice(0, previewLimit);
  const locked = candidates.slice(previewLimit);
  const canMessage = canBrowseFullCandidatePool(planId);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 sm:px-6 lg:px-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="mb-2 inline-block text-[11px] uppercase tracking-[0.08em] text-accent font-jetbrains">
            Candidates
          </span>
          <h1 className="text-3xl font-bold text-heading font-raleway">
            Pre-vetted talent pool
          </h1>
          <p className="mt-2 max-w-xl text-sm text-body font-raleway">
            Every profile here has passed Veloraa&apos;s multi-stage vetting
            and AI review.{" "}
            {planId === "free"
              ? "Free plan shows a 2-profile preview."
              : "Unlimited previews on your plan."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-edge bg-surface px-3 py-1 text-[10px] uppercase tracking-[0.1em] text-body font-jetbrains">
            {planName} plan
          </span>
          {planId === "free" && (
            <Link
              href="/company/subscription"
              className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/5 px-3 py-1 text-[10px] uppercase tracking-[0.1em] text-accent transition-colors hover:border-accent/70 font-jetbrains"
            >
              <Sparkles className="h-3 w-3" />
              Upgrade
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
          <input
            type="text"
            disabled
            placeholder="Search by skill, role, region..."
            className="w-full rounded-lg border border-edge bg-surface py-2.5 pl-10 pr-4 text-sm text-heading placeholder:text-subtle focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-60 font-raleway"
          />
        </label>
        <button
          type="button"
          disabled
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-edge bg-surface px-4 py-2.5 text-xs font-semibold text-heading transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60 font-raleway"
        >
          <Filter className="h-3.5 w-3.5" />
          Filters
        </button>
      </div>

      <div className="mt-8 grid gap-3 sm:gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {visible.length === 0 && (
          <p className="col-span-full text-sm text-body font-raleway">
            No candidates found at this time.
          </p>
        )}
        {visible.map((c) => (
          <CandidateCard key={c.id} candidate={c} canMessage={canMessage} />
        ))}
        {locked.map((c) => (
          <LockedCandidateCard key={c.id} candidate={c} />
        ))}
      </div>

      {planId === "free" && <PlanGate planName={planName} />}
    </div>
  );
}

function CandidateCard({
  candidate,
  canMessage,
}: {
  candidate: Candidate;
  canMessage: boolean;
}) {
  const initials = getInitials(candidate.name);
  const scoreLabel = candidate.score > 0 ? String(candidate.score) : "--";
  const featuredSkills = candidate.skills.slice(0, 4);
  const remainingSkills = Math.max(
    candidate.skills.length - featuredSkills.length,
    0
  );

  return (
    <article className="candidate-card group flex flex-row sm:flex-col overflow-hidden rounded-2xl sm:rounded-[1.75rem] bg-white/45 p-1 sm:p-[5px] shadow-[0_4px_32px_-8px_rgba(22,163,74,0.1)] backdrop-blur-2xl transition-all duration-500 ease-out hover:-translate-y-0.5 sm:hover:-translate-y-2 hover:shadow-[0_20px_56px_-12px_rgba(22,163,74,0.22)] dark:bg-[#0d2418]/55 dark:shadow-[0_4px_32px_-8px_rgba(74,222,128,0.06)] dark:hover:shadow-[0_20px_56px_-12px_rgba(74,222,128,0.18)]">
      {/* Shimmer glow line — desktop only */}
      <div
        aria-hidden
        className="card-shimmer-line pointer-events-none absolute inset-x-6 top-0 z-10 hidden h-px bg-gradient-to-r from-transparent via-accent-glow/60 to-transparent sm:block"
      />

      {/* ── Image hero ── */}
      <div className="relative w-[7.5rem] shrink-0 self-stretch overflow-hidden rounded-xl sm:w-full sm:self-auto sm:min-h-[18rem] sm:rounded-[1.35rem]">
        {candidate.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={candidate.avatar_url}
            alt={`${candidate.name}`}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-dark-green via-mid-green/60 to-beige/50">
            <span className="text-3xl sm:text-7xl font-black text-white/80 drop-shadow-lg font-raleway">
              {initials}
            </span>
          </div>
        )}

        {/* Gradient overlays */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/40 sm:from-black/60 via-black/5 to-transparent"
        />
        <div
          aria-hidden
          className="absolute inset-0 hidden bg-gradient-to-br from-accent-glow/10 via-transparent to-transparent mix-blend-overlay sm:block"
        />

        {/* Floating glass badges — desktop only */}
        <div className="hidden sm:flex absolute left-3 right-3 top-3 items-start justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white shadow-lg backdrop-blur-xl font-jetbrains">
            <ShieldCheck className="h-3 w-3 text-accent-glow" />
            Vetted
          </span>
          <div className="ai-score-badge flex flex-col items-center rounded-2xl border border-accent-glow/35 bg-dark-green/50 px-3 py-1.5 text-white backdrop-blur-xl">
            <span className="text-[8px] uppercase tracking-[0.14em] text-accent-glow/90 font-jetbrains">
              AI score
            </span>
            <span className="text-xl font-black leading-none font-raleway">
              {scoreLabel}
            </span>
          </div>
        </div>

        {/* Name + headline overlaid on image — desktop only */}
        <div className="hidden sm:block absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-xl font-black leading-tight text-white drop-shadow-md font-raleway">
                {candidate.name}
              </h3>
              <p className="mt-0.5 line-clamp-1 text-[13px] font-medium text-white/75 font-raleway">
                {candidate.headline}
              </p>
            </div>
            <span className="hidden shrink-0 items-center gap-1 rounded-full border border-white/20 bg-white/15 px-2 py-0.5 text-[9px] font-semibold text-white backdrop-blur-lg font-jetbrains sm:inline-flex">
              <BadgeCheck className="h-3 w-3 text-accent-glow" />
              Top 1%
            </span>
          </div>
        </div>
      </div>

      {/* ── Info section ── */}
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:gap-3 px-3 py-2 sm:px-3.5 sm:pb-3.5 sm:pt-3">
        {/* Mobile-only: Name + AI score header */}
        <div className="flex items-start justify-between gap-2 sm:hidden">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-black leading-tight text-heading font-raleway">
              {candidate.name}
            </h3>
            <p className="mt-0.5 flex items-center gap-1 text-[10px] text-accent font-jetbrains">
              <ShieldCheck className="h-2.5 w-2.5" />
              Vetted
            </p>
          </div>
          <div className="ai-score-badge shrink-0 flex flex-col items-center rounded-xl border border-accent-glow/35 bg-dark-green/50 px-2 py-1 text-white backdrop-blur-xl dark:bg-dark-green/60">
            <span className="text-[7px] uppercase tracking-[0.12em] text-accent-glow/90 font-jetbrains">
              AI
            </span>
            <span className="text-base font-black leading-none font-raleway">
              {scoreLabel}
            </span>
          </div>
        </div>

        {/* Role + Level row */}
        <div className="flex items-start justify-between gap-2 sm:gap-3 border-b border-edge/60 pb-2 sm:pb-3 dark:border-accent-glow/8">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 text-[8px] sm:text-[9px] uppercase tracking-[0.12em] text-accent font-jetbrains">
              <BriefcaseBusiness className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              Role
            </p>
            <p className="mt-0.5 line-clamp-1 text-[12px] sm:text-sm font-bold text-heading font-raleway">
              {candidate.headline}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-[10px] sm:text-[11px] text-body font-raleway">
              <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0 text-accent" />
              {candidate.location}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="flex items-center justify-end gap-1 text-[8px] sm:text-[9px] uppercase tracking-[0.12em] text-accent font-jetbrains">
              <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              Level
            </p>
            <p className="mt-0.5 truncate text-[12px] sm:text-sm font-bold text-heading font-raleway">
              {candidate.level}
            </p>
          </div>
        </div>

        {/* Skills */}
        <div>
          <p className="mb-1 sm:mb-1.5 text-[8px] sm:text-[9px] uppercase tracking-[0.12em] text-subtle font-jetbrains">
            Skills
          </p>
          <div className="flex flex-wrap gap-1 sm:gap-1.5">
            {featuredSkills.length > 0 ? (
              featuredSkills.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-accent/15 bg-accent/8 px-2 sm:px-2.5 py-0.5 text-[9px] sm:text-[10px] font-semibold text-accent shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] font-raleway dark:border-accent-glow/15 dark:bg-accent-glow/8 dark:text-accent-glow"
                >
                  {s}
                </span>
              ))
            ) : (
              <span className="rounded-full border border-accent/15 bg-accent/8 px-2 sm:px-2.5 py-0.5 text-[9px] sm:text-[10px] font-semibold text-accent font-raleway dark:border-accent-glow/15 dark:bg-accent-glow/8 dark:text-accent-glow">
                AI assessed
              </span>
            )}
            {remainingSkills > 0 && (
              <span className="rounded-full border border-edge bg-surface/60 px-2 sm:px-2.5 py-0.5 text-[9px] sm:text-[10px] font-semibold text-body font-raleway">
                +{remainingSkills}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-auto grid grid-cols-2 gap-1 sm:gap-1.5 pt-0.5 sm:pt-1">
          <button
            type="button"
            disabled
            title="Talent watchlist is coming soon."
            className="inline-flex h-7 sm:h-9 items-center justify-center gap-1 sm:gap-1.5 rounded-lg sm:rounded-xl border border-edge/70 bg-white/55 text-[10px] sm:text-[11px] font-bold text-heading backdrop-blur transition-all hover:border-accent/30 hover:text-accent disabled:cursor-not-allowed disabled:opacity-70 font-raleway dark:border-accent-glow/10 dark:bg-white/5"
          >
            <Bookmark className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            Save
          </button>
          {canMessage ? (
            <Link
              href="/company/messages"
              className="inline-flex h-7 sm:h-9 items-center justify-center gap-1 sm:gap-1.5 rounded-lg sm:rounded-xl bg-accent px-2 sm:px-3 text-[10px] sm:text-[11px] font-bold text-white shadow-[0_8px_20px_-8px_rgba(22,163,74,0.7)] transition-all hover:bg-mid-green hover:shadow-[0_12px_28px_-8px_rgba(74,222,128,0.8)] font-raleway"
            >
              <MessageSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              Message
            </Link>
          ) : (
            <button
              type="button"
              disabled
              title="Upgrade to Growth to message candidates."
              className="inline-flex h-7 sm:h-9 items-center justify-center gap-1 sm:gap-1.5 rounded-lg sm:rounded-xl border border-accent/20 bg-accent/8 text-[10px] sm:text-[11px] font-bold text-accent disabled:cursor-not-allowed disabled:opacity-70 font-raleway dark:bg-accent-glow/8 dark:text-accent-glow"
            >
              <Lock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              Message
            </button>
          )}
          <Link
            href={`/company/talent/${candidate.id}`}
            className="col-span-2 inline-flex h-7 sm:h-9 items-center justify-center gap-1 sm:gap-1.5 rounded-lg sm:rounded-xl bg-dark-green px-2 sm:px-3 text-[10px] sm:text-[11px] font-bold text-white shadow-[0_8px_24px_-10px_rgba(10,46,26,0.8)] transition-all hover:bg-accent hover:shadow-[0_12px_32px_-10px_rgba(74,222,128,0.7)] font-raleway"
          >
            <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            View profile
            <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function LockedCandidateCard({ candidate }: { candidate: Candidate }) {
  const initials = getInitials(candidate.name);
  const featuredSkills = candidate.skills.slice(0, 4);
  const visibleSkills = featuredSkills.length > 0 ? featuredSkills : ["AI assessed"];

  return (
    <article className="candidate-card group relative flex flex-row sm:flex-col overflow-hidden rounded-2xl sm:rounded-[1.75rem] bg-white/45 p-1 sm:p-[5px] shadow-[0_4px_32px_-8px_rgba(22,163,74,0.06)] backdrop-blur-2xl dark:bg-[#0d2418]/55 dark:shadow-[0_4px_32px_-8px_rgba(74,222,128,0.04)]">
      {/* Blurred card content */}
      <div className="pointer-events-none flex flex-row sm:flex-col select-none blur-[3px]">
        {/* Image area */}
        <div className="relative w-[7.5rem] shrink-0 self-stretch overflow-hidden rounded-xl sm:w-full sm:self-auto sm:min-h-[18rem] sm:rounded-[1.35rem]">
          {candidate.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={candidate.avatar_url}
              alt={`${candidate.name}`}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-dark-green via-mid-green/60 to-beige/50">
              <span className="text-3xl sm:text-7xl font-black text-white/80 font-raleway">
                {initials}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 sm:from-black/60 via-black/5 to-transparent" />
          <div className="hidden sm:block absolute bottom-0 left-0 right-0 p-4">
            <p className="text-xl font-black leading-tight text-white font-raleway">
              {candidate.name}
            </p>
            <p className="mt-0.5 line-clamp-1 text-[13px] font-medium text-white/75 font-raleway">
              {candidate.headline}
            </p>
          </div>
        </div>
        {/* Info area */}
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:gap-3 px-3 py-2 sm:px-3.5 sm:pb-3.5 sm:pt-3">
          {/* Mobile-only name */}
          <div className="sm:hidden">
            <p className="truncate text-[15px] font-black text-heading font-raleway">
              {candidate.name}
            </p>
          </div>
          <div className="flex items-start justify-between gap-2 sm:gap-3 border-b border-edge/60 pb-2 sm:pb-3">
            <div className="min-w-0">
              <p className="text-[8px] sm:text-[9px] uppercase tracking-[0.12em] text-accent font-jetbrains">
                Role
              </p>
              <p className="mt-0.5 line-clamp-1 text-[12px] sm:text-sm font-bold text-heading font-raleway">
                {candidate.headline}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[8px] sm:text-[9px] uppercase tracking-[0.12em] text-accent font-jetbrains">
                AI score
              </p>
              <p className="mt-0.5 text-[12px] sm:text-sm font-bold text-heading font-raleway">
                {candidate.score > 0 ? candidate.score : "--"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 sm:gap-1.5">
            {visibleSkills.map((s) => (
              <span
                key={s}
                className="rounded-full border border-accent/15 bg-accent/8 px-2 sm:px-2.5 py-0.5 text-[9px] sm:text-[10px] font-semibold text-accent font-raleway"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 sm:gap-3 rounded-2xl sm:rounded-[1.75rem] bg-white/60 p-4 sm:p-5 text-center backdrop-blur-md dark:bg-[#0d2418]/70">
        <div className="flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-accent shadow-[0_0_40px_-10px_rgba(74,222,128,0.8)]">
          <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <p className="text-sm sm:text-base font-bold text-heading font-raleway">
          Upgrade to see this candidate
        </p>
        <p className="max-w-xs text-[11px] sm:text-xs text-body font-raleway">
          The Growth plan unlocks the full talent pool and direct messaging.
        </p>
        <Link
          href="/company/subscription"
          className="mt-0.5 sm:mt-1 inline-flex items-center gap-1.5 rounded-lg sm:rounded-xl bg-accent px-4 sm:px-5 py-1.5 sm:py-2 text-[10px] sm:text-[11px] font-bold text-white shadow-[0_8px_20px_-8px_rgba(22,163,74,0.7)] transition-all hover:bg-mid-green hover:shadow-[0_12px_28px_-8px_rgba(74,222,128,0.8)] font-raleway"
        >
          <Sparkles className="h-3 w-3" />
          Upgrade plan
        </Link>
      </div>
    </article>
  );
}

function PlanGate({ planName }: { planName: string }) {
  return (
    <section className="mt-12 overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/10 via-surface to-surface p-6 sm:p-8">
      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[10px] uppercase tracking-[0.1em] text-accent font-jetbrains">
            <Zap className="h-3 w-3" />
            Upgrade to unlock
          </div>
          <h2 className="text-2xl font-bold text-heading font-raleway">
            See every pre-vetted candidate, not just the preview.
          </h2>
          <p className="mt-2 text-sm text-body font-raleway">
            Your current {planName} plan shows 2 profiles at a time. Upgrade to
            Growth for unlimited browsing, saved searches, and direct
            messaging.
          </p>
        </div>
        <Link
          href="/company/subscription"
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-xs font-semibold text-white transition-all hover:opacity-90 hover:shadow-[0_0_24px_rgba(74,222,128,0.35)] font-raleway"
        >
          <Sparkles className="h-3.5 w-3.5" />
          See plans
        </Link>
      </div>
    </section>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}
