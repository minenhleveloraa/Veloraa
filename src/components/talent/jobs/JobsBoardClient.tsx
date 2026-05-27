"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Briefcase,
  Building2,
  ChevronDown,
  ChevronUp,
  Clock3,
  MapPin,
  MessageSquare,
  Sparkles,
  Star,
} from "lucide-react";

export interface JobCard {
  id: string;
  company_id: string;
  company_name: string;
  title: string;
  role_category: string;
  seniority: string;
  employment_type: string;
  work_arrangement: string;
  location: string | null;
  salary_range: string | null;
  description: string;
  skills: string[];
  benefits: string | null;
  created_at: string;
  recommended: boolean;
  recommendation_note: string | null;
}

function timeAgo(iso: string): string {
  try {
    const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (secs < 3600) return `${Math.max(1, Math.floor(secs / 60))}m ago`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
    if (secs < 86400 * 7) return `${Math.floor(secs / 86400)}d ago`;
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export default function JobsBoardClient({ jobs }: { jobs: JobCard[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2.5 rounded-2xl border border-dashed border-edge bg-surface px-4 py-10 text-center sm:gap-3 sm:py-16">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent sm:h-12 sm:w-12">
          <Briefcase className="h-5 w-5 sm:h-6 sm:w-6" />
        </span>
        <p className="text-sm font-semibold text-heading font-raleway">No matched jobs yet</p>
        <p className="max-w-xs text-[11px] leading-relaxed text-body font-raleway sm:text-xs">
          Once your profile is approved and live, the Veloraa team will start
          surfacing roles curated for you here.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-3 sm:space-y-4">
      {jobs.map((job) => {
        const expanded = expandedId === job.id;
        return (
          <article
            key={job.id}
            className="rounded-xl border border-edge bg-surface transition-all duration-300 hover:border-accent/30 hover:shadow-[0_26px_70px_-46px_rgba(10,46,26,0.32)] sm:rounded-2xl"
          >
            {/* Card header — always visible, clickable to expand */}
            <button
              type="button"
              onClick={() => setExpandedId(expanded ? null : job.id)}
              className="flex w-full items-start gap-3 p-3.5 text-left sm:gap-4 sm:p-5"
            >
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent sm:h-10 sm:w-10 sm:rounded-2xl">
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <p className="truncate text-[13px] font-semibold text-heading font-raleway sm:text-sm">
                    {job.title}
                  </p>
                  {job.recommended && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/8 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.06em] text-accent font-jetbrains sm:px-2 sm:text-[10px] sm:tracking-[0.08em]">
                      <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      Curated
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-[11px] text-body font-raleway sm:text-xs">
                  {job.company_name}
                  {job.salary_range ? ` · ${job.salary_range}` : ""}
                </p>

                <div className="mt-2 flex flex-wrap gap-x-2.5 gap-y-1 text-[10px] uppercase tracking-[0.1em] text-subtle font-jetbrains sm:mt-3 sm:gap-x-3 sm:text-[11px] sm:tracking-[0.12em]">
                  {job.location && (
                    <span className="inline-flex items-center gap-1 sm:gap-1.5">
                      <MapPin className="h-3 w-3 text-accent sm:h-3.5 sm:w-3.5" />
                      {job.location}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 sm:gap-1.5">
                    <Clock3 className="h-3 w-3 text-accent sm:h-3.5 sm:w-3.5" />
                    {job.employment_type}
                  </span>
                  <span className="inline-flex items-center gap-1 sm:gap-1.5">
                    <Sparkles className="h-3 w-3 text-accent sm:h-3.5 sm:w-3.5" />
                    {job.work_arrangement}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2">
                {/* salary mini-badge */}
                {job.salary_range && (
                  <div className="hidden rounded-xl border border-accent/25 bg-accent/8 px-2.5 py-1.5 text-right sm:block">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-accent font-jetbrains">
                      Salary
                    </p>
                    <p className="text-xs font-bold text-heading font-raleway">
                      {job.salary_range}
                    </p>
                  </div>
                )}
                <span className="text-subtle">
                  {expanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </span>
              </div>
            </button>

            {/* Expanded content */}
            {expanded && (
              <div className="border-t border-edge px-3.5 pb-3.5 pt-3 sm:px-5 sm:pb-5 sm:pt-4">
                {/* Recommendation note from admin */}
                {job.recommendation_note && (
                  <div className="mb-3 flex items-start gap-2 rounded-xl border border-accent/25 bg-accent/5 px-3 py-2.5 sm:mb-4 sm:gap-2.5 sm:px-3.5 sm:py-3">
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent sm:h-4 sm:w-4" />
                    <p className="text-[11px] leading-relaxed text-body font-raleway italic sm:text-xs">
                      {job.recommendation_note}
                    </p>
                  </div>
                )}

                {/* Badges row */}
                <div className="mb-3 flex flex-wrap gap-1.5 sm:mb-4">
                  <Chip>{job.seniority}</Chip>
                  <Chip>{job.employment_type}</Chip>
                  <Chip>{job.work_arrangement}</Chip>
                  {job.role_category && <Chip>{job.role_category}</Chip>}
                </div>

                {/* Description */}
                <p className="whitespace-pre-line text-[13px] leading-relaxed text-body font-raleway sm:text-sm">
                  {job.description}
                </p>

                {/* Skills */}
                {job.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5 sm:mt-4">
                    {job.skills.map((s) => (
                      <span
                        key={s}
                        className="rounded-lg border border-edge bg-page-alt px-2 py-0.5 text-[10px] text-heading font-jetbrains sm:px-2.5 sm:py-1 sm:text-[11px]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {/* Benefits */}
                {job.benefits && (
                  <div className="mt-3 sm:mt-4">
                    <p className="mb-1.5 text-[10px] uppercase tracking-[0.12em] text-subtle font-jetbrains">
                      Benefits
                    </p>
                    <p className="text-[11px] leading-relaxed text-body font-raleway sm:text-xs">
                      {job.benefits}
                    </p>
                  </div>
                )}

                {/* Footer row */}
                <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 sm:mt-4 sm:gap-3">
                  <p className="text-[10px] text-subtle font-jetbrains sm:text-[11px]">
                    Posted {timeAgo(job.created_at)}
                  </p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    <Link
                      href="/talent/messages"
                      className="inline-flex items-center gap-1 rounded-lg border border-edge bg-page-alt px-2.5 py-1.5 text-[11px] font-semibold text-heading transition-all hover:border-accent/30 hover:text-accent font-raleway sm:gap-1.5 sm:px-3 sm:py-2 sm:text-xs"
                    >
                      <MessageSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      Ask for intro
                    </Link>
                    <Link
                      href="/talent/invites"
                      className="inline-flex items-center gap-1 rounded-lg bg-accent px-2.5 py-1.5 text-[11px] font-semibold text-white transition-all hover:opacity-90 hover:shadow-[0_18px_40px_-24px_rgba(74,222,128,0.42)] font-raleway sm:gap-1.5 sm:px-3 sm:py-2 sm:text-xs"
                    >
                      Open fit notes
                      <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-pill-bg px-2 py-0.5 text-[9px] font-medium text-pill-text font-raleway sm:px-2.5 sm:text-[10px]">
      {children}
    </span>
  );
}
