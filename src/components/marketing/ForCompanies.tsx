"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  Shield,
  Users,
  ArrowRight,
  ArrowUpRight,
  ArrowLeft,
  X,
  Briefcase,
  Search,
  ClipboardCheck,
  Handshake,
  Zap,
} from "lucide-react";

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

const sectionVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_OUT } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
};

// --- Data ---

const steps = [
  {
    num: "01",
    icon: <Briefcase className="h-5 w-5" />,
    title: "Tell Us What You Need",
    description:
      "Define the role, stack, seniority, and culture fit. Our AI builds a candidate profile from your requirements in minutes.",
    duration: "10 min",
  },
  {
    num: "02",
    icon: <Search className="h-5 w-5" />,
    title: "AI-Matched Shortlist",
    description:
      "Our engine cross-references your needs against our vetted talent pool — skill depth, domain expertise, and working-style compatibility.",
    duration: "24–48 hrs",
  },
  {
    num: "03",
    icon: <ClipboardCheck className="h-5 w-5" />,
    title: "Review Curated Profiles",
    description:
      "Receive 3–5 pre-vetted profiles with AI scores, technical assessments, and interview highlights. No resume spam.",
    duration: "Your pace",
  },
  {
    num: "04",
    icon: <Handshake className="h-5 w-5" />,
    title: "Interview & Decide",
    description:
      "Meet candidates who already passed our vetting. Architecture discussions, not trivia. You focus on culture and vision fit.",
    duration: "1–2 rounds",
  },
  {
    num: "05",
    icon: <Zap className="h-5 w-5" />,
    title: "Make the Hire",
    description:
      "Extend the offer with confidence. Our placement guarantee means if it doesn't work out in 90 days, we re-source for free.",
    duration: "Done",
  },
];

const stats = [
  { value: "94%", label: "Interview-to-offer rate" },
  { value: "12 days", label: "Average time to hire" },
  { value: "Top 1%", label: "Pre-vetted talent only" },
  { value: "90-day", label: "Placement guarantee" },
];

const testimonials = [
  {
    quote:
      "We cut our hiring pipeline from 3 months to 12 days. The candidates Veloraa sent were already better than anyone we'd sourced ourselves.",
    name: "David L.",
    role: "VP Engineering",
    company: "Series C Fintech",
  },
  {
    quote:
      "No more wading through 500 applications. Veloraa gave us 4 profiles — we hired 2 of them. Both are still crushing it a year later.",
    name: "Maria S.",
    role: "Head of Talent",
    company: "Fortune 500 Enterprise",
  },
  {
    quote:
      "The AI matching understood our culture and technical bar better than any recruiter we've worked with. It felt like they already knew our team.",
    name: "Raj P.",
    role: "CTO",
    company: "AI Startup (Seed)",
  },
];

// --- Component ---

