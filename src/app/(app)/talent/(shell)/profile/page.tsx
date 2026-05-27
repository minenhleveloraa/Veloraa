import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  EyeOff,
  FileText,
  Globe,
  MapPin,
  Pencil,
  ShieldCheck,
  Sparkles,
  Verified,
} from "lucide-react";
import ProfileUpdateForm from "@/components/talent/ProfileUpdateForm";
import {
  hideProfileForEdit,
  makeProfileLive,
} from "@/app/actions/talent-profile";
import LiveProfileBanners from "@/components/realtime/LiveProfileBanners";
import TalentProfileBanner from "@/components/talent/TalentProfileBanner";
import type { TalentApplication, WorkExperience } from "@/lib/types/db";

// Lucide removed brand glyphs in recent versions; these inline SVGs match
// the lucide icon API so they slot into <LinkRow icon={...}> without
// changing the row layout.
function LinkedInLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path d="M20.452 20.452H17.04v-5.34c0-1.273-.024-2.91-1.773-2.91-1.775 0-2.046 1.385-2.046 2.817v5.433h-3.41V9h3.275v1.561h.046c.456-.864 1.57-1.775 3.232-1.775 3.456 0 4.094 2.275 4.094 5.234v6.432zM5.337 7.433a1.978 1.978 0 1 1 0-3.956 1.978 1.978 0 0 1 0 3.956zM7.044 20.452H3.63V9h3.414v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.728v20.544C0 23.226.792 24 1.771 24h20.451C23.205 24 24 23.226 24 22.272V1.728C24 .774 23.205 0 22.222 0h.003z" />
    </svg>
  );
}

function GitHubLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

export const metadata = {
  title: "My profile · Veloraa",
};

