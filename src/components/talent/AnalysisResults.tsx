"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import type { TalentAiAnalysis } from "@/lib/types/db";

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

const DIMENSION_LABELS: { key: keyof NonNullable<TalentAiAnalysis["dimensions"]>; label: string }[] = [
  { key: "domain_expertise", label: "Domain expertise" },
  { key: "depth", label: "Technical depth" },
  { key: "breadth", label: "Technical breadth" },
  { key: "leadership", label: "Leadership signals" },
  { key: "communication", label: "Communication" },
];

export default function AnalysisResults({
  analysis,
}: {
  analysis: TalentAiAnalysis;
}) {
  const score = analysis.overall_score ?? 0;
  const tone = toneForScore(score);
  const dimensions = analysis.dimensions ?? {};
  const skills = (analysis.skill_scores ?? []).slice(0, 10);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT }}
        className="text-center"
      >
        <span className="mb-3 inline-block text-xs uppercase tracking-[0.08em] text-accent font-jetbrains">
          Stage 2 · Your AI analysis
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-heading sm:text-4xl lg:text-5xl font-raleway">
          Here&apos;s how you <span className="text-accent">stack up</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-body font-libre italic">
          Graded against thousands of senior engineers. Full breakdown below.
        </p>
      </motion.header>

      {/* Top row — overall score + summary + expertise */}
      <div className="grid gap-4 lg:grid-cols-5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05, ease: EASE_OUT }}
          className="relative overflow-hidden rounded-2xl border-[3px] border-accent bg-surface p-8 lg:col-span-2"
        >
          <div className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-pill-bg px-3 py-1 text-[11px] uppercase tracking-[0.08em] text-accent font-jetbrains">
            <Sparkles className="h-3 w-3" />
            Overall
          </div>
          <p className="mb-2 text-xs uppercase tracking-[0.08em] text-subtle font-jetbrains">
            {tone.label}
          </p>
          <ScoreDial value={score} />
          <div className="mt-6 flex items-end gap-2">
            <p className="text-sm font-semibold text-heading font-raleway">
              {analysis.expertise_level ?? "—"}
            </p>
            <p className="mb-0.5 text-[11px] text-subtle font-jetbrains">
              — current level
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: EASE_OUT }}
          className="rounded-2xl border border-edge bg-surface p-8 lg:col-span-3"
        >
          <p className="mb-2 text-xs uppercase tracking-[0.08em] text-subtle font-jetbrains">
            Summary
          </p>
          <p className="text-base leading-relaxed text-heading font-raleway">
            {analysis.summary ?? "No summary."}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <RecommendationBadge rec={analysis.recommendation} />
            {analysis.model && (
              <span className="rounded-full border border-edge px-3 py-1 text-[10px] uppercase tracking-[0.08em] text-subtle font-jetbrains">
                Model · {analysis.model}
              </span>
            )}
          </div>
        </motion.div>
      </div>

      {/* Dimensions — radar-esque bar group */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: EASE_OUT }}
        className="rounded-2xl border border-edge bg-surface p-6 sm:p-8"
      >
        <div className="mb-6 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-heading font-jetbrains">
            Dimension breakdown
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {DIMENSION_LABELS.map((d, i) => {
            const value = Number(dimensions[d.key] ?? 0);
            return (
              <div key={d.key}>
                <div className="mb-2 flex items-end justify-between">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-body font-jetbrains">
                    {d.label}
                  </p>
                  <p className="text-xl font-bold text-heading font-raleway">
                    {value}
                  </p>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-edge">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                    transition={{
                      duration: 0.9,
                      delay: 0.2 + i * 0.08,
                      ease: EASE_OUT,
                    }}
                    className={`absolute inset-y-0 left-0 rounded-full ${toneForScore(value).bar}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* Skills grid */}
      {skills.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: EASE_OUT }}
          className="rounded-2xl border border-edge bg-surface p-6 sm:p-8"
        >
          <div className="mb-6 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-heading font-jetbrains">
              Skill scores
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {skills.map((s, i) => (
              <div
                key={`${s.skill}-${i}`}
                className="rounded-xl border border-edge bg-page-alt p-4"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-heading font-raleway">
                    {s.skill}
                  </p>
                  <span className="rounded-full bg-surface px-2.5 py-0.5 text-[11px] font-bold text-heading font-jetbrains">
                    {s.score}
                  </span>
                </div>
                <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-edge">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, Math.max(0, s.score))}%` }}
                    transition={{
                      duration: 0.8,
                      delay: 0.3 + i * 0.04,
                      ease: EASE_OUT,
                    }}
                    className={`absolute inset-y-0 left-0 ${toneForScore(s.score).bar}`}
                  />
                </div>
                {s.evidence && (
                  <p className="mt-2 text-xs leading-relaxed text-body font-raleway">
                    “{s.evidence}”
                  </p>
                )}
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Strengths + concerns */}
      <div className="grid gap-4 lg:grid-cols-2">
        {analysis.strengths?.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25, ease: EASE_OUT }}
            className="rounded-2xl border border-edge bg-surface p-6 sm:p-8"
          >
            <div className="mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-heading font-jetbrains">
                Strengths
              </h2>
            </div>
            <ul className="space-y-3">
              {analysis.strengths.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-sm leading-relaxed text-body font-raleway"
                >
                  <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </motion.section>
        )}

        {analysis.concerns?.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3, ease: EASE_OUT }}
            className="rounded-2xl border border-edge bg-surface p-6 sm:p-8"
          >
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-heading font-jetbrains">
                Things to watch
              </h2>
            </div>
            <ul className="space-y-3">
              {analysis.concerns.map((c, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-sm leading-relaxed text-body font-raleway"
                >
                  <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </motion.section>
        )}
      </div>

      {/* Under review footer */}
      <motion.footer
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35, ease: EASE_OUT }}
        className="relative overflow-hidden rounded-2xl border-[3px] border-accent bg-linear-to-br from-accent/10 via-surface to-surface p-8 sm:p-10"
      >
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-[11px] uppercase tracking-[0.08em] text-accent font-jetbrains">
              <Clock className="h-3 w-3" />
              Under review
            </div>
            <h3 className="text-2xl font-bold text-heading sm:text-3xl font-raleway">
              We&apos;ve received your application.
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-body font-raleway">
              Our team will review this alongside your portfolio and get back to
              you within <span className="font-semibold text-heading">24 hours</span>.
              If you advance, the next step is a lightweight technical
              assessment tailored to your expertise — usually 45-60 minutes.
            </p>
          </div>
          <Link
            href="/talent/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-btn-bg px-6 py-3 text-sm font-semibold text-btn-fg transition-all hover:opacity-90 hover:shadow-lg font-raleway"
          >
            Go to dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.footer>
    </div>
  );
}

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