export default function ForCompanies() {
  const prefersReduced = useReducedMotion();
  const { user } = useAuth();
  const isAuthed = !!user;

  const motionSection = prefersReduced
    ? {}
    : {
        variants: sectionVariants,
        initial: "hidden" as const,
        whileInView: "visible" as const,
        viewport: { once: true, margin: "-80px" },
      };

  const motionStagger = prefersReduced
    ? {}
    : {
        variants: staggerContainer,
        initial: "hidden" as const,
        whileInView: "visible" as const,
        viewport: { once: true, margin: "-60px" },
      };

  return (
    <div className="bg-page transition-colors duration-300">
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden pb-16 pt-32 sm:pt-40">
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2">
          <div className="h-[500px] w-[700px] rounded-full bg-glow-soft blur-[140px]" />
        </div>

        <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-8">
          <motion.div {...motionSection}>
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-pill-border bg-pill-bg px-4 py-1.5 text-xs uppercase tracking-[0.08em] text-pill-text font-jetbrains">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
              For Ambitious Companies
            </span>

            <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-heading sm:text-5xl lg:text-[64px] font-raleway">
              Hire the <span className="text-accent">Top 1%.</span>
              <br />
              Skip the Noise.
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-body font-libre italic">
              Stop sorting through hundreds of unvetted resumes. Access
              pre-qualified, technically assessed engineers — ready to interview
              today.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href={isAuthed ? "/profile" : "/sign-up?role=company"}
                className="group inline-flex items-center justify-center rounded-lg bg-btn-bg px-8 py-3.5 text-sm font-semibold text-btn-fg transition-all hover:opacity-90 hover:shadow-lg font-raleway"
              >
                {isAuthed ? "Go to your dashboard" : "Start Hiring"}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-lg border border-ghost-border px-8 py-3.5 text-sm font-semibold text-ghost-text transition-all hover:opacity-80 font-raleway"
              >
                See How It Works
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== Benefits bento grid ===== */}
      <section className="px-6 pb-24 lg:px-8">
        <motion.div
          {...motionSection}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <span className="mb-3 inline-block text-xs uppercase tracking-[0.08em] text-accent font-jetbrains">
            Why Veloraa
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-heading sm:text-4xl font-raleway">
            Engineered for Hiring Excellence
          </h2>
        </motion.div>

        <motion.div
          className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-3"
          {...motionStagger}
        >
          {/* 1 — Pre-Vetted Talent: featured green-border card */}
          <motion.div
            variants={itemVariants}
            className="group relative overflow-hidden rounded-2xl border-[3px] border-accent bg-surface p-8 transition-shadow duration-300 hover:shadow-lg hover:shadow-glow-soft sm:p-10"
          >
            <div className="absolute right-5 top-5">
              <ArrowUpRight className="h-6 w-6 text-heading transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
            <div className="flex min-h-[200px] flex-col justify-end">
              <p className="mb-2 text-xs tracking-widest text-body font-jetbrains">
                —
              </p>
              <h3 className="text-[26px] font-bold leading-[1.15] text-heading font-raleway sm:text-3xl">
                Hire Pre-Vetted
                <br />
                Talent Now!
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-body font-raleway">
                Every candidate has passed a 4-stage vetting process. No
                guesswork, just proven engineers.
              </p>
            </div>
          </motion.div>

          {/* 2 — Speed stat card */}
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-2xl border border-edge bg-surface p-8 transition-shadow duration-300 hover:shadow-lg hover:shadow-glow-soft"
          >
            <div className="mb-5 h-2 w-3/4 rounded-full bg-heading" />
            <div className="flex items-baseline gap-1">
              <span className="text-lg text-heading font-raleway">↑</span>
              <span className="text-[56px] font-bold leading-none text-heading font-raleway">
                94%
              </span>
            </div>
            <p className="mt-5 text-base font-semibold leading-snug text-heading font-raleway">
              Interview-to-Offer
              <br />
              <span className="font-normal text-body">
                — Rate Across All Roles
              </span>
            </p>
            <div className="mt-6 inline-flex items-center rounded bg-heading px-4 py-2">
              <span className="text-sm font-semibold text-btn-fg font-raleway">
                _Veloraa
              </span>
            </div>
          </motion.div>

          {/* 3 — Brand promise card */}
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-2xl border border-edge bg-surface p-6 transition-shadow duration-300 hover:shadow-lg hover:shadow-glow-soft"
          >
            <div className="mb-5 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent">
                <Shield className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-heading font-raleway">
                Veloraa
              </span>
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent">
                <svg
                  className="h-2.5 w-2.5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </span>
            </div>
            <h3 className="text-xl font-bold leading-tight text-heading font-raleway sm:text-2xl">
              Quality is built in,
              <br />
              Not bolted on —
            </h3>
          </motion.div>

          {/* 4 — Scaling: arrow motif card */}
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-2xl border border-edge bg-surface p-8 transition-shadow duration-300 hover:shadow-lg hover:shadow-glow-soft"
          >
            <div className="mb-8 flex items-center gap-4">
              <span className="text-2xl text-accent">✱</span>
              <div className="h-px flex-1 bg-heading" />
              <ArrowRight className="h-5 w-5 text-heading" />
            </div>
            <h3 className="text-[26px] font-bold leading-[1.15] text-heading font-raleway sm:text-3xl">
              Scaling
              <br />
              Made Simple
              <br />
              For You
            </h3>
            <div className="mt-5 h-8 w-28 rounded bg-accent/20" />
          </motion.div>

          {/* 5 — Speed: tech-style card */}
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-2xl border border-edge bg-surface p-8 transition-shadow duration-300 hover:shadow-lg hover:shadow-glow-soft"
          >
            <div className="mb-4 flex items-center gap-3">
              <Zap className="h-5 w-5 text-body" />
              <span className="text-lg font-bold text-heading font-jetbrains">
                12d
              </span>
            </div>
            <div className="mb-3 inline-block rounded bg-heading px-3 py-1.5">
              <span className="text-sm font-bold text-btn-fg font-jetbrains">
                AVG.TIME
              </span>
            </div>
            <p className="mt-4 text-base font-semibold leading-snug text-heading font-raleway">
              From Brief to Hire
              <br />
              <span className="font-normal text-body">In Under Two Weeks —</span>
            </p>
          </motion.div>

          {/* 6 — Guarantee: visual card */}
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-2xl border border-edge bg-surface p-6 transition-shadow duration-300 hover:shadow-lg hover:shadow-glow-soft"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent">
                  <Shield className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-sm font-semibold text-heading font-raleway">
                  Veloraa
                </span>
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent">
                  <svg
                    className="h-2.5 w-2.5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </span>
              </div>
              <X className="h-4 w-4 text-body" />
            </div>

            <div className="relative my-3 flex items-center justify-center overflow-hidden rounded-xl bg-linear-to-br from-accent/5 to-accent/15">
              <div className="flex h-36 w-full items-center justify-center">
                <Users className="h-20 w-20 text-accent/20" />
              </div>
              <div className="absolute bottom-3 right-3 h-10 w-10 rounded-lg bg-heading" />
              <div className="absolute bottom-0 left-1/2 h-14 w-20 -translate-x-1/2 rounded-t-xl bg-accent/25" />
            </div>

            <div className="mt-4 flex items-center gap-2">
              <ArrowLeft className="h-4 w-4 text-heading" />
            </div>
            <p className="mt-2 text-lg font-bold text-heading font-raleway">
              #90dayguarantee
            </p>
            <p className="mt-1 text-xs leading-relaxed text-body font-raleway">
              If the hire doesn&apos;t work out within 90 days, we re-source at
              no extra cost.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* ===== How it works ===== */}
      <section
        id="how-it-works"
        className="relative overflow-hidden border-t border-edge bg-dark-green px-6 py-28 transition-colors duration-300 lg:px-8"
      >
        {/* Background decorative elements */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-20 h-[400px] w-[400px] rounded-full bg-bright-green/[0.03] blur-[120px]" />
          <div className="absolute bottom-10 right-1/4 h-[300px] w-[300px] rounded-full bg-beige/[0.03] blur-[100px]" />
        </div>

        <motion.div
          {...motionSection}
          className="relative mx-auto mb-20 max-w-3xl text-center"
        >
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-bright-green/20 bg-bright-green/[0.06] px-4 py-1.5 text-xs uppercase tracking-[0.08em] text-bright-green font-jetbrains">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bright-green opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-bright-green" />
            </span>
            The Process
          </span>
          <h2 className="mt-5 text-4xl font-bold tracking-tight text-warm-white sm:text-5xl font-raleway">
            From Brief to Hire
            <br />
            <span className="text-bright-green">in Five Steps</span>
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-beige/50 font-libre italic">
            We handle sourcing, vetting, and matching — you handle the final
            handshake.
          </p>
        </motion.div>

        {/* Bento grid */}
        <div className="relative mx-auto grid max-w-6xl gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* ── Step 01: Tell Us What You Need (wide card) ── */}
          <motion.div
            {...(prefersReduced ? {} : { variants: itemVariants, initial: "hidden", whileInView: "visible", viewport: { once: true, margin: "-40px" } })}
            className="group relative overflow-hidden rounded-3xl border border-beige/20 bg-gradient-to-br from-[#0a2e1a] via-[#112e1e] to-[#1a3d24] p-8 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(245,240,232,0.08)] md:col-span-2 lg:col-span-2"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-beige/30 to-transparent" />
            {/* Decorative: concentric rings */}
            <svg className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 text-beige/[0.07]" viewBox="0 0 200 200" fill="none">
              <circle cx="100" cy="100" r="90" stroke="currentColor" strokeWidth="1" />
              <circle cx="100" cy="100" r="65" stroke="currentColor" strokeWidth="1" />
              <circle cx="100" cy="100" r="40" stroke="currentColor" strokeWidth="1" />
              <circle cx="100" cy="100" r="15" fill="currentColor" />
            </svg>
            {/* Decorative: floating dots */}
            <div className="pointer-events-none absolute bottom-8 right-24">
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 12 }).map((_, j) => (
                  <div key={j} className="h-1.5 w-1.5 rounded-full bg-beige/10" />
                ))}
              </div>
            </div>

            <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-10">
              <div className="flex-1">
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-beige/25 bg-beige/10 text-beige">
                    {steps[0].icon}
                  </span>
                  <span className="rounded-full border border-beige/25 bg-beige/10 px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-beige/80 font-jetbrains">
                    {steps[0].duration}
                  </span>
                </div>
                <p className="mb-2 text-2xl font-extrabold uppercase tracking-wide text-beige/90 sm:text-3xl font-jetbrains">Step 01</p>
                <h3 className="mb-3 text-2xl font-bold text-warm-white font-raleway">{steps[0].title}</h3>
                <p className="max-w-md text-sm leading-relaxed text-beige/50 font-raleway">{steps[0].description}</p>
              </div>
              {/* Trail line */}
              <div className="hidden w-32 shrink-0 items-center sm:flex">
                <svg viewBox="0 0 120 60" className="h-16 w-full" fill="none">
                  <path d="M0 30 C 40 30, 50 10, 80 10 L 120 10" stroke="#B8B09A" strokeWidth="1.5" strokeDasharray="3 6" strokeLinecap="round" opacity="0.4" />
                  <path d="M0 30 C 40 30, 50 50, 80 50 L 120 50" stroke="#B8B09A" strokeWidth="1" strokeDasharray="2 5" strokeLinecap="round" opacity="0.2" />
                </svg>
                {!prefersReduced && (
                  <motion.div
                    className="absolute h-2 w-2 rounded-full bg-beige shadow-[0_0_12px_rgba(245,240,232,0.6)]"
                    animate={{ x: [0, 100], opacity: [0, 1, 1, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
              </div>
            </div>
          </motion.div>

          {/* ── Step 02: AI-Matched Shortlist (tall card) ── */}
          <motion.div
            {...(prefersReduced ? {} : { variants: itemVariants, initial: "hidden", whileInView: "visible", viewport: { once: true, margin: "-40px" } })}
            className="group relative overflow-hidden rounded-3xl border border-bright-green/20 bg-gradient-to-br from-[#071a0e] via-[#0d2818] to-[#133d24] p-8 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(74,222,128,0.10)] lg:row-span-2"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-bright-green/30 to-transparent" />
            {/* Decorative: wavy lines */}
            <svg className="pointer-events-none absolute -bottom-4 -left-4 h-32 w-32 text-bright-green/[0.07]" viewBox="0 0 120 120" fill="none">
              <path d="M10 20 Q 35 5, 60 20 T 110 20" stroke="currentColor" strokeWidth="2" />
              <path d="M10 40 Q 35 25, 60 40 T 110 40" stroke="currentColor" strokeWidth="2" />
              <path d="M10 60 Q 35 45, 60 60 T 110 60" stroke="currentColor" strokeWidth="2" />
              <path d="M10 80 Q 35 65, 60 80 T 110 80" stroke="currentColor" strokeWidth="2" />
            </svg>
            {/* Decorative: corner circle */}
            <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full border border-bright-green/10 bg-bright-green/[0.04]" />

            <div className="relative z-10 flex h-full flex-col">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-bright-green/25 bg-bright-green/10 text-bright-green">
                  {steps[1].icon}
                </span>
                <span className="rounded-full border border-bright-green/25 bg-bright-green/10 px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-bright-green/80 font-jetbrains">
                  {steps[1].duration}
                </span>
              </div>
              <p className="mb-2 text-2xl font-extrabold uppercase tracking-wide text-bright-green/80 sm:text-3xl font-jetbrains">Step 02</p>
              <h3 className="mb-3 text-2xl font-bold text-warm-white font-raleway">{steps[1].title}</h3>
              <p className="text-sm leading-relaxed text-beige/50 font-raleway">{steps[1].description}</p>

              {/* Animated illustration */}
              <div className="mt-auto pt-8">
                <div className="relative mx-auto h-28 w-full max-w-[200px]">
                  {/* Connecting nodes diagram */}
                  <svg viewBox="0 0 200 110" className="h-full w-full" fill="none">
                    <rect x="10" y="10" width="70" height="35" rx="10" stroke="#4ADE80" strokeWidth="1" opacity="0.3" />
                    <text x="45" y="32" textAnchor="middle" fill="#4ADE80" fontSize="9" opacity="0.6">Your Brief</text>
                    <rect x="120" y="10" width="70" height="35" rx="10" stroke="#4ADE80" strokeWidth="1" opacity="0.3" />
                    <text x="155" y="32" textAnchor="middle" fill="#4ADE80" fontSize="9" opacity="0.6">AI Engine</text>
                    <rect x="65" y="65" width="70" height="35" rx="10" stroke="#4ADE80" strokeWidth="1" fill="#4ADE80" fillOpacity="0.08" />
                    <text x="100" y="87" textAnchor="middle" fill="#4ADE80" fontSize="9" opacity="0.8">Matches</text>
                    <path d="M80 45 L85 65" stroke="#4ADE80" strokeWidth="1" strokeDasharray="3 4" opacity="0.4" />
                    <path d="M120 45 L115 65" stroke="#4ADE80" strokeWidth="1" strokeDasharray="3 4" opacity="0.4" />
                    <path d="M80 27 L120 27" stroke="#4ADE80" strokeWidth="1" strokeDasharray="3 4" opacity="0.3" />
                  </svg>
                  {!prefersReduced && (
                    <motion.div
                      className="absolute h-2 w-2 rounded-full bg-bright-green shadow-[0_0_10px_rgba(74,222,128,0.8)]"
                      animate={{ x: [45, 155, 100], y: [27, 27, 82] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Step 03: Review Curated Profiles ── */}
          <motion.div
            {...(prefersReduced ? {} : { variants: itemVariants, initial: "hidden", whileInView: "visible", viewport: { once: true, margin: "-40px" } })}
            className="group relative overflow-hidden rounded-3xl border border-warm-white/15 bg-gradient-to-br from-[#0f2318] via-[#162e20] to-[#1e3b28] p-7 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(250,250,248,0.06)]"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-warm-white/20 to-transparent" />
            {/* Decorative: stacked cards shape */}
            <svg className="pointer-events-none absolute -right-4 top-4 h-20 w-20 text-warm-white/[0.08]" viewBox="0 0 80 80" fill="none">
              <rect x="15" y="5" width="40" height="50" rx="8" stroke="currentColor" strokeWidth="1.5" />
              <rect x="25" y="15" width="40" height="50" rx="8" stroke="currentColor" strokeWidth="1.5" />
              <rect x="35" y="25" width="40" height="50" rx="8" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.5" />
            </svg>

            <div className="relative z-10">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-warm-white/20 bg-warm-white/10 text-warm-white">
                  {steps[2].icon}
                </span>
                <span className="rounded-full border border-warm-white/20 bg-warm-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-warm-white/70 font-jetbrains">
                  {steps[2].duration}
                </span>
              </div>
              <p className="mb-2 text-2xl font-extrabold uppercase tracking-wide text-warm-white/80 sm:text-3xl font-jetbrains">Step 03</p>
              <h3 className="mb-3 text-xl font-bold text-warm-white font-raleway">{steps[2].title}</h3>
              <p className="text-sm leading-relaxed text-beige/50 font-raleway">{steps[2].description}</p>
            </div>
          </motion.div>

          {/* ── Step 04: Interview & Decide ── */}
          <motion.div
            {...(prefersReduced ? {} : { variants: itemVariants, initial: "hidden", whileInView: "visible", viewport: { once: true, margin: "-40px" } })}
            className="group relative overflow-hidden rounded-3xl border border-muted-beige/20 bg-gradient-to-br from-[#0e2416] via-[#15301e] to-[#1c3c28] p-7 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(184,176,154,0.08)]"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-muted-beige/25 to-transparent" />
            {/* Decorative: star burst */}
            <svg className="pointer-events-none absolute -bottom-6 -right-6 h-28 w-28 text-muted-beige/[0.08]" viewBox="0 0 100 100" fill="none">
              <line x1="50" y1="10" x2="50" y2="90" stroke="currentColor" strokeWidth="1" />
              <line x1="10" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="1" />
              <line x1="22" y1="22" x2="78" y2="78" stroke="currentColor" strokeWidth="1" />
              <line x1="78" y1="22" x2="22" y2="78" stroke="currentColor" strokeWidth="1" />
              <circle cx="50" cy="50" r="8" fill="currentColor" />
            </svg>

            <div className="relative z-10">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-muted-beige/25 bg-muted-beige/10 text-muted-beige">
                  {steps[3].icon}
                </span>
                <span className="rounded-full border border-muted-beige/25 bg-muted-beige/10 px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-muted-beige/80 font-jetbrains">
                  {steps[3].duration}
                </span>
              </div>
              <p className="mb-2 text-2xl font-extrabold uppercase tracking-wide text-muted-beige/80 sm:text-3xl font-jetbrains">Step 04</p>
              <h3 className="mb-3 text-xl font-bold text-warm-white font-raleway">{steps[3].title}</h3>
              <p className="text-sm leading-relaxed text-beige/50 font-raleway">{steps[3].description}</p>
            </div>
          </motion.div>

          {/* ── Step 05: Make the Hire (wide card) ── */}
          <motion.div
            {...(prefersReduced ? {} : { variants: itemVariants, initial: "hidden", whileInView: "visible", viewport: { once: true, margin: "-40px" } })}
            className="group relative overflow-hidden rounded-3xl border border-bright-green/25 bg-gradient-to-br from-[#0a2e1a] via-[#133d26] to-[#1a5434] p-8 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(74,222,128,0.15)] md:col-span-2 lg:col-span-2"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-bright-green/40 to-transparent" />
            {/* Decorative: checkmark celebration */}
            <svg className="pointer-events-none absolute -right-8 -top-8 h-44 w-44 text-bright-green/[0.06]" viewBox="0 0 200 200" fill="none">
              <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="2" />
              <path d="M65 100 L90 125 L140 75" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="pointer-events-none absolute bottom-6 left-6">
              <div className="grid grid-cols-5 gap-1.5">
                {Array.from({ length: 15 }).map((_, j) => (
                  <div key={j} className="h-1 w-1 rounded-full bg-bright-green/10" />
                ))}
              </div>
            </div>

            <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-bright-green/30 bg-bright-green/15 text-bright-green">
                    {steps[4].icon}
                  </span>
                  <span className="rounded-full border border-bright-green/30 bg-bright-green/10 px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-bright-green/80 font-jetbrains">
                    {steps[4].duration}
                  </span>
                </div>
                <p className="mb-2 text-2xl font-extrabold uppercase tracking-wide text-bright-green/80 sm:text-3xl font-jetbrains">Step 05</p>
                <h3 className="mb-3 text-2xl font-bold text-warm-white font-raleway">{steps[4].title}</h3>
                <p className="max-w-md text-sm leading-relaxed text-beige/50 font-raleway">{steps[4].description}</p>
              </div>

              {/* Animated arrow CTA */}
              {!prefersReduced && (
                <motion.div
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-bright-green/20 bg-bright-green/10"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ArrowRight className="h-7 w-7 text-bright-green" />
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Connecting trail between all cards */}
        {!prefersReduced && (
          <div className="pointer-events-none absolute inset-0 hidden lg:block">
            <svg className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M 50% 35% Q 55% 50%, 70% 55%"
                stroke="url(#trailGrad)"
                strokeWidth="1"
                strokeDasharray="4 8"
                opacity="0.3"
              />
              <defs>
                <linearGradient id="trailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F5F0E8" />
                  <stop offset="50%" stopColor="#B8B09A" />
                  <stop offset="100%" stopColor="#4ADE80" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        )}
      </section>

      {/* ===== Stats ===== */}
      <section className="px-6 py-24 lg:px-8">
        <motion.div
          className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-2 lg:grid-cols-4"
          {...motionStagger}
        >
          {stats.map((s) => (
            <motion.div
              key={s.label}
              variants={itemVariants}
              className="text-center"
            >
              <p className="text-4xl font-bold text-accent sm:text-5xl font-raleway">
                {s.value}
              </p>
              <p className="mt-2 text-sm text-body font-raleway">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===== Testimonials ===== */}
      <section className="border-t border-edge bg-page-alt px-6 py-24 transition-colors duration-300 lg:px-8">
        <motion.div
          {...motionSection}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <span className="mb-3 inline-block text-xs uppercase tracking-[0.08em] text-accent font-jetbrains">
            From Hiring Teams
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-heading sm:text-4xl font-raleway">
            Companies That Made the Switch
          </h2>
        </motion.div>

        <motion.div
          className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3"
          {...motionStagger}
        >
          {testimonials.map((t) => (
            <motion.div
              key={t.name}
              variants={itemVariants}
              className="flex flex-col rounded-2xl border border-edge bg-surface p-8 transition-colors duration-300"
            >
              <p className="flex-1 text-sm leading-relaxed text-body font-libre italic">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-6 border-t border-edge pt-4">
                <p className="text-sm font-semibold text-heading font-raleway">
                  {t.name}
                </p>
                <p className="text-xs text-body font-raleway">{t.role}</p>
                <p className="mt-0.5 text-[11px] text-accent font-jetbrains">
                  {t.company}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===== Final CTA — always dark ===== */}
      <section className="relative overflow-hidden bg-dark-green px-6 py-24 lg:px-8">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[300px] w-[500px] rounded-full bg-bright-green/5 blur-[100px]" />
        </div>
        <motion.div
          className="relative mx-auto max-w-2xl text-center"
          {...motionSection}
        >
          <h2 className="text-3xl font-bold tracking-tight text-beige sm:text-4xl font-raleway">
            Ready to hire the{" "}
            <span className="text-bright-green">top 1%</span>?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-beige/60 font-libre italic">
            One brief. Pre-vetted candidates. Your next great engineer — in
            under two weeks.
          </p>
          <div className="mt-8">
            <Link
              href={isAuthed ? "/profile" : "/sign-up?role=company"}
              className="group inline-flex items-center justify-center rounded-lg bg-bright-green px-10 py-4 text-sm font-semibold text-dark-surface transition-all hover:shadow-[0_0_30px_rgba(74,222,128,0.3)] font-raleway"
            >
              {isAuthed ? "Go to your dashboard" : "Start Hiring"}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
