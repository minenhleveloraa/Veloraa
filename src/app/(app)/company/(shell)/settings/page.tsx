import {
  AlertTriangle,
  Bell,
  Building2,
  ExternalLink,
  Globe,
  ImageIcon,
  KeyRound,
  Shield,
  Trash2,
  Users2,
} from "lucide-react";
import { requireCompany } from "@/lib/company/guard";
import {
  COMPANY_SIZES,
  COMPANY_STAGES,
  HIRING_URGENCIES,
  HIRING_VOLUMES,
  INDUSTRIES,
  SALARY_RANGES,
  WORK_STYLES,
  labelFor,
} from "@/lib/company/options";

export default async function CompanySettingsPage() {
  const { profile, application } = await requireCompany();

  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 sm:px-6 lg:px-10">
      {/* Header */}
      <div>
        <span className="mb-2 inline-block text-[11px] uppercase tracking-[0.08em] text-accent font-jetbrains">
          Settings
        </span>
        <h1 className="text-3xl font-bold text-heading font-raleway">
          Company settings
        </h1>
        <p className="mt-2 max-w-xl text-sm text-body font-raleway">
          Manage your company profile, hiring preferences, team seats and
          account controls.
        </p>
      </div>

      {/* Company profile */}
      <SettingsCard
        icon={Building2}
        title="Company profile"
        description="Shown on your job posts and visible to matched candidates."
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-dashed border-edge bg-page-alt">
            <ImageIcon className="h-6 w-6 text-subtle" aria-hidden />
          </div>
          <div className="flex-1 space-y-4">
            <ReadonlyField
              label="Legal name"
              value={application?.legal_name ?? "—"}
            />
            <ReadonlyField
              label="Website"
              value={application?.website_url ?? "—"}
              isLink
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <ReadonlyField
                label="Size"
                value={labelFor(COMPANY_SIZES, application?.company_size)}
              />
              <ReadonlyField
                label="Stage"
                value={labelFor(COMPANY_STAGES, application?.company_stage)}
              />
              <ReadonlyField
                label="HQ"
                value={application?.hq_country ?? "—"}
              />
              <ReadonlyField
                label="Work style"
                value={labelFor(WORK_STYLES, application?.work_style)}
              />
            </div>
          </div>
        </div>
        <FooterAction
          hint="To edit, contact your Veloraa onboarding manager."
          actionLabel="Edit profile"
        />
      </SettingsCard>

      {/* Hiring preferences */}
      <SettingsCard
        icon={Globe}
        title="Hiring preferences"
        description="These influence the matches we send. Tune them as your needs change."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <ReadonlyField
            label="Industries"
            value={
              application?.industries.length
                ? application.industries.join(", ")
                : "—"
            }
          />
          <ReadonlyField
            label="Urgency"
            value={labelFor(HIRING_URGENCIES, application?.hiring_urgency)}
          />
          <ReadonlyField
            label="Planned hires (6mo)"
            value={labelFor(HIRING_VOLUMES, application?.hiring_volume)}
          />
          <ReadonlyField
            label="Salary range"
            value={labelFor(SALARY_RANGES, application?.salary_range)}
          />
          <ReadonlyField
            label="Roles you hire"
            value={
              application?.roles_hiring.length
                ? application.roles_hiring.join(", ")
                : "—"
            }
            wide
          />
          <ReadonlyField
            label="Hiring regions"
            value={
              application?.hiring_regions.length
                ? application.hiring_regions.join(", ")
                : "—"
            }
            wide
          />
        </div>
        <FooterAction
          hint={`Common industries: ${INDUSTRIES.slice(0, 3).join(", ")}…`}
          actionLabel="Update preferences"
        />
      </SettingsCard>

      {/* Team seats */}
      <SettingsCard
        icon={Users2}
        title="Team seats"
        description="Invite colleagues to collaborate on jobs and candidates."
      >
        <div className="rounded-xl border border-edge bg-page-alt p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-heading font-raleway">
                {profile.full_name ?? profile.email ?? "You"}
              </p>
              <p className="truncate text-[11px] text-subtle font-jetbrains">
                {profile.email ?? "—"}
              </p>
            </div>
            <span className="rounded-full border border-accent/30 bg-accent/5 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.1em] text-accent font-jetbrains">
              Owner
            </span>
          </div>
        </div>
        <p className="mt-3 text-xs text-body font-raleway">
          Multi-seat access is coming soon. Growth plans will include 3
          seats, Scale plans up to 5.
        </p>
        <FooterAction hint="Invite up to 2 more teammates" actionLabel="Invite" />
      </SettingsCard>

      {/* Notifications */}
      <SettingsCard
        icon={Bell}
        title="Notifications"
        description="Email preferences for shortlist deliveries, messages and billing."
      >
        <div className="divide-y divide-edge overflow-hidden rounded-xl border border-edge">
          <Toggle label="New shortlist delivered" defaultChecked />
          <Toggle label="Candidate replies to your messages" defaultChecked />
          <Toggle label="Weekly hiring digest" />
          <Toggle label="Product announcements" defaultChecked />
          <Toggle label="Billing receipts" defaultChecked />
        </div>
      </SettingsCard>

      {/* Security */}
      <SettingsCard
        icon={Shield}
        title="Account &amp; security"
        description="Password, sign-in methods and session controls."
      >
        <div className="space-y-3">
          <ReadonlyRow
            icon={KeyRound}
            label="Sign-in email"
            value={profile.email ?? "—"}
            actionLabel="Change"
          />
          <ReadonlyRow
            icon={Shield}
            label="Two-factor auth"
            value="Off"
            actionLabel="Enable 2FA"
          />
          <ReadonlyRow
            icon={Users2}
            label="Active sessions"
            value="1 device"
            actionLabel="Sign out everywhere"
          />
        </div>
      </SettingsCard>

      {/* Danger zone */}
      <section className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/5 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-heading font-raleway">
              Danger zone
            </h3>
            <p className="mt-1 text-xs text-body font-raleway">
              Archive or permanently delete your company account. This
              removes your job posts and stops all matches.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled
                className="inline-flex items-center gap-1.5 rounded-lg border border-ghost-border bg-surface px-4 py-2 text-[11px] font-semibold text-heading transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60 font-raleway"
              >
                Archive company
              </button>
              <button
                type="button"
                disabled
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-[11px] font-semibold text-red-500 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60 font-raleway"
              >
                <Trash2 className="h-3 w-3" />
                Delete account
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------
// Local primitives
// ---------------------------------------------------------------------

function SettingsCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 rounded-2xl border border-edge bg-surface p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pill-bg text-accent">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-heading font-raleway">
            {title}
          </h2>
          <p className="mt-1 text-xs text-body font-raleway">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function ReadonlyField({
  label,
  value,
  isLink = false,
  wide = false,
}: {
  label: string;
  value: string;
  isLink?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <p className="text-[10px] uppercase tracking-[0.1em] text-subtle font-jetbrains">
        {label}
      </p>
      {isLink && value && value !== "—" ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-accent transition-opacity hover:opacity-80 font-raleway"
        >
          <span className="truncate">{value}</span>
          <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
      ) : (
        <p className="mt-1 truncate text-sm font-semibold text-heading font-raleway">
          {value || "—"}
        </p>
      )}
    </div>
  );
}

