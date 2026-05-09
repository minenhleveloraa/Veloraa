"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  CalendarCheck,
  ExternalLink,
  MapPin,
  MessageSquare,
  Sparkles,
  Users,
  XCircle,
} from "lucide-react";
import InviteInterviewModal from "./InviteInterviewModal";

interface TalentCard {
  user_id: string;
  full_name: string | null;
  headline: string | null;
  skills: string[];
  overall_score: number | null;
  expertise_level: string | null;
  location: string | null;
  note: string | null;
}

export default function RecommendedTalentSection({
  jobId,
  jobTitle,
  talents,
  invitationsByTalent,
}: {
  jobId: string;
  jobTitle: string;
  talents: TalentCard[];
  invitationsByTalent: Record<string, string>;
}) {
  const [inviteTarget, setInviteTarget] = useState<TalentCard | null>(null);
  const [sentInvites, setSentInvites] = useState<Set<string>>(
    new Set(Object.keys(invitationsByTalent))
  );

  function handleInviteSuccess() {
    if (inviteTarget) {
      setSentInvites((prev) => new Set([...prev, inviteTarget.user_id]));
    }
    setInviteTarget(null);
  }

  return (
    <>
      <section className="rounded-2xl border border-edge bg-surface p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-heading font-raleway">
              Recommended talent
            </h2>
            <p className="text-xs text-body font-raleway">
              Pre-vetted candidates curated by the Veloraa team
            </p>
          </div>
        </div>

        {talents.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
              <Users className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-heading font-raleway">
              Candidates are being matched
            </p>
            <p className="max-w-sm text-xs text-body font-raleway">
              Our team is reviewing approved talent for this role. Expect your
              first shortlist within 48 hours of going live.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {talents.map((t) => {
              const invStatus =
                invitationsByTalent[t.user_id] ??
                (sentInvites.has(t.user_id) ? "pending" : null);

              return (
                <div
                  key={t.user_id}
                  className="flex flex-col gap-4 rounded-xl border border-edge bg-page-alt p-4 transition-all duration-200 hover:border-accent/20 hover:shadow-[0_8px_30px_-16px_rgba(10,46,26,0.2)] sm:flex-row sm:items-start"
                >
                  {/* Avatar + info */}
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-sm font-bold font-jetbrains">
                      {initials(t.full_name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-heading font-raleway">
                        {t.full_name ?? "Anonymous"}
                      </p>
                      <p className="truncate text-xs text-body font-raleway">
                        {t.headline ?? "—"}
                      </p>
                      {t.location && (
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-subtle font-raleway">
                          <MapPin className="h-3 w-3" />
                          {t.location}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {t.skills.slice(0, 5).map((s) => (
                          <span
                            key={s}
                            className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium text-body font-jetbrains"
                          >
                            {s}
                          </span>
                        ))}
                        {t.skills.length > 5 && (
                          <span className="text-[10px] text-subtle font-jetbrains">
                            +{t.skills.length - 5}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Score + actions */}
                  <div className="flex shrink-0 flex-col items-end gap-3">
                    {t.overall_score != null && (
                      <div className="rounded-xl border border-accent/25 bg-accent/8 px-3 py-1.5 text-right">
                        <p className="text-[10px] uppercase tracking-[0.1em] text-accent font-jetbrains">
                          Score
                        </p>
                        <p className="text-lg font-bold text-heading font-raleway">
                          {t.overall_score}
                        </p>
                        {t.expertise_level && (
                          <p className="text-[10px] text-body font-jetbrains">
                            {t.expertise_level}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/company/talent/${t.user_id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-edge bg-surface px-3 py-1.5 text-[11px] font-semibold text-heading transition-all hover:border-accent/30 hover:text-accent font-raleway"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View profile
                      </Link>
                      <Link
                        href="/company/messages"
                        className="inline-flex items-center gap-1 rounded-lg border border-edge bg-surface px-3 py-1.5 text-[11px] font-semibold text-heading transition-all hover:border-accent/30 hover:text-accent font-raleway"
                      >
                        <MessageSquare className="h-3 w-3" />
                        Message
                      </Link>
                      {invStatus === "pending" ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 text-[11px] font-semibold text-amber-600 font-raleway">
                          <Calendar className="h-3 w-3" />
                          Invite sent
                        </span>
                      ) : invStatus === "accepted" ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-accent/10 border border-accent/30 px-3 py-1.5 text-[11px] font-semibold text-accent font-raleway">
                          <CalendarCheck className="h-3 w-3" />
                          Accepted
                        </span>
                      ) : invStatus === "declined" ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-1.5 text-[11px] font-semibold text-red-500 font-raleway">
                          <XCircle className="h-3 w-3" />
                          Declined
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setInviteTarget(t)}
                          className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-[11px] font-semibold text-white transition-all hover:opacity-90 hover:shadow-[0_0_16px_rgba(74,222,128,0.3)] font-raleway"
                        >
                          <Calendar className="h-3 w-3" />
                          Invite to interview
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Interview invitation modal */}
      {inviteTarget && (
        <InviteInterviewModal
          jobId={jobId}
          jobTitle={jobTitle}
          talentUserId={inviteTarget.user_id}
          talentName={inviteTarget.full_name ?? "this candidate"}
          onClose={() => setInviteTarget(null)}
          onSuccess={handleInviteSuccess}
        />
      )}
    </>
  );
}

function initials(name: string | null): string {
  const src = (name ?? "?").trim();
  const parts = src.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}
