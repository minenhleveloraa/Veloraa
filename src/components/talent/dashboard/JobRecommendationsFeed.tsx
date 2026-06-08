"use client";

import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Building2,
  MapPin,
  Sparkles,
  Star,
} from "lucide-react";

export interface RecommendedJob {
  id: string;
  href: string;
  company: string;
  title: string;
  location: string;
  stack: string[];
  compensation: string;
  matchScore: number;
  type: string;
  arrangement: string;
  description: string;
  postedAgo: string;
  recommended?: boolean;
}

export default function JobRecommendationsFeed({
  jobs = [],
}: {
  jobs?: RecommendedJob[];
}) {
  return (
    <section className="relative flex flex-col overflow-hidden rounded-2xl border border-edge bg-surface p-4 transition-all duration-300 hover:border-accent/25 hover:shadow-[0_24px_60px_-42px_rgba(10,46,26,0.3)] sm:rounded-3xl sm:p-6 max-h-[22rem] sm:max-h-none">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl sm:rounded-3xl"
      >
        <span className="velora-glass-shimmer absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
      </span>

      <header className="relative mb-5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.08em] text-accent font-jetbrains">
            Published roles
          </p>
          <h2 className="mt-1 text-lg font-bold text-heading font-raleway">
            Jobs ready to explore
          </h2>
        </div>
        <Link
          href="/talent/jobs"
          className="shrink-0 text-[11px] uppercase tracking-[0.08em] text-accent transition-opacity hover:opacity-80 font-jetbrains"
        >
          See all
        </Link>
      </header>

      <div className="relative flex-1 space-y-2.5 overflow-y-auto scrollbar-none">
        {jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-edge bg-page-alt px-4 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <Briefcase className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-heading font-raleway">
                No published roles yet
              </p>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-body font-raleway">
                New company roles will appear here as soon as they go live.
              </p>
            </div>
          </div>
        ) : (
          jobs.map((job) => <JobCard key={job.id} job={job} />)
        )}
      </div>
    </section>
  );
}

function JobCard({ job }: { job: RecommendedJob }) {
  return (
    <Link
      href={job.href}
      className="group block rounded-2xl border border-edge bg-page-alt transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:bg-surface"
    >
      <article className="p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface text-accent">
            <Building2 className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="min-w-0 text-sm font-semibold text-heading font-raleway">
                {job.title}
              </p>
              {job.recommended && (
                <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-accent font-jetbrains">
                  <Star className="h-3 w-3" />
                  Curated
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-xs text-body font-raleway">
              {job.company} - {job.compensation}
            </p>
          </div>
          <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-subtle transition-all group-hover:translate-x-0.5 group-hover:text-accent" />
        </div>

        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-body font-raleway">
          {job.description}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-pill-bg px-2 py-0.5 text-[10px] font-medium text-pill-text font-raleway">
            {job.arrangement}
          </span>
          <span className="rounded-full bg-pill-bg px-2 py-0.5 text-[10px] font-medium text-pill-text font-raleway">
            {job.type}
          </span>
          {job.stack.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="rounded-full border border-edge bg-surface px-2 py-0.5 text-[10px] font-medium text-heading font-raleway"
            >
              {skill}
            </span>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-subtle font-jetbrains">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3 text-accent" />
            {job.location}
          </span>
          <span>{job.postedAgo}</span>
          <span className="ml-auto inline-flex items-center gap-1 text-accent">
            <Sparkles className="h-3 w-3" />
            {job.matchScore}%
          </span>
        </div>
      </article>
    </Link>
  );
}
