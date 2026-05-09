import Link from "next/link";
import {
  ArrowUpRight,
  CalendarClock,
  CalendarCheck,
  MessageSquare,
  Send,
  Sparkles,
  Users,
  XCircle,
} from "lucide-react";
import TalentRouteFrame from "@/components/talent/TalentRouteFrame";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import InvitationActions from "@/components/talent/InvitationActions";
import LiveInvitesList from "@/components/realtime/LiveInvitesList";

export default async function TalentInvitesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const admin = createAdminClient();
  const { data: invRows } = await admin
    .from("interview_invitations")
    .select("*")
    .eq("talent_user_id", user.id)
    .order("created_at", { ascending: false });

  const invitations = (invRows ?? []) as {
    id: string;
    job_id: string;
    company_user_id: string;
    proposed_dates: string[];
    accepted_date: string | null;
    message: string | null;
    status: string;
    decline_reason: string | null;
    thread_id: string | null;
    created_at: string;
  }[];

  // Hydrate job titles + company names
  const jobIds = [...new Set(invitations.map((i) => i.job_id))];
  const companyIds = [...new Set(invitations.map((i) => i.company_user_id))];

  const [jobsRes, companiesRes] = await Promise.all([
    jobIds.length > 0
      ? admin.from("company_jobs").select("id, title").in("id", jobIds)
      : Promise.resolve({ data: [] }),
    companyIds.length > 0
      ? admin
          .from("company_applications")
          .select("user_id, legal_name")
          .in("user_id", companyIds)
      : Promise.resolve({ data: [] }),
  ]);

  const jobMap = new Map(
    ((jobsRes.data ?? []) as { id: string; title: string }[]).map((j) => [j.id, j.title])
  );
  const companyMap = new Map(
    ((companiesRes.data ?? []) as { user_id: string; legal_name: string | null }[]).map((c) => [
      c.user_id,
      c.legal_name ?? "A company",
    ])
  );

  const pending = invitations.filter((i) => i.status === "pending");
  const accepted = invitations.filter((i) => i.status === "accepted");
  const declined = invitations.filter((i) => i.status === "declined");

  return (
    <TalentRouteFrame
      eyebrow="Talent invites"
      title="Review interview invitations"
      description="Companies have shortlisted you for these roles. Accept an invite to confirm the interview and start a conversation, or decline if the timing isn't right."
      icon={Send}
      actions={[
        { href: "/talent/messages", label: "Reply in messages" },
        { href: "/talent/jobs", label: "See more roles" },
      ]}
      stats={[
        {
          label: "Pending",
          value: String(pending.length).padStart(2, "0"),
          detail: "Need a response",
        },
        {
          label: "Accepted",
          value: String(accepted.length).padStart(2, "0"),
          detail: "Interviews confirmed",
        },
        {
          label: "Declined",
          value: String(declined.length).padStart(2, "0"),
          detail: "Passed on these",
        },
      ]}
    >
      <LiveInvitesList>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
        <section className="space-y-4">
          {invitations.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-edge bg-surface px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
                <Users className="h-6 w-6" />
              </div>
              <div className="max-w-sm">
                <h2 className="text-lg font-semibold text-heading font-raleway">
                  No invitations yet
                </h2>
                <p className="mt-1 text-sm text-body font-raleway">
                  When companies want to interview you, their invitations will
                  appear here. Keep your profile strong and responses timely.
                </p>
              </div>
            </div>
          ) : (
            invitations.map((inv) => {
              const jobTitle = jobMap.get(inv.job_id) ?? "Unknown role";
              const companyName = companyMap.get(inv.company_user_id) ?? "A company";
              const statusLabel =
                inv.status === "pending"
                  ? "Pending"
                  : inv.status === "accepted"
                  ? "Accepted"
                  : "Declined";
              const statusCls =
                inv.status === "pending"
                  ? "text-amber-500"
                  : inv.status === "accepted"
                  ? "text-accent"
                  : "text-red-500";

              return (
                <article
                  key={inv.id}
                  className="rounded-2xl border border-edge bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent/30 hover:shadow-[0_24px_60px_-40px_rgba(10,46,26,0.3)]"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                          <Users className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-heading font-raleway">
                            {jobTitle}
                          </p>
                          <p className="text-xs text-body font-raleway">
                            {companyName}
                          </p>
                          <p
                            className={`text-[11px] uppercase tracking-[0.12em] font-jetbrains ${statusCls}`}
                          >
                            {statusLabel}
                          </p>
                        </div>
                      </div>

                      {inv.message && (
                        <p className="mt-4 text-sm leading-relaxed text-body font-raleway">
                          {inv.message}
                        </p>
                      )}

                      {/* Proposed dates */}
                      <div className="mt-4 space-y-1.5">
                        <p className="text-[10px] uppercase tracking-[0.08em] text-subtle font-jetbrains">
                          Proposed times
                        </p>
                        {inv.proposed_dates.map((d, i) => {
                          const date = new Date(d);
                          const isAccepted =
                            inv.accepted_date &&
                            new Date(inv.accepted_date).getTime() === date.getTime();
                          return (
                            <div
                              key={i}
                              className={`inline-flex items-center gap-1.5 mr-2 rounded-lg border px-2.5 py-1 text-[11px] font-medium font-raleway ${
                                isAccepted
                                  ? "border-accent/30 bg-accent/10 text-accent"
                                  : "border-edge bg-page-alt text-body"
                              }`}
                            >
                              {isAccepted ? (
                                <CalendarCheck className="h-3 w-3" />
                              ) : (
                                <CalendarClock className="h-3 w-3 text-accent" />
                              )}
                              {date.toLocaleDateString(undefined, {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}{" "}
                              at{" "}
                              {date.toLocaleTimeString(undefined, {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                      {inv.status === "pending" ? (
                        <InvitationActions
                          invitationId={inv.id}
                          proposedDates={inv.proposed_dates}
                        />
                      ) : inv.status === "accepted" && inv.thread_id ? (
                        <Link
                          href="/talent/messages"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white transition-all hover:opacity-92 hover:shadow-[0_18px_40px_-24px_rgba(74,222,128,0.42)] font-raleway"
                        >
                          Open thread
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      ) : inv.status === "declined" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs font-semibold text-red-500 font-raleway">
                          <XCircle className="h-3.5 w-3.5" />
                          Declined
                        </span>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-edge bg-surface p-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-subtle font-jetbrains">
              Response pattern
            </p>
            <ul className="mt-4 space-y-3">
              <li className="flex gap-3">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <p className="text-sm text-body font-raleway">
                  A fast yes or no is better than silence. Teams read response
                  speed as signal.
                </p>
              </li>
              <li className="flex gap-3">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <p className="text-sm text-body font-raleway">
                  When you accept, your preferred time slot is confirmed and a
                  messaging thread opens automatically.
                </p>
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-edge bg-surface p-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-subtle font-jetbrains">
              Keep momentum
            </p>
            <p className="mt-3 text-sm leading-relaxed text-body font-raleway">
              Every active invite is mirrored in your message inbox so you can
              respond without leaving the talent workspace.
            </p>
            <Link
              href="/talent/messages"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-accent transition-opacity hover:opacity-80 font-raleway"
            >
              Open inbox
              <MessageSquare className="h-3.5 w-3.5" />
            </Link>
          </section>
        </aside>
      </div>
      </LiveInvitesList>
    </TalentRouteFrame>
  );
}
