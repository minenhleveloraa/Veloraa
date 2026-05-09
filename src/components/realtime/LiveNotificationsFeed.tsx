"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useRealtime } from "@/components/realtime/RealtimeProvider";
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/app/actions/notifications";
import {
  BellDot,
  Briefcase,
  CheckCircle2,
  Clock3,
  MessageSquare,
  Send,
  CreditCard,
} from "lucide-react";

export interface NotificationRow {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  ref_table: string | null;
  ref_id: string | null;
  read_at: string | null;
  created_at: string;
}

const KIND_ICON: Record<string, typeof BellDot> = {
  review_decision: CheckCircle2,
  invite: Send,
  message: MessageSquare,
  recommendation: Briefcase,
  subscription: CreditCard,
};

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function LiveNotificationsFeed({
  initialNotifications,
  unreadCount,
}: {
  initialNotifications: NotificationRow[];
  unreadCount: number;
}) {
  const router = useRouter();
  const { onChange } = useRealtime();
  const [isPending, startTransition] = useTransition();

  // Auto-refresh when a new notification INSERT arrives via Realtime.
  useEffect(() => {
    const unsub = onChange("notifications", () => {
      router.refresh();
    });
    return unsub;
  }, [onChange, router]);

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  };

  const handleMarkRead = (id: string) => {
    startTransition(async () => {
      await markNotificationRead(id);
      router.refresh();
    });
  };

  return (
    <>
      {/* Mark all read button */}
      {unreadCount > 0 && (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs text-subtle font-jetbrains">
            {unreadCount} unread
          </p>
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="text-xs font-semibold text-accent transition-opacity hover:opacity-80 disabled:opacity-50 font-raleway"
          >
            Mark all as read
          </button>
        </div>
      )}

      {/* Feed */}
      {initialNotifications.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-edge bg-surface px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
            <BellDot className="h-6 w-6" />
          </div>
          <div className="max-w-sm">
            <h2 className="text-lg font-semibold text-heading font-raleway">
              No notifications yet
            </h2>
            <p className="mt-1 text-sm text-body font-raleway">
              When something important happens — a review decision, invite, or
              new match — it will show up here.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {initialNotifications.map((n) => {
            const Icon = KIND_ICON[n.kind] ?? BellDot;
            const isUnread = !n.read_at;

            return (
              <article
                key={n.id}
                onClick={() => isUnread && handleMarkRead(n.id)}
                role={isUnread ? "button" : undefined}
                tabIndex={isUnread ? 0 : undefined}
                className={`rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-0.5 ${
                  isUnread
                    ? "border-accent/30 bg-accent/[0.03] cursor-pointer hover:shadow-[0_24px_60px_-40px_rgba(10,46,26,0.3)]"
                    : "border-edge bg-surface opacity-70"
                }`}
              >
                <div className="flex items-start gap-4">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                      isUnread
                        ? "bg-accent/10 text-accent"
                        : "bg-page-alt text-subtle"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-heading font-raleway">
                        {n.title}
                        {isUnread && (
                          <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                        )}
                      </p>
                      <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-subtle font-jetbrains">
                        <Clock3 className="h-3.5 w-3.5 text-accent" />
                        {timeAgo(n.created_at)}
                      </span>
                    </div>
                    {n.body && (
                      <p className="mt-2 text-sm leading-relaxed text-body font-raleway line-clamp-2">
                        {n.body}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
