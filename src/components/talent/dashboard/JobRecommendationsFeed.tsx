"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, ChevronDown, ChevronUp, MapPin, Star, Briefcase, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RecommendedJob {
  id: string;
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
  locked?: boolean;
}

const PLACEHOLDER_JOBS: RecommendedJob[] = [
  {
    id: "r1",
    company: "Halcyon Labs",
    title: "Senior Backend Engineer · Payments",
    location: "Remote · EU",
    stack: ["TypeScript", "Postgres", "AWS"],
    compensation: "€110–140k",
    matchScore: 94,
    type: "Full-time",
    arrangement: "Remote",
    description: "Build and scale the payment infrastructure for a rapidly growing fintech.",
    postedAgo: "2h ago",
  },
  {
    id: "r2",
    company: "Meridian AI",
    title: "Staff ML Engineer · Evaluation",
    location: "London, UK · Hybrid",
    stack: ["Python", "PyTorch", "Ray"],
    compensation: "£140–180k",
    matchScore: 89,
    type: "Full-time",
    arrangement: "Hybrid",
    description: "Lead the model evaluation pipeline across production ML systems.",
    postedAgo: "5h ago",
  },
  {
    id: "r3",
    company: "Sable",
    title: "Full-stack Engineer · 0→1",
    location: "Berlin · On-site",
    stack: ["Next.js", "Supabase", "Tailwind"],
    compensation: "€95–120k",
    matchScore: 86,
    type: "Contract",
    arrangement: "On-site",
    description: "Greenfield product build from scratch with a small team.",
    postedAgo: "1d ago",
    locked: true,
  },
];

export default function JobRecommendationsFeed({
  jobs = PLACEHOLDER_JOBS,
}: {
  jobs?: RecommendedJob[];
}) {
  const [expandedId, setExpandedId] = useState<string | null>(jobs[0]?.id ?? null);

  return (
    <section className="relative flex flex-col overflow-hidden rounded-2xl border border-edge bg-surface p-4 transition-all duration-300 hover:border-accent/25 hover:shadow-[0_24px_60px_-42px_rgba(10,46,26,0.3)] sm:rounded-3xl sm:p-6 max-h-[22rem] sm:max-h-none">
      {/* Glass shimmer */}
      <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl sm:rounded-3xl">
        <span className="velora-glass-shimmer absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
      </span>

      <header className="relative mb-5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.08em] text-accent font-jetbrains">Top matches for you</p>
          <h2 className="mt-1 text-lg font-bold text-heading font-raleway">Recommended roles</h2>
        </div>
        <Link href="/talent/jobs" className="shrink-0 text-[11px] uppercase tracking-[0.08em] text-accent transition-opacity hover:opacity-80 font-jetbrains">
          See all
        </Link>
      </header>

      <div className="relative flex-1 space-y-2.5 overflow-y-auto scrollbar-none">
        {jobs.map((job) =>
          job.locked ? (
            <LockedJobRow key={job.id} job={job} />
          ) : (
            <JobRow
              key={job.id}
              job={job}
              expanded={expandedId === job.id}
              onToggle={() => setExpandedId(expandedId === job.id ? null : job.id)}
            />
          )
        )}
      </div>
    </section>
  );
}

function JobRow({ job, expanded, onToggle }: { job: RecommendedJob; expanded: boolean; onToggle: () => void }) {
  return (
    <article className="group rounded-2xl border border-edge bg-page-alt transition-all hover:border-accent/40">
      <button type="button" onClick={onToggle} className="flex w-full items-center gap-3 p-4 text-left sm:gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface text-accent">
          <Building2 className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-heading font-raleway">{job.title}</p>
            <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-accent font-jetbrains">
              <Star className="h-3 w-3" />{job.matchScore}%
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-body font-raleway">
            {job.company} · {job.compensation}
          </p>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 shrink-0 text-subtle" /> : <ChevronDown className="h-4 w-4 shrink-0 text-subtle" />}
      </button>

      {expanded && (
        <div className="border-t border-edge px-4 pb-4 pt-3">
          <div className="mb-3 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-pill-bg px-2 py-0.5 text-[10px] font-medium text-pill-text font-raleway">{job.arrangement}</span>
            <span className="rounded-full bg-pill-bg px-2 py-0.5 text-[10px] font-medium text-pill-text font-raleway">{job.type}</span>
          </div>
          <p className="text-xs leading-relaxed text-body font-raleway">{job.description}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {job.stack.map((s) => (
              <span key={s} className="rounded-full border border-edge bg-surface px-2 py-0.5 text-[10px] font-medium text-heading font-raleway">{s}</span>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3 text-[11px] text-subtle font-jetbrains">
            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>
            <span>·</span>
            <span>{job.postedAgo}</span>
          </div>
          <div className="mt-4 flex gap-2">
            <Link href="/talent/jobs" className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-[11px] font-semibold text-white transition-all hover:opacity-90 hover:shadow-[0_12px_30px_-18px_rgba(74,222,128,0.45)] font-raleway">
              <Briefcase className="h-3 w-3" /> View role
            </Link>
          </div>
        </div>
      )}
    </article>
  );
}

function LockedJobRow({ job }: { job: RecommendedJob }) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-dashed border-edge bg-page-alt p-4">
      <div className="pointer-events-none select-none blur-[3px]">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface text-accent">
            <Building2 className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-heading font-raleway">{job.title}</p>
            <p className="mt-0.5 truncate text-xs text-body font-raleway">{job.company} · {job.compensation}</p>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center gap-3 bg-surface/60 px-4 backdrop-blur-[2px]">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
          <Lock className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-heading font-raleway">Complete your profile to unlock</p>
          <p className="mt-0.5 text-[11px] text-body font-raleway">Add portfolio links and a resume.</p>
        </div>
      </div>
    </article>
  );
}
