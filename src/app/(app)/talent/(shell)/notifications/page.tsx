import Link from "next/link";
import {
  BellDot,
  Settings,
} from "lucide-react";
import { redirect } from "next/navigation";
import TalentRouteFrame from "@/components/talent/TalentRouteFrame";
import { createClient } from "@/lib/supabase/server";
import LiveNotificationsFeed, {
  type NotificationRow,
} from "@/components/realtime/LiveNotificationsFeed";

function getOneWeekAgoIso() {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
}

export default async function TalentNotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: rows } = await supabase
    .from("notifications")
    .select("id, kind, title, body, ref_table, ref_id, read_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const notifications = (rows ?? []) as NotificationRow[];
  const unreadCount = notifications.filter((n) => !n.read_at).length;

  // Stats for the week
  const oneWeekAgo = getOneWeekAgoIso();
  const thisWeek = notifications.filter((n) => n.created_at >= oneWeekAgo).length;

  return (
    <TalentRouteFrame
      eyebrow="Talent notifications"
      title="The signal that actually needs your attention"
      description="Notifications stay tight on purpose: new job matches, invite movement, and message activity. No noisy filler."
      icon={BellDot}
      actions={[
        { href: "/talent/messages", label: "Open inbox" },
        { href: "/talent/settings", label: "Tune preferences" },
      ]}
      stats={[
        {
          label: "Unread",
          value: String(unreadCount).padStart(2, "0"),
          detail: "Needs action now",
        },
        {
          label: "This week",
          value: String(thisWeek).padStart(2, "0"),
          detail: "Across jobs, invites, and messages",
        },
        {
          label: "Total",
          value: String(notifications.length).padStart(2, "0"),
          detail: "All-time notifications",
        },
      ]}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]">
        <section className="space-y-4">
          <LiveNotificationsFeed
            initialNotifications={notifications}
            unreadCount={unreadCount}
          />
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-edge bg-surface p-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-subtle font-jetbrains">
              Delivery rules
            </p>
            <div className="mt-4 space-y-3">
              <PreferenceRow label="Direct messages" detail="Instant push-style alerts" enabled />
              <PreferenceRow label="New job matches" detail="Daily digest at 08:00" enabled />
              <PreferenceRow label="Low-priority updates" detail="Muted in email" enabled={false} />
            </div>
          </section>

          <section className="rounded-2xl border border-edge bg-surface p-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-subtle font-jetbrains">
              Adjust notifications
            </p>
            <p className="mt-3 text-sm leading-relaxed text-body font-raleway">
              If the cadence feels noisy, tune it in settings rather than
              turning everything off and missing real opportunities.
            </p>
            <Link
              href="/talent/settings"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-accent transition-opacity hover:opacity-80 font-raleway"
            >
              Open settings
              <Settings className="h-3.5 w-3.5" />
            </Link>
          </section>
        </aside>
      </div>
    </TalentRouteFrame>
  );
}

function PreferenceRow({
  label,
  detail,
  enabled,
}: {
  label: string;
  detail: string;
  enabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-edge bg-page-alt px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-heading font-raleway">{label}</p>
        <p className="text-[11px] text-body font-raleway">{detail}</p>
      </div>
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full ${
          enabled ? "bg-accent" : "bg-edge"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            enabled ? "translate-x-4.5" : "translate-x-0.5"
          }`}
        />
      </span>
    </div>
  );
}
