import Image from "next/image";
import Link from "next/link";
import {
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Globe,
  MapPin,
  Pencil,
  Plus,
  Sparkles,
  Users2,
  Verified,
} from "lucide-react";
import { requireCompany } from "@/lib/company/guard";
import { createClient } from "@/lib/supabase/server";
import {
  COMPANY_SIZES,
  COMPANY_STAGES,
  HIRING_URGENCIES,
  HIRING_VOLUMES,
  WORK_STYLES,
  labelFor,
  planFor,
} from "@/lib/company/options";
import CompanyProfileBanner from "@/components/company/CompanyProfileBanner";

// Lucide removed brand glyphs (X / GitHub / LinkedIn) in recent
// versions; these tiny SVG components match the lucide icon API so
// they slot into <LinkRow icon={...}> without any change to the row.
function XLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path d="M18.244 2H21.5l-7.5 8.57L23 22h-6.875l-5.39-6.51L4.6 22H1.343l8.02-9.165L1 2h7.043l4.87 6.005L18.244 2zm-1.196 18h1.85L7.04 4H5.06l11.988 16z" />
    </svg>
  );
}

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
  title: "Company profile · Veloraa",
};

export default async function CompanyProfilePage() {
  const { profile, application } = await requireCompany();
  const supabase = await createClient();

  // Resolve the logo to a 10-minute signed URL — bucket is private.
  let logoUrl: string | null = null;
  if (application?.logo_path) {
    const { data } = await supabase.storage
      .from("company-logos")
      .createSignedUrl(application.logo_path, 60 * 10);
    logoUrl = data?.signedUrl ?? null;
  }

  // Real, lightweight stats.
  const { count: activeJobsCount } = await supabase
    .from("company_jobs")
    .select("id", { count: "exact", head: true })
    .eq("company_id", profile.id)
    .not("status", "eq", "rejected");

  const memberSince = application?.created_at ?? profile.created_at ?? null;

  const companyName = application?.legal_name ?? "Your company";
  const initial = companyName.trim().charAt(0).toUpperCase() || "V";
  const planName = planFor(application?.selected_plan)?.name ?? "Free";
  const reviewStatus = application?.review_status ?? "pending";
  const isApproved = reviewStatus === "approved";

  const hostnameFromUrl = (raw: string | null | undefined): string => {
    if (!raw) return "—";
    try {
      const u = new URL(raw);
      return u.hostname.replace(/^www\./, "");
    } catch {
      return raw;
    }
  };

  const tagline = buildTagline(application);

  return (
    <div className="relative">
      {/* ───────────────────────────────────────────────────────────
          Banner — full-bleed, futuristic glass header
         ─────────────────────────────────────────────────────────── */}
      <div className="relative h-44 w-full overflow-hidden sm:h-56 lg:h-64 xl:h-72">
        <CompanyProfileBanner />

        {/* Floating placeholder badge in the corner */}
        <div className="absolute right-4 top-4 z-10 hidden sm:block">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-white/85 backdrop-blur-md font-jetbrains">
            <Sparkles className="h-3 w-3" />
            Public profile
          </span>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────
          Identity strip — logo overlapping the banner
         ─────────────────────────────────────────────────────────── */}
      <div className="mx-auto -mt-14 max-w-5xl px-4 sm:-mt-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
          {/* Logo / monogram */}
          <div className="relative shrink-0">
            <div className="relative h-28 w-28 overflow-hidden rounded-3xl border-4 border-page bg-surface shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)] sm:h-32 sm:w-32 lg:h-36 lg:w-36">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={`${companyName} logo`}
                  fill
                  sizes="144px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent/20 via-accent/5 to-transparent">
                  <span className="text-5xl font-bold text-accent font-raleway">
                    {initial}
                  </span>
                </div>
              )}
            </div>
            {isApproved && (
              <span
                title="Verified company"
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
                {companyName}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-accent font-jetbrains">
                <Sparkles className="h-3 w-3" />
                {planName}
              </span>
              {!isApproved && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-amber-600 font-jetbrains">
                  Pending review
                </span>
              )}
            </div>

            {tagline && (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-body font-libre italic sm:text-base">
                {tagline}
              </p>
            )}

            {/* Inline meta row */}
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-subtle font-raleway">
              {application?.hq_country && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {application.hq_country}
                </span>
              )}
              {application?.company_size && (
                <span className="inline-flex items-center gap-1.5">
                  <Users2 className="h-3.5 w-3.5" />
                  {labelFor(COMPANY_SIZES, application.company_size)} team
                </span>
              )}
              {application?.company_stage && (
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  {labelFor(COMPANY_STAGES, application.company_stage)}
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
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-4 py-2 text-xs font-semibold text-accent transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-90 font-raleway"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit profile
            </button>
            {application?.website_url && (
              <a
                href={application.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-edge bg-surface px-4 py-2 text-xs font-semibold text-heading transition-all hover:border-accent/40 hover:text-accent font-raleway"
              >
                <Globe className="h-3.5 w-3.5" />
                Visit site
              </a>
            )}
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────
            Stats strip — 2x2 on mobile, 4-up on tablet+
           ─────────────────────────────────────────────────────────── */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <StatCard
            value={activeJobsCount ?? 0}
            label="Active jobs"
            icon={Briefcase}
          />
          <StatCard
            value={application?.industries.length ?? 0}
            label="Industries"
            icon={Building2}
          />
          <StatCard
            value={application?.roles_hiring.length ?? 0}
            label="Roles you hire"
            icon={Users2}
          />
          <StatCard
            value={memberSince ? daysSince(memberSince) : 0}
            label="Days on Veloraa"
            icon={Calendar}
          />
        </div>

        {/* ───────────────────────────────────────────────────────────
            Two-column layout: about + sidebar
           ─────────────────────────────────────────────────────────── */}
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {/* Main column */}
          <div className="space-y-6 lg:col-span-2">
            {/* About */}
            <Card title="About">
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                <Field
                  label="Legal name"
                  value={application?.legal_name ?? "—"}
                />
                <Field
                  label="Website"
                  value={hostnameFromUrl(application?.website_url)}
                  href={application?.website_url ?? undefined}
                />
                <Field
                  label="Headquarters"
                  value={application?.hq_country ?? "—"}
                />
                <Field
                  label="Stage"
                  value={labelFor(COMPANY_STAGES, application?.company_stage)}
                />
                <Field
                  label="Team size"
                  value={labelFor(COMPANY_SIZES, application?.company_size)}
                />
                <Field
                  label="Work style"
                  value={labelFor(WORK_STYLES, application?.work_style)}
                />
              </dl>
            </Card>

            {/* Industries & roles */}
            <Card title="Industries & roles you hire for">
              <div>
                <p className="mb-2 text-[10px] uppercase tracking-[0.12em] text-subtle font-jetbrains">
                  Industries
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(application?.industries ?? []).length > 0 ? (
                    application!.industries.map((i) => (
                      <Chip key={i}>{i}</Chip>
                    ))
                  ) : (
                    <span className="text-sm text-subtle font-raleway">
                      Add industries from your settings to power matches.
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-5">
                <p className="mb-2 text-[10px] uppercase tracking-[0.12em] text-subtle font-jetbrains">
                  Roles
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(application?.roles_hiring ?? []).length > 0 ? (
                    application!.roles_hiring.map((r) => (
                      <Chip key={r} variant="accent">
                        {r}
                      </Chip>
                    ))
                  ) : (
                    <span className="text-sm text-subtle font-raleway">
                      No roles configured yet.
                    </span>
                  )}
                </div>
              </div>
            </Card>

            {/* Hiring snapshot */}
            <Card title="Current hiring snapshot">
              <div className="grid gap-4 sm:grid-cols-3">
                <Highlight
                  label="Urgency"
                  value={labelFor(
                    HIRING_URGENCIES,
                    application?.hiring_urgency
                  )}
                />
                <Highlight
                  label="Volume (6 mo)"
                  value={labelFor(HIRING_VOLUMES, application?.hiring_volume)}
                />
                <Highlight
                  label="Hiring regions"
                  value={
                    application?.hiring_regions.length
                      ? application.hiring_regions.slice(0, 2).join(", ")
                      : "—"
                  }
                  more={
                    (application?.hiring_regions.length ?? 0) > 2
                      ? `+${(application?.hiring_regions.length ?? 0) - 2} more`
                      : null
                  }
                />
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Links */}
            <Card title="Links">
              <ul className="space-y-2">
                <LinkRow
                  icon={Globe}
                  label="Website"
                  value={hostnameFromUrl(application?.website_url)}
                  href={application?.website_url ?? null}
                />
                <LinkRow
                  icon={LinkedInLogo}
                  label="LinkedIn"
                  value="Connect"
                  placeholder
                />
                <LinkRow
                  icon={XLogo}
                  label="X / Twitter"
                  value="Connect"
                  placeholder
                />
                <LinkRow
                  icon={GitHubLogo}
                  label="GitHub"
                  value="Connect"
                  placeholder
                />
              </ul>
              <button
                type="button"
                disabled
                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-edge bg-page-alt px-3 py-2 text-[11px] font-semibold text-subtle transition-opacity hover:opacity-80 disabled:cursor-not-allowed font-raleway"
              >
                <Plus className="h-3 w-3" />
                Add another link
              </button>
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
                  ok={!!application?.legal_name}
                  label="Company name"
                  detail={application?.legal_name ?? "Not set"}
                />
                <Verify
                  ok={!!application?.website_url}
                  label="Website"
                  detail={hostnameFromUrl(application?.website_url)}
                />
                <Verify
                  ok={isApproved}
                  label="Company approved by Veloraa"
                  detail={
                    isApproved
                      ? "Verified company"
                      : "Pending review by our team"
                  }
                />
              </div>
            </Card>

            {/* Settings shortcut */}
            <Link
              href="/company/settings"
              className="group block overflow-hidden rounded-2xl border border-edge bg-surface p-5 transition-all hover:border-accent/40 hover:shadow-[0_10px_30px_-15px_rgba(74,222,128,0.35)]"
            >
              <p className="text-[10px] uppercase tracking-[0.12em] text-accent font-jetbrains">
                Settings
              </p>
              <p className="mt-1 text-sm font-semibold text-heading font-raleway">
                Manage notifications, security & billing
              </p>
              <p className="mt-1 text-xs text-body font-raleway">
                Profile fields can be edited from your company settings.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent transition-transform group-hover:translate-x-0.5 font-raleway">
                Open settings
                <ExternalLink className="h-3 w-3" />
              </span>
            </Link>
          </div>
        </div>

        <div className="h-16" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function buildTagline(
  app: Awaited<ReturnType<typeof requireCompany>>["application"]
): string | null {
  if (!app) return null;
  const stage = labelFor(COMPANY_STAGES, app.company_stage);
  const size = labelFor(COMPANY_SIZES, app.company_size);
  const industry = app.industries[0];
  const fragments: string[] = [];
  if (stage && stage !== "—") fragments.push(stage);
  if (industry) fragments.push(`${industry} company`);
  if (size && size !== "—") fragments.push(`${size} team`);
  if (!fragments.length) return null;
  return fragments.join(" · ");
}

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

function Field({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] uppercase tracking-[0.12em] text-subtle font-jetbrains">
        {label}
      </dt>
      {href ? (
        <dd className="mt-1 truncate">
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-semibold text-accent transition-opacity hover:opacity-80 font-raleway"
          >
            <span className="truncate">{value}</span>
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
        </dd>
      ) : (
        <dd className="mt-1 truncate text-sm font-semibold text-heading font-raleway">
          {value || "—"}
        </dd>
      )}
    </div>
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
      {/* corner glow */}
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

function Highlight({
  label,
  value,
  more,
}: {
  label: string;
  value: string;
  more?: string | null;
}) {
  return (
    <div className="rounded-xl border border-edge bg-page-alt p-4">
      <p className="text-[10px] uppercase tracking-[0.12em] text-subtle font-jetbrains">
        {label}
      </p>
      <p className="mt-1.5 text-sm font-semibold text-heading font-raleway">
        {value || "—"}
      </p>
      {more && (
        <p className="mt-0.5 text-[10px] text-accent font-jetbrains">{more}</p>
      )}
    </div>
  );
}

function LinkRow({
  icon: Icon,
  label,
  value,
  href,
  placeholder = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href?: string | null;
  placeholder?: boolean;
}) {
  const isLive = !!href && !placeholder;
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
            Soon
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
          ok
            ? "bg-accent/15 text-accent"
            : "bg-amber-500/15 text-amber-600"
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