export default async function TalentProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: appRow } = await supabase
    .from("talent_applications")
    .select("*")
    .eq("user_id", user.id)
    .single();
  const app = appRow as TalentApplication | null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, created_at")
    .eq("id", user.id)
    .single();

  if (!app || !profile) redirect("/talent/onboarding/stage-1");

  const isApproved = app.review_status === "approved";
  const isHidden = app.review_status === "hidden";
  const isRejected = app.review_status === "rejected";

  // The form is shown when the talent can actively edit:
  //  • after hiding their approved profile, or
  //  • after a rejection where we still have a previous approved snapshot.
  const editable = isHidden || (isRejected && !!app.previous_approved_state);

  const displayName = profile.full_name || "Applicant";
  const displayInitial = displayName.charAt(0).toUpperCase() || "T";
  const memberSince = app.created_at ?? profile.created_at ?? null;
  const skillsCount = app.skills?.length ?? 0;
  const rolesCount = app.work_experience?.length ?? 0;

  return (
    <LiveProfileBanners
      initial={{
        review_status: app.review_status,
        review_reason: app.review_reason,
        technical_status: app.technical_status,
        interview_status: app.interview_status,
        previous_approved_state: app.previous_approved_state,
      }}
    >
      <div className="relative">
        {/* Banner */}
        <div className="relative h-44 w-full overflow-hidden sm:h-56 lg:h-64 xl:h-72">
          <TalentProfileBanner />

          {/* Floating badge */}
          <div className="absolute right-4 top-4 z-10 hidden sm:block">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-white/85 backdrop-blur-md font-jetbrains">
              <Sparkles className="h-3 w-3" />
              Your talent profile
            </span>
          </div>
        </div>

        {/* Identity strip — avatar overlapping the banner */}
        <div className="mx-auto -mt-14 max-w-5xl px-4 sm:-mt-16 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="relative h-28 w-28 overflow-hidden rounded-3xl border-4 border-page bg-surface shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)] sm:h-32 sm:w-32 lg:h-36 lg:w-36">
                {app.avatar_url ? (
                  <Image
                    src={app.avatar_url}
                    alt={`${displayName} avatar`}
                    fill
                    sizes="144px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent/30 via-accent/10 to-transparent">
                    <span className="text-5xl font-bold text-accent font-raleway">
                      {displayInitial}
                    </span>
                  </div>
                )}
              </div>
              {isApproved && (
                <span
                  title="Approved talent"
                  className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-page bg-accent text-white shadow-md"
                >
                  <Verified className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
              )}
            </div>

            {/* Name + meta + actions */}
            <div className="min-w-0 flex-1 sm:pb-2">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h1 className="truncate text-2xl font-bold text-heading font-raleway sm:text-3xl lg:text-4xl">
                  {displayName}
                </h1>
                <StatusBadge
                  status={app.review_status}
                />
              </div>

              {app.headline && (
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-body font-libre italic sm:text-base">
                  {app.headline}
                </p>
              )}

              {/* Inline meta row */}
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-subtle font-raleway">
                {app.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {app.location}
                  </span>
                )}
                {app.years_experience != null && (
                  <span className="inline-flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5" />
                    {app.years_experience}{" "}
                    {app.years_experience === 1 ? "year" : "years"} of experience
                  </span>
                )}
                {memberSince && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Member since {formatMonthYear(memberSince)}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 gap-2 sm:flex-col sm:items-end sm:pb-2 lg:flex-row lg:items-end">
              {isApproved && (
                <form action={hideProfileForEdit}>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-4 py-2 text-xs font-semibold text-accent transition-all hover:bg-accent hover:text-white font-raleway"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit profile
                  </button>
                </form>
              )}
              {app.portfolio_url && (
                <a
                  href={app.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-edge bg-surface px-4 py-2 text-xs font-semibold text-heading transition-all hover:border-accent/40 hover:text-accent font-raleway"
                >
                  <Globe className="h-3.5 w-3.5" />
                  Portfolio
                </a>
              )}
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <StatCard
              value={app.years_experience ?? 0}
              label="Years experience"
              icon={Briefcase}
            />
            <StatCard
              value={skillsCount}
              label="Skills listed"
              icon={Sparkles}
            />
            <StatCard
              value={rolesCount}
              label="Roles in history"
              icon={FileText}
            />
            <StatCard
              value={memberSince ? daysSince(memberSince) : 0}
              label="Days on Veloraa"
              icon={Calendar}
            />
          </div>

          {/* Status / approval banner (admin flow preserved) */}
          <div className="mt-6">
            <ReviewStatusBanner
              status={app.review_status}
              reviewReason={app.review_reason}
              hasPreviousState={!!app.previous_approved_state}
            />
          </div>

          {/* Body */}
          {editable ? (
            // Edit mode — show the form prominently with a soft intro.
            <div className="mt-8">
              <section className="rounded-2xl border border-accent/30 bg-accent/5 p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                    <Pencil className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-heading font-raleway">
                      You&apos;re editing your profile
                    </h2>
                    <p className="mt-1 text-xs text-body font-raleway">
                      Make your changes below and resubmit. Our team reviews
                      updates before your profile goes live again — typically
                      within 24 hours.
                    </p>
                  </div>
                </div>
              </section>
              <div className="mt-6">
                <ProfileUpdateForm userId={user.id} initial={app} />
              </div>
            </div>
          ) : (
            // Read-only rich view (approved / pending update / rejected w/o prev state).
            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              {/* Main column */}
              <div className="space-y-6 lg:col-span-2">
                {/* About */}
                <Card title="About">
                  {app.bio ? (
                    <p className="whitespace-pre-line text-sm leading-relaxed text-body font-raleway">
                      {app.bio}
                    </p>
                  ) : (
                    <p className="text-sm text-subtle font-raleway italic">
                      No bio yet. Add one when you edit your profile to help
                      companies understand who you are.
                    </p>
                  )}
                </Card>

                {/* Skills */}
                <Card title="Skills">
                  {skillsCount > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {app.skills.map((s) => (
                        <Chip key={s} variant="accent">
                          {s}
                        </Chip>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-subtle font-raleway italic">
                      No skills listed.
                    </p>
                  )}
                </Card>

                {/* Experience */}
                <Card title="Work experience">
                  {rolesCount > 0 ? (
                    <ol className="relative space-y-5 border-l border-edge pl-5">
                      {app.work_experience.map((role) => (
                        <ExperienceItem key={role.id} role={role} />
                      ))}
                    </ol>
                  ) : (
                    <p className="text-sm text-subtle font-raleway italic">
                      No work history listed.
                    </p>
                  )}
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Links */}
                <Card title="Links">
                  <ul className="space-y-2">
                    <LinkRow
                      icon={Globe}
                      label="Portfolio"
                      value={hostnameFromUrl(app.portfolio_url)}
                      href={app.portfolio_url}
                    />
                    <LinkRow
                      icon={LinkedInLogo}
                      label="LinkedIn"
                      value={hostnameFromUrl(app.linkedin_url)}
                      href={app.linkedin_url}
                    />
                    <LinkRow
                      icon={GitHubLogo}
                      label="GitHub"
                      value={hostnameFromUrl(app.github_url)}
                      href={app.github_url}
                    />
                  </ul>
                </Card>

                {/* Resume */}
                <Card title="Resume">
                  {app.resume_filename ? (
                    <div className="flex items-center gap-3 rounded-xl border border-edge bg-page-alt px-3 py-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                        <FileText className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-subtle font-jetbrains">
                          Attached
                        </p>
                        <p className="mt-0.5 truncate text-xs font-semibold text-heading font-raleway">
                          {app.resume_filename}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-subtle font-raleway italic">
                      No resume on file.
                    </p>
                  )}
                </Card>

                {/* Verification */}
                <Card title="Verification">
                  <div className="space-y-2.5">
                    <Verify
                      ok
                      label="Email verified"
                      detail={profile.email ?? "—"}
                    />
                    <Verify
                      ok={!!app.resume_path}
                      label="Resume attached"
                      detail={
                        app.resume_path ? "Visible to matched companies" : "Add one to boost visibility"
                      }
                    />
                    <Verify
                      ok={isApproved}
                      label="Profile approved by Veloraa"
                      detail={
                        isApproved
                          ? "You're live in the talent pool"
                          : "Pending review by our team"
                      }
                    />
                  </div>
                </Card>

                {/* Settings shortcut */}
                <Link
                  href="/talent/settings"
                  className="group block overflow-hidden rounded-2xl border border-edge bg-surface p-5 transition-all hover:border-accent/40 hover:shadow-[0_10px_30px_-15px_rgba(74,222,128,0.35)]"
                >
                  <p className="text-[10px] uppercase tracking-[0.12em] text-accent font-jetbrains">
                    Settings
                  </p>
                  <p className="mt-1 text-sm font-semibold text-heading font-raleway">
                    Notifications, visibility & account
                  </p>
                  <p className="mt-1 text-xs text-body font-raleway">
                    Tune how companies reach you and manage your account.
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent transition-transform group-hover:translate-x-0.5 font-raleway">
                    Open settings
                    <ExternalLink className="h-3 w-3" />
                  </span>
                </Link>
              </div>
            </div>
          )}

          <div className="h-16" />
        </div>
      </div>
    </LiveProfileBanners>
  );
}

// ─────────────────────────────────────────────────────────────────
// Status & approval flow components
// ─────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-accent font-jetbrains">
        <CheckCircle2 className="h-3 w-3" />
        Live
      </span>
    );
  }
  if (status === "hidden") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-edge bg-page-alt px-2.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-subtle font-jetbrains">
        <EyeOff className="h-3 w-3" />
        Hidden
      </span>
    );
  }
  if (status === "pending_update") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/40 bg-blue-500/10 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-blue-600 font-jetbrains">
        <Clock className="h-3 w-3" />
        Under review
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-red-500/10 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-red-500 font-jetbrains">
        <AlertCircle className="h-3 w-3" />
        Update rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-amber-600 font-jetbrains">
      <Clock className="h-3 w-3" />
      Pending review
    </span>
  );
}

