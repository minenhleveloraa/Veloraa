import Link from "next/link";
import {
  BellDot,
  FileText,
  Globe,
  MessageSquare,
  Settings,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import TalentRouteFrame from "@/components/talent/TalentRouteFrame";

export default function TalentSettingsPage() {
  return (
    <TalentRouteFrame
      eyebrow="Talent settings"
      title="Control visibility, alerts, and account signal"
      description="This is the quieter side of the dashboard: profile exposure, contact cadence, and the details that keep your talent surface clean and credible."
      icon={Settings}
      actions={[
        { href: "/talent/profile", label: "Open profile" },
        { href: "/talent/notifications", label: "Notification center" },
      ]}
      stats={[
        { label: "Visibility", value: "On", detail: "Live to matched companies" },
        { label: "Email cadence", value: "Daily", detail: "Digest plus instant direct messages" },
        { label: "Profile assets", value: "4/5", detail: "Resume, links, and headline mostly complete" },
      ]}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <SettingsPanel
          icon={Globe}
          title="Profile visibility"
          description="Decide how discoverable you are while staying reachable for the best-fit roles."
          rows={[
            { label: "Open to offers", detail: "Shown in matched searches", enabled: true },
            { label: "Top matches only", detail: "Limits broad employer discovery", enabled: false },
            { label: "Quiet mode", detail: "Pause visibility for 30 days", enabled: false },
          ]}
        />

        <SettingsPanel
          icon={BellDot}
          title="Notifications"
          description="Keep signal high. Push urgent events immediately and digest the rest."
          rows={[
            { label: "Direct company messages", detail: "Instant", enabled: true },
            { label: "New invite activity", detail: "Instant", enabled: true },
            { label: "Low-priority job suggestions", detail: "Daily digest", enabled: false },
          ]}
        />

        <SettingsPanel
          icon={MessageSquare}
          title="Communication defaults"
          description="Set the tone before teams reach out so you get fewer low-fit conversations."
          rows={[
            { label: "Share timezone in intros", detail: "Helps scheduling", enabled: true },
            { label: "Show response window", detail: "Signals availability to teams", enabled: true },
            { label: "Auto-pause after inactivity", detail: "Protects your response rate", enabled: false },
          ]}
        />

        <SettingsPanel
          icon={ShieldCheck}
          title="Account hygiene"
          description="These details influence trust on the company side more than most candidates expect."
          rows={[
            { label: "Resume attached", detail: "Visible to approved matches", enabled: true },
            { label: "Portfolio links verified", detail: "One link still missing", enabled: false },
            { label: "Role history up to date", detail: "Last reviewed this week", enabled: true },
          ]}
        />
      </div>

      <section className="mt-6 rounded-2xl border border-edge bg-surface p-5">
        <p className="text-[11px] uppercase tracking-[0.16em] text-subtle font-jetbrains">
          Fast access
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/talent/profile"
            className="inline-flex items-center gap-1.5 rounded-lg border border-edge bg-page-alt px-4 py-2 text-xs font-semibold text-heading transition-all hover:border-accent/30 hover:text-accent font-raleway"
          >
            <FileText className="h-3.5 w-3.5" />
            Profile and role
          </Link>
          <Link
            href="/talent/messages"
            className="inline-flex items-center gap-1.5 rounded-lg border border-edge bg-page-alt px-4 py-2 text-xs font-semibold text-heading transition-all hover:border-accent/30 hover:text-accent font-raleway"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Open messages
          </Link>
        </div>
      </section>
    </TalentRouteFrame>
  );
}

function SettingsPanel({
  icon: Icon,
  title,
  description,
  rows,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  rows: Array<{ label: string; detail: string; enabled: boolean }>;
}) {
  return (
    <section className="rounded-2xl border border-edge bg-surface p-5 transition-all duration-300 hover:border-accent/25 hover:shadow-[0_24px_60px_-40px_rgba(10,46,26,0.3)]">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-heading font-raleway">{title}</p>
          <p className="mt-1 text-sm leading-relaxed text-body font-raleway">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-3 rounded-xl border border-edge bg-page-alt px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-heading font-raleway">
                {row.label}
              </p>
              <p className="text-[11px] text-body font-raleway">{row.detail}</p>
            </div>
            <span
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full ${
                row.enabled ? "bg-accent" : "bg-edge"
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  row.enabled ? "translate-x-[18px]" : "translate-x-0.5"
                }`}
              />
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
