"use client";

import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock3,
  MapPin,
  Send,
  Sparkles,
  Star,
} from "lucide-react";
import type { JobApplicationStatus } from "@/lib/types/db";
import { cn } from "@/lib/utils";

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
  application_status: JobApplicationStatus | null;
}

function timeAgo(iso: string): string {
  try {
    const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (seconds < 3600) return `${Math.max(1, Math.floor(seconds / 60))}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 86400 * 7) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function statusLabel(status: JobApplicationStatus | null): string | null {
  if (!status) return null;
  if (status === "accepted") return "Shortlisted";
  if (status === "declined") return "Declined";
  if (status === "withdrawn") return "Withdrawn";
  return "Interest sent";
}

export default function JobsBoardClient({ jobs }: { jobs: JobCard[] }) {
  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2.5 rounded-2xl border border-dashed border-edge bg-surface px-4 py-10 text-center sm:gap-3 sm:py-16">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent sm:h-12 sm:w-12">
          <Briefcase className="h-5 w-5 sm:h-6 sm:w-6" />
        </span>
        <p className="text-sm font-semibold text-heading font-raleway">
          No published jobs yet
        </p>
        <p className="max-w-xs text-[11px] leading-relaxed text-body font-raleway sm:text-xs">
          Published roles will appear here as soon as vetted companies go live
          with new openings.
        </p>
      </div>
    );
  }

  return (
    <section className="grid gap-3 sm:gap-4">
      {jobs.map((job) => {
        const appStatus = statusLabel(job.application_status);
        return (
          <Link
            key={job.id}
            href={`/talent/jobs/${job.id}`}
            className="group block rounded-xl border border-edge bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-accent/35 hover:shadow-[0_28px_70px_-46px_rgba(10,46,26,0.38)] sm:rounded-2xl"
          >
            <article className="p-4 sm:p-5">
              <div className="flex items-start gap-3 sm:gap-4">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent sm:h-11 sm:w-11 sm:rounded-2xl">
                  <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <h2 className="min-w-0 text-[15px] font-bold leading-snug text-heading font-raleway sm:text-lg">
                      {job.title}
                    </h2>
                    {job.recommended && (
                      <Badge tone="accent" icon={Star}>
                        Curated
                      </Badge>
                    )}
                    {appStatus && (
                      <Badge
                        tone={
                          job.application_status === "declined"
                            ? "muted"
                            : "accent"
                        }
                        icon={
                          job.application_status === "pending"
                            ? Send
                            : CheckCircle2
                        }
                      >
                        {appStatus}
                      </Badge>
                    )}
                  </div>

                  <p className="mt-1 truncate text-xs text-body font-raleway sm:text-sm">
                    {job.company_name}
                    {job.salary_range ? ` - ${job.salary_range}` : ""}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-[10px] uppercase tracking-[0.1em] text-subtle font-jetbrains sm:text-[11px]">
                    {job.location && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-accent" />
                        {job.location}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5 text-accent" />
                      {job.employment_type}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-accent" />
                      {job.work_arrangement}
                    </span>
                  </div>
                </div>

                <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-edge bg-page-alt text-body transition-all group-hover:border-accent/40 group-hover:text-accent sm:flex">
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>

              {job.recommendation_note && (
                <div className="mt-4 rounded-xl border border-accent/25 bg-accent/5 px-3 py-2.5">
                  <p className="text-[11px] leading-relaxed text-body font-raleway italic sm:text-xs">
                    {job.recommendation_note}
                  </p>
                </div>
              )}

              <p className="mt-4 line-clamp-3 text-[13px] leading-relaxed text-body font-raleway sm:text-sm">
                {job.description}
              </p>

              <div className="mt-4 flex flex-wrap gap-1.5">
                <Chip>{job.seniority}</Chip>
                <Chip>{job.role_category}</Chip>
                {job.skills.slice(0, 5).map((skill) => (
                  <Chip key={skill}>{skill}</Chip>
                ))}
                {job.skills.length > 5 && <Chip>+{job.skills.length - 5}</Chip>}
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-edge pt-3">
                <p className="text-[10px] text-subtle font-jetbrains sm:text-[11px]">
                  Posted {timeAgo(job.created_at)}
                </p>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-accent transition-transform group-hover:translate-x-0.5 font-raleway sm:text-xs">
                  View role
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </article>
          </Link>
        );
      })}
    </section>
  );
}

function Badge({
  children,
  icon: Icon,
  tone,
}: {
  children: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  tone: "accent" | "muted";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] font-jetbrains",
        tone === "accent"
          ? "border-accent/30 bg-accent/8 text-accent"
          : "border-edge bg-page-alt text-subtle"
      )}
    >
      <Icon className="h-3 w-3" />
      {children}
    </span>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-pill-bg px-2.5 py-1 text-[10px] font-medium text-pill-text font-raleway">
      {children}
    </span>
  );
}