function ReviewStatusBanner({
  status,
  reviewReason,
  hasPreviousState,
}: {
  status: string;
  reviewReason: string | null;
  hasPreviousState: boolean;
}) {
  if (status === "approved") {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-4 sm:flex-row sm:items-center">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-heading font-raleway">
            Your profile is live in the talent pool
          </p>
          <p className="mt-1 text-xs text-body font-raleway">
            Matched companies can discover and message you. Hide your profile
            below if you want to make changes — edits go through a quick
            review before going live again.
          </p>
        </div>
      </div>
    );
  }

  if (status === "hidden") {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-edge bg-surface p-4 sm:flex-row sm:items-center">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-page-alt text-subtle">
          <EyeOff className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-heading font-raleway">
            Your profile is hidden while you edit
          </p>
          <p className="mt-1 text-xs text-body font-raleway">
            Companies can&apos;t see you right now. Save your changes below to
            send them for review, or restore your previous live profile.
          </p>
        </div>
        {hasPreviousState && (
          <form action={makeProfileLive}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 font-raleway"
            >
              Cancel edits & make live
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>
        )}
      </div>
    );
  }

  if (status === "pending_update") {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4 sm:flex-row sm:items-center">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600">
          <Clock className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-heading font-raleway">
            Update under review
          </p>
          <p className="mt-1 text-xs text-body font-raleway">
            Our team is reviewing your recent changes. Your profile stays
            hidden until they approve — usually within 24 hours.
          </p>
        </div>
        <form action={makeProfileLive}>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg border border-edge bg-surface px-4 py-2 text-xs font-semibold text-heading transition-colors hover:border-blue-500 font-raleway"
          >
            Cancel update
          </button>
        </form>
      </div>
    );
  }

  if (status === "rejected" && hasPreviousState) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-red-500/30 bg-red-500/5 p-4 sm:flex-row sm:items-start">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-red-500">
          <AlertCircle className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-heading font-raleway">
            Profile update rejected
          </p>
          {reviewReason && (
            <p className="mt-1 text-xs text-body font-raleway italic">
              &ldquo;{reviewReason}&rdquo;
            </p>
          )}
          <p className="mt-2 text-xs text-body font-raleway">
            Edit the form below and resubmit, or restore your previous
            approved profile to go live right away.
          </p>
          <div className="mt-3">
            <form action={makeProfileLive}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg border border-edge bg-surface px-4 py-2 text-xs font-semibold text-heading transition-colors hover:border-red-500 font-raleway"
              >
                Discard changes & make live
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Pending first review
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 sm:flex-row sm:items-center">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
        <Clock className="h-5 w-5" />
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-heading font-raleway">
          Your profile is under review
        </p>
        <p className="mt-1 text-xs text-body font-raleway">
          Our team is reviewing your application. You&apos;ll be notified by
          email as soon as a decision is made.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function formatMonthYear(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function daysSince(iso: string): number {
  try {
    const ms = Date.now() - new Date(iso).getTime();
    return Math.max(0, Math.floor(ms / 86_400_000));
  } catch {
    return 0;
  }
}

function hostnameFromUrl(raw: string | null | undefined): string {
  if (!raw) return "—";
  try {
    const u = new URL(raw);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return raw;
  }
}

function formatRoleRange(role: WorkExperience): string {
  const start = role.start
    ? new Date(`${role.start}-01`).toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      })
    : "—";
  if (role.current) return `${start} — Present`;
  if (!role.end) return start;
  const end = new Date(`${role.end}-01`).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
  return `${start} — ${end}`;
}

