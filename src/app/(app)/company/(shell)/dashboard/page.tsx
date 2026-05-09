import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  MailCheck,
  Plus,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
  XCircle,
} from "lucide-react";
import { requireCompany } from "@/lib/company/guard";
import { planFor } from "@/lib/company/options";
import { createClient } from "@/lib/supabase/server";

export default async function CompanyDashboardPage() {
  const { profile, application } = await requireCompany();

  let logoUrl: string | null = null;
  if (application?.logo_path) {
    const supabase = await createClient();
    const { data, error } = await supabase.storage
      .from("company-logos")
      .createSignedUrl(application.logo_path, 60 * 10);

    if (error) {
      console.error("[company/dashboard] logo signed URL error", error.message);
    } else {
      logoUrl = data?.signedUrl ?? null;
    }
  }

  const firstName = profile.full_name?.split(" ")[0] ?? "there";
  const companyName = application?.legal_name ?? "your company";
  const reviewStatus = application?.review_status ?? "pending";
  const planName = planFor(application?.selected_plan)?.name ?? "Free";

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 sm:px-6 lg:px-10">
      {reviewStatus === "approved" ? (
        <ApprovedHero
          firstName={firstName}
          companyName={companyName}
          logoUrl={logoUrl}
          planName={planName}
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

      {reviewStatus === "approved" ? (
        <ApprovedDashboard planName={planName} />
      ) : (
        <PendingPipeline
          submittedAt={application?.stage_1_submitted_at}
          status={reviewStatus}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Hero variants
// ---------------------------------------------------------------------

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
      {/* Decorative glow behind the logo */}
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
            className="h-full w-full object-contain p-4"
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
      {/* Subtle radial glow */}
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
            We review every new company by hand. You&apos;ll hear from us within 24
            hours — once approved you can post your first job and see pre-vetted
            shortlists delivered to your inbox.
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
}: {
  firstName: string;
  companyName: string;
  logoUrl: string | null;
  planName: string;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border-[3px] border-accent bg-gradient-to-br from-accent/10 via-surface to-surface p-6 sm:p-8">
      {/* Decorative radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-accent/8 blur-3xl"
      />

      <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-7">
        <HeroLogo
          companyName={companyName}
          firstName={firstName}
          logoUrl={logoUrl}
          accent
        />

        <div className="flex-1 text-center sm:text-left">
          <div className="mb-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[11px] uppercase tracking-[0.08em] text-accent font-jetbrains">
              <Trophy className="h-3.5 w-3.5" />
              Approved
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-edge bg-surface px-3 py-1 text-[11px] uppercase tracking-[0.08em] text-body font-jetbrains">
              {planName} plan
            </div>
          </div>
          <p className="mb-1 text-[10px] uppercase tracking-[0.12em] text-subtle font-jetbrains">
            {companyName}
          </p>
          <h1 className="text-2xl font-bold text-heading sm:text-3xl lg:text-4xl font-raleway">
            Welcome back, {firstName}.
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-body font-libre italic">
            {companyName} is live on Veloraa. Post a role to start receiving a
            shortlist of pre-vetted candidates within 48 hours.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link
              href="/company/jobs/new"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-xs font-semibold text-white transition-all hover:opacity-90 hover:shadow-[0_0_24px_rgba(74,222,128,0.35)] font-raleway"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={3} />
              Post a job
            </Link>
            <Link
              href="/company/candidates"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-ghost-border bg-surface px-5 py-2.5 text-xs font-semibold text-heading transition-opacity hover:opacity-80 font-raleway"
            >
              <Users className="h-3.5 w-3.5" />
              Browse candidates
            </Link>
          </div>
        </div>
      </div>
    </section>
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
      {/* Decorative radial glow */}
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

// ---------------------------------------------------------------------
// Approved dashboard content
// ---------------------------------------------------------------------

function ApprovedDashboard({ planName }: { planName: string }) {
  return (
    <>
      <section className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiCard
          label="Active jobs"
          value="0"
          hint="Post your first role"
          icon={Briefcase}
        />
        <KpiCard
          label="Shortlisted"
          value="0"
          hint="From the talent pool"
          icon={Users}
        />
        <KpiCard
          label="Profile views"
          value="-"
          hint="Last 30 days"
          icon={Eye}
        />
        <KpiCard
          label="Response rate"
          value="-"
          hint="Talent reply rate"
          icon={TrendingUp}
        />
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-[11px] uppercase tracking-[0.08em] text-subtle font-jetbrains">
          Quick actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ActionCard
            href="/company/jobs/new"
            title="Post a job"
            subtitle="Takes about 4 minutes."
            icon={Plus}
            accent
          />
          <ActionCard
            href="/company/candidates"
            title="Browse candidates"
            subtitle="Filter by role, stack, region."
            icon={Users}
          />
          <ActionCard
            href="/company/subscription"
            title={
              planName === "Free" ? "Upgrade your plan" : "Manage subscription"
            }
            subtitle={
              planName === "Free"
                ? "Unlock unlimited postings."
                : "Update billing or change plan."
            }
            icon={CreditCard}
          />
        </div>
      </section>

      <section className="mt-10 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-edge bg-surface p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-heading font-raleway">
              Latest shortlists
            </h3>
            <Link
              href="/company/candidates"
              className="text-[11px] uppercase tracking-[0.08em] text-accent transition-opacity hover:opacity-80 font-jetbrains"
            >
              View all
            </Link>
          </div>
          <EmptyShortlist />
        </div>
        <div className="rounded-2xl border border-edge bg-surface p-5">
          <h3 className="text-sm font-semibold text-heading font-raleway">
            What&apos;s next
          </h3>
          <ul className="mt-3 space-y-3 text-sm text-body font-raleway">
            <NextStep
              icon={Briefcase}
              title="Post your first role"
              body="Specify seniority, stack, comp band. We take it from there."
            />
            <NextStep
              icon={MailCheck}
              title="Review matches"
              body="Accept or pass - we learn from every decision."
            />
            <NextStep
              icon={Sparkles}
              title="Hire in weeks, not months"
              body="Companies on Veloraa close candidates 3x faster on average."
            />
          </ul>
        </div>
      </section>
    </>
  );
}

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
    <div className="rounded-2xl border border-edge bg-surface p-4 sm:p-5">
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

function ActionCard({
  href,
  title,
  subtitle,
  icon: Icon,
  accent = false,
}: {
  href: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex items-start gap-4 rounded-2xl border p-5 transition-all ${
        accent
          ? "border-accent/40 bg-accent/5 hover:border-accent hover:shadow-[0_0_24px_rgba(74,222,128,0.15)]"
          : "border-edge bg-surface hover:border-accent/30"
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          accent ? "bg-accent text-white" : "bg-pill-bg text-accent"
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-heading font-raleway">
          {title}
        </p>
        <p className="mt-0.5 text-xs text-body font-raleway">{subtitle}</p>
      </div>
      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
    </Link>
  );
}

function EmptyShortlist() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-edge bg-page-alt px-6 py-10 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pill-bg text-accent">
        <Users className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-semibold text-heading font-raleway">
          No shortlists yet
        </p>
        <p className="mt-1 text-xs text-body font-raleway">
          Post your first job to receive curated candidates within 48 hours.
        </p>
      </div>
      <Link
        href="/company/jobs/new"
        className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 font-raleway"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={3} />
        Post a job
      </Link>
    </div>
  );
}

function NextStep({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-pill-bg text-accent">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div>
        <p className="text-sm font-semibold text-heading font-raleway">
          {title}
        </p>
        <p className="mt-0.5 text-xs text-body font-raleway">{body}</p>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------
// Pending / rejected pipeline
// ---------------------------------------------------------------------

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
              ? "Approved - you're in."
              : status === "rejected"
                ? "Not this time - see notes above."
                : "In review - we'll email you within 24 hours."
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
          subtitle="Pre-vetted candidates matched to your role - typically within 48 hours."
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
