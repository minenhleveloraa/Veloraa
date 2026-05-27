import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Globe,
  KeyRound,
  Shield,
  Trash2,
  UserSquare2,
  Users2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types/db";

export const metadata = {
  title: "Settings · Veloraa",
};

export default async function TalentSettingsPage() {
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
  if (!profile || profile.role !== "talent") redirect("/profile");

  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 sm:px-6 lg:px-10">
      {/* Header */}
      <div>
        <span className="mb-2 inline-block text-[11px] uppercase tracking-[0.08em] text-accent font-jetbrains">
          Settings
        </span>
        <h1 className="text-3xl font-bold text-heading font-raleway">
          Account &amp; preferences
        </h1>
        <p className="mt-2 max-w-xl text-sm text-body font-raleway">
          Notifications, visibility and account controls. Looking for your
          headline, skills, work history or resume? Those now live on your
          profile page.
        </p>
      </div>

      {/* Profile shortcut banner */}
      <Link
        href="/talent/profile"
        className="group mt-6 flex items-center gap-4 rounded-2xl border border-edge bg-surface p-4 transition-all hover:border-accent/40 hover:shadow-[0_10px_30px_-15px_rgba(74,222,128,0.35)] sm:p-5"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <UserSquare2 className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-heading font-raleway">
            Manage your talent profile
          </p>
          <p className="mt-0.5 truncate text-xs text-body font-raleway">
            Headline, skills, work history, resume and links — everything
            companies see about you.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent transition-transform group-hover:translate-x-0.5 font-raleway">
          Open
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </Link>

      {/* Visibility */}
      <SettingsCard
        icon={Globe}
        title="Profile visibility"
        description="Decide how discoverable you are while staying reachable for the best-fit roles."
      >
        <div className="divide-y divide-edge overflow-hidden rounded-xl border border-edge">
          <Toggle label="Open to offers" detail="Shown in matched searches" defaultChecked />
          <Toggle label="Top matches only" detail="Limits broad employer discovery" />
          <Toggle label="Quiet mode" detail="Pause visibility for 30 days" />
        </div>
      </SettingsCard>

      {/* Notifications */}
      <SettingsCard
        icon={Bell}
        title="Notifications"
        description="Email preferences for company outreach, invites and platform updates."
      >
        <div className="divide-y divide-edge overflow-hidden rounded-xl border border-edge">
          <Toggle label="Direct company messages" detail="Instant" defaultChecked />
          <Toggle label="New interview invites" detail="Instant" defaultChecked />
          <Toggle label="Job recommendations" detail="Daily digest" defaultChecked />
          <Toggle label="Product announcements" detail="Occasional" />
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
              Pause your account or permanently delete it. Deletion removes
              your profile from search and is irreversible.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled
                className="inline-flex items-center gap-1.5 rounded-lg border border-ghost-border bg-surface px-4 py-2 text-[11px] font-semibold text-heading transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60 font-raleway"
              >
                Pause account
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
  detail,
  defaultChecked = false,
}: {
  label: string;
  detail?: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex cursor-not-allowed items-center justify-between gap-3 bg-surface p-4 opacity-80">
      <div className="min-w-0">
        <p className="text-sm text-heading font-raleway">{label}</p>
        {detail && (
          <p className="mt-0.5 text-[11px] text-subtle font-jetbrains">
            {detail}
          </p>
        )}
      </div>
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