function ReadonlyRow({
  icon: Icon,
  label,
  value,
  actionLabel,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  actionLabel: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-edge bg-page-alt p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-accent">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-[0.1em] text-subtle font-jetbrains">
          {label}
        </p>
        <p className="mt-0.5 truncate text-sm font-semibold text-heading font-raleway">
          {value}
        </p>
      </div>
      <button
        type="button"
        disabled
        className="shrink-0 rounded-lg border border-edge bg-surface px-3 py-1.5 text-[11px] font-semibold text-heading transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60 font-raleway"
      >
        {actionLabel}
      </button>
    </div>
  );
}

function Toggle({
  label,
  defaultChecked = false,
}: {
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex cursor-not-allowed items-center justify-between gap-3 bg-surface p-4 opacity-80">
      <span className="text-sm text-heading font-raleway">{label}</span>
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
          defaultChecked ? "bg-accent" : "bg-edge"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            defaultChecked ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </span>
      <input
        type="checkbox"
        defaultChecked={defaultChecked}
        disabled
        className="sr-only"
      />
    </label>
  );
}

function FooterAction({
  hint,
  actionLabel,
}: {
  hint: string;
  actionLabel: string;
}) {
  return (
    <div className="mt-5 flex flex-col items-start justify-between gap-2 border-t border-edge pt-4 sm:flex-row sm:items-center">
      <p className="text-[11px] text-subtle font-jetbrains">{hint}</p>
      <button
        type="button"
        disabled
        className="inline-flex items-center gap-1.5 rounded-lg border border-edge bg-surface px-4 py-2 text-[11px] font-semibold text-heading transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60 font-raleway"
      >
        {actionLabel}
      </button>
    </div>
  );
}