// ─────────────────────────────────────────────────────────────────
// Local primitives
// ─────────────────────────────────────────────────────────────────

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-edge bg-surface p-5 sm:p-6">
      <h2 className="mb-4 text-[10px] uppercase tracking-[0.14em] text-subtle font-jetbrains">
        {title}
      </h2>
      {children}
    </section>
  );
}

function StatCard({
  value,
  label,
  icon: Icon,
}: {
  value: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-edge bg-surface p-4 transition-all hover:border-accent/40 hover:shadow-[0_10px_30px_-15px_rgba(74,222,128,0.35)] sm:p-5">
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent/15 opacity-0 blur-2xl transition-opacity group-hover:opacity-100"
      />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-3xl font-bold text-heading font-raleway sm:text-4xl">
            {value.toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-subtle font-jetbrains">
            {label}
          </p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pill-bg text-accent">
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

function Chip({
  children,
  variant = "neutral",
}: {
  children: React.ReactNode;
  variant?: "neutral" | "accent";
}) {
  const cls =
    variant === "accent"
      ? "border-accent/30 bg-accent/10 text-accent"
      : "border-edge bg-page-alt text-body";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium font-raleway ${cls}`}
    >
      {children}
    </span>
  );
}

function ExperienceItem({ role }: { role: WorkExperience }) {
  return (
    <li className="relative">
      <span className="absolute -left-[27px] mt-1 flex h-3 w-3 items-center justify-center rounded-full border-2 border-page bg-accent shadow-[0_0_0_3px_rgba(74,222,128,0.15)]" />
      <p className="text-sm font-semibold text-heading font-raleway">
        {role.title || "Untitled role"}
      </p>
      <p className="mt-0.5 text-xs text-body font-raleway">
        {role.company || "—"} · <span className="text-subtle">{formatRoleRange(role)}</span>
      </p>
      {role.description && (
        <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-body font-raleway">
          {role.description}
        </p>
      )}
    </li>
  );
}

function LinkRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href?: string | null;
}) {
  const isLive = !!href;
  const Wrapper: React.ElementType = isLive ? "a" : "div";

  return (
    <li>
      <Wrapper
        {...(isLive
          ? {
              href,
              target: "_blank",
              rel: "noopener noreferrer",
            }
          : {})}
        className={`flex items-center gap-3 rounded-xl border border-edge bg-page-alt px-3 py-2.5 transition-all ${
          isLive
            ? "hover:border-accent/40 hover:bg-accent/5"
            : "opacity-70 cursor-default"
        }`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface text-accent">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.12em] text-subtle font-jetbrains">
            {label}
          </p>
          <p className="mt-0.5 truncate text-xs font-semibold text-heading font-raleway">
            {value}
          </p>
        </div>
        {isLive ? (
          <ExternalLink className="h-3 w-3 shrink-0 text-subtle" />
        ) : (
          <span className="text-[10px] uppercase tracking-[0.1em] text-subtle font-jetbrains">
            Add
          </span>
        )}
      </Wrapper>
    </li>
  );
}

function Verify({
  ok,
  label,
  detail,
}: {
  ok: boolean;
  label: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-edge bg-page-alt px-3 py-2.5">
      <span
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          ok ? "bg-accent/15 text-accent" : "bg-amber-500/15 text-amber-600"
        }`}
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-heading font-raleway">
          {label}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-subtle font-raleway">
          {detail}
        </p>
      </div>
    </div>
  );
}