function toneForScore(score: number): {
  label: string;
  text: string;
  bar: string;
} {
  if (score >= 85)
    return { label: "Exceptional", text: "text-accent", bar: "bg-accent" };
  if (score >= 70)
    return { label: "Strong", text: "text-accent", bar: "bg-accent" };
  if (score >= 55)
    return { label: "Promising", text: "text-amber-500", bar: "bg-amber-500" };
  return { label: "Developing", text: "text-amber-600", bar: "bg-amber-500" };
}

function RecommendationBadge({
  rec,
}: {
  rec: TalentAiAnalysis["recommendation"];
}) {
  if (!rec) return null;
  const map = {
    advance: {
      label: "Recommended to advance",
      className: "bg-accent/10 text-accent border-accent/30",
    },
    hold: {
      label: "On hold",
      className: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    },
    decline: {
      label: "Not a match right now",
      className: "bg-red-500/10 text-red-500 border-red-500/30",
    },
  } as const;
  const cfg = map[rec];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.08em] font-jetbrains ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------
// Score dial — big number with a circular progress ring.
// ---------------------------------------------------------------------

function ScoreDial({ value }: { value: number }) {
  const clamped = Math.min(100, Math.max(0, value));
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;
  const tone = toneForScore(value);
  const stroke =
    tone.bar === "bg-accent"
      ? "var(--v-accent, #16A34A)"
      : tone.bar === "bg-amber-500"
      ? "#F59E0B"
      : "#DC2626";

  return (
    <div className="relative flex h-40 w-40 items-center justify-center">
      <svg
        className="absolute inset-0 -rotate-90"
        viewBox="0 0 140 140"
        aria-hidden="true"
      >
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="var(--color-edge, #E4E4E7)"
          strokeWidth={8}
        />
        <motion.circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - dash }}
          transition={{ duration: 1, ease: EASE_OUT }}
        />
      </svg>
      <div className="flex flex-col items-center">
        <p className="text-5xl font-bold leading-none text-heading font-raleway">
          {clamped}
        </p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-subtle font-jetbrains">
          / 100
        </p>
      </div>
    </div>
  );
}
