"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Sparkles, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTheme } from "@/components/providers/ThemeProvider";

/* ─── Animation ─── */
const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: EASE_OUT },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, delay: 0.2 + i * 0.08, ease: EASE_OUT },
  }),
};

/* ─── Decorative SVG shapes (inline, no external deps) ─── */
function ConcentricRings({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={cn("text-bright-green", className)} fill="none">
      <circle cx="60" cy="60" r="55" stroke="currentColor" opacity="0.15" strokeWidth="1.5" />
      <circle cx="60" cy="60" r="42" stroke="currentColor" opacity="0.2" strokeWidth="1.5" />
      <circle cx="60" cy="60" r="29" stroke="currentColor" opacity="0.3" strokeWidth="2" />
      <circle cx="60" cy="60" r="16" stroke="currentColor" opacity="0.5" strokeWidth="2" />
      <circle cx="60" cy="60" r="5" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

function WireframeGlobe({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={cn("text-bright-green", className)} fill="none">
      <circle cx="50" cy="50" r="45" stroke="currentColor" opacity="0.2" strokeWidth="1" />
      <ellipse cx="50" cy="50" rx="45" ry="20" stroke="currentColor" opacity="0.15" strokeWidth="1" />
      <ellipse cx="50" cy="50" rx="20" ry="45" stroke="currentColor" opacity="0.15" strokeWidth="1" />
      <ellipse cx="50" cy="50" rx="35" ry="45" stroke="currentColor" opacity="0.1" strokeWidth="1" />
      <line x1="5" y1="50" x2="95" y2="50" stroke="currentColor" opacity="0.1" strokeWidth="1" />
      <line x1="50" y1="5" x2="50" y2="95" stroke="currentColor" opacity="0.1" strokeWidth="1" />
      <circle cx="50" cy="50" r="3" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

function DotGrid({ className }: { className?: string }) {
  const dots = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      dots.push(
        <circle
          key={`${row}-${col}`}
          cx={12 + col * 20}
          cy={12 + row * 20}
          r="3"
          fill="currentColor"
          opacity={0.15 + (row + col) * 0.04}
        />
      );
    }
  }
  return (
    <svg viewBox="0 0 100 100" className={cn("text-bright-green", className)}>
      {dots}
    </svg>
  );
}

function WavyShape({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 60" className={cn("text-bright-green", className)} fill="none">
      <path
        d="M0 30 Q15 10 30 30 Q45 50 60 30 Q75 10 90 30 Q105 50 120 30"
        stroke="currentColor"
        opacity="0.3"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M0 40 Q15 20 30 40 Q45 60 60 40 Q75 20 90 40 Q105 60 120 40"
        stroke="currentColor"
        opacity="0.15"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ─── Bento card component ─── */
function BentoCard({
  children,
  className,
  index,
  variant = "dark",
  isLightTheme = false,
}: {
  children: React.ReactNode;
  className?: string;
  index: number;
  variant?: "dark" | "accent" | "light";
  isLightTheme?: boolean;
}) {
  const baseStyles = isLightTheme
    ? {
        dark: "border-mid-green/25 bg-mid-green/[0.16] backdrop-blur-xl shadow-[0_8px_22px_rgba(22,163,74,0.10)]",
        accent: "border-mid-green/30 bg-mid-green/[0.20] backdrop-blur-xl shadow-[0_10px_24px_rgba(22,163,74,0.12)]",
        light: "border-dark-green/[0.08] bg-warm-white/96 backdrop-blur-xl shadow-sm",
      }
    : {
        dark: "border-white/[0.08] bg-dark-green/70 backdrop-blur-xl",
        accent: "border-bright-green/20 bg-dark-green/60 backdrop-blur-xl",
        light: "border-dark-green/[0.08] bg-warm-white/90 backdrop-blur-xl shadow-sm",
      };

  return (
    <motion.div
      variants={scaleIn}
      custom={index}
      className={cn(
        "group relative overflow-hidden rounded-3xl border p-6 transition-all duration-500",
        baseStyles[variant],
        variant === "light" ? "hover:border-mid-green/30" : "hover:border-bright-green/25",
        className
      )}
    >
      {/* Top refraction line */}
      <div className={cn(
        "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent",
        variant === "light" ? "via-dark-green/[0.06]" : "via-white/[0.1]"
      )} />
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   WhyChooseUs — Bento grid, futuristic layout
   ═══════════════════════════════════════════════════ */
export default function WhyChooseUs() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });
  const prefersReduced = useReducedMotion();
  const { user, profile } = useAuth();
  const { theme, mounted: themeMounted } = useTheme();
  const isAuthed = !!user;
  const isLightTheme = themeMounted && theme === "light";

  const userRole = profile?.role;
  const dashboardHref =
    userRole === "company"
      ? "/company/dashboard"
      : userRole === "talent"
        ? "/talent/dashboard"
        : "/profile";

  const motionContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06 } },
  };

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-page py-24 sm:py-32 lg:py-40"
    >
      {/* ─── Background ─── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 30% 50%, var(--v-glow-soft) 0%, transparent 70%)",
        }}
      />

      {/* ─── Floating decorative pills ─── */}
      {!prefersReduced && (
        <>
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute right-[8%] top-[12%] hidden rounded-full border border-bright-green/20 bg-bright-green/[0.06] px-4 py-1.5 text-[11px] font-medium text-bright-green/60 backdrop-blur-md font-jetbrains lg:block"
          >
            #vetted
          </motion.div>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
            className="pointer-events-none absolute left-[5%] top-[25%] hidden rounded-full border border-beige/20 bg-beige/[0.08] px-3 py-1.5 text-[11px] font-medium text-beige/60 backdrop-blur-md font-jetbrains lg:block"
          >
            #top1%
          </motion.div>
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            className="pointer-events-none absolute bottom-[18%] right-[12%] hidden rounded-full border border-bright-green/15 bg-bright-green/[0.04] px-4 py-1.5 text-[11px] font-medium text-bright-green/50 backdrop-blur-md font-jetbrains lg:block"
          >
            #global
          </motion.div>
        </>
      )}

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        {/* ═══════════ TOP: Split layout ═══════════ */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={motionContainer}
          className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16"
        >
          {/* Left — Headline + CTA */}
          <div className="flex flex-col justify-center">
            <motion.div variants={fadeUp} custom={0} className="mb-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-pill-border bg-pill-bg px-4 py-1.5 text-[11px] uppercase tracking-widest text-pill-text font-jetbrains">
                Why Veloraa
              </span>
            </motion.div>

            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-4xl font-bold leading-[1.1] tracking-tight text-heading sm:text-5xl lg:text-[56px] font-raleway"
            >
              Hire the best,
              <br />
              <span className="text-accent font-libre italic">effortlessly.</span>
            </motion.h2>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="mt-6 max-w-md text-base leading-relaxed text-body sm:text-lg font-raleway"
            >
              From your first hire to scaling your dream team, Veloraa connects
              you with pre-vetted, world-class talent — faster than any recruiter.
            </motion.p>

            {/* CTA + Rating */}
            <motion.div variants={fadeUp} custom={3} className="mt-8 flex flex-wrap items-center gap-5">
              {isAuthed ? (
                <Link
                  href={dashboardHref}
                  className={cn(
                    "group relative inline-flex items-center gap-2 overflow-hidden rounded-full px-7 py-3.5 text-sm font-semibold transition-all duration-300 font-raleway",
                    "bg-bright-green text-dark-green",
                    "hover:shadow-[0_0_30px_rgba(74,222,128,0.25)]"
                  )}
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                  <Sparkles className="relative h-4 w-4" />
                  <span className="relative">Go to Dashboard</span>
                </Link>
              ) : (
                <Link
                  href="/sign-up"
                  className={cn(
                    "group relative inline-flex items-center gap-2 overflow-hidden rounded-full px-7 py-3.5 text-sm font-semibold transition-all duration-300 font-raleway",
                    "bg-bright-green text-dark-green",
                    "hover:shadow-[0_0_30px_rgba(74,222,128,0.25)]"
                  )}
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                  <span className="relative">Get Started Now</span>
                </Link>
              )}

              {/* Star rating */}
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-bright-green text-bright-green" />
                  ))}
                </div>
                <span className="text-sm font-semibold text-heading font-raleway">5.0</span>
                <span className="text-xs text-body font-raleway">from 80+ reviews</span>
              </div>
            </motion.div>
          </div>

          {/* Right — Bento grid */}
          <motion.div
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={motionContainer}
            className="grid grid-cols-2 gap-3 sm:gap-4"
          >
            {/* Stat: Countries — white glass, dark text */}
            <BentoCard index={0} variant="light" isLightTheme={isLightTheme} className="flex flex-col justify-between">
              <WireframeGlobe className="mb-2 h-12 w-12 text-mid-green opacity-90" />
              <div>
                <p className="text-3xl font-bold text-dark-green sm:text-4xl font-raleway">50+</p>
                <p className="mt-1 text-sm font-medium text-dark-green/60 font-raleway">Countries</p>
              </div>
            </BentoCard>

            {/* Stat: Acceptance rate — dark glass, white text */}
            <BentoCard
              index={1}
              variant="dark"
              isLightTheme={isLightTheme}
              className="flex flex-col justify-between"
            >
              <ConcentricRings className="mb-2 h-14 w-14" />
              <div>
                <p className={cn("text-3xl font-bold sm:text-4xl font-raleway", isLightTheme ? "text-dark-green" : "text-white")}>1%</p>
                <p className={cn("mt-1 text-sm font-medium font-raleway", isLightTheme ? "text-dark-green/70" : "text-warm-white/80")}>Acceptance Rate</p>
              </div>
            </BentoCard>

            {/* Visual: Active users — white glass, dark text */}
            <BentoCard index={2} variant="light" isLightTheme={isLightTheme} className="col-span-2 sm:col-span-1">
              <p className="mb-4 text-sm font-semibold text-dark-green/70 font-raleway">Talent Active</p>
              {/* Avatar stack */}
              <div className="mb-4 flex -space-x-2">
                {["JD", "AM", "SK", "LR", "TP"].map((initials, i) => (
                  <div
                    key={initials}
                    className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-warm-white bg-mid-green/15 text-[10px] font-bold text-dark-green font-raleway"
                    style={{ zIndex: 5 - i }}
                  >
                    {initials}
                  </div>
                ))}
                <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-warm-white bg-mid-green/20 text-mid-green">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
              </div>
              <DotGrid className="h-10 w-20 text-mid-green opacity-70" />
            </BentoCard>

            {/* Stat: Shortlist time — dark glass, white text */}
            <BentoCard
              index={3}
              variant="accent"
              isLightTheme={isLightTheme}
              className="hidden sm:flex sm:flex-col sm:justify-between"
            >
              <WavyShape className="mb-3 h-8 w-24" />
              <div>
                <p className={cn("text-3xl font-bold sm:text-4xl font-raleway", isLightTheme ? "text-dark-green" : "text-white")}>48h</p>
                <p className={cn("mt-1 text-sm font-medium font-raleway", isLightTheme ? "text-dark-green/70" : "text-warm-white/80")}>Avg. Shortlist</p>
              </div>
            </BentoCard>

            {/* Wide card: Graph / satisfaction — dark glass, white text */}
            <BentoCard index={4} variant="dark" isLightTheme={isLightTheme} className="col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className={cn("text-sm font-semibold font-raleway", isLightTheme ? "text-dark-green/85" : "text-warm-white/90")}>Client Satisfaction</p>
                  <p className={cn("mt-1 text-4xl font-bold font-raleway", isLightTheme ? "text-dark-green" : "text-white")}>97%</p>
                </div>
                {/* Mini chart line */}
                <svg viewBox="0 0 120 40" className="h-10 w-28 text-bright-green" fill="none">
                  <path
                    d="M0 35 L15 28 L30 30 L45 18 L60 22 L75 12 L90 8 L105 10 L120 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    opacity="0.9"
                  />
                  <path
                    d="M0 35 L15 28 L30 30 L45 18 L60 22 L75 12 L90 8 L105 10 L120 4 L120 40 L0 40 Z"
                    fill="currentColor"
                    opacity="0.1"
                  />
                </svg>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-bright-green/15 px-2.5 py-0.5 text-[11px] font-semibold text-bright-green font-jetbrains">
                  <ArrowUpRight className="h-3 w-3" /> +12%
                </span>
                <span className={cn("text-xs font-medium font-raleway", isLightTheme ? "text-dark-green/60" : "text-warm-white/60")}>vs last quarter</span>
              </div>
            </BentoCard>
          </motion.div>
        </motion.div>

        {/* ═══════════ BOTTOM: Feature cards row ═══════════ */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={motionContainer}
          className="mt-20 sm:mt-28"
        >
          {/* Section sub-header */}
          <motion.div variants={fadeUp} custom={0} className="mb-10 flex flex-col gap-3 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
            <h3 className="text-2xl font-bold text-heading sm:text-3xl font-raleway">
              What makes us <span className="text-accent font-libre italic">different</span>
            </h3>
            <p className="max-w-sm text-sm leading-relaxed text-body font-raleway">
              A premium marketplace built on trust, speed, and precision matching.
            </p>
          </motion.div>

          {/* Cards grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Card 1 — White glass, dark text */}
            <motion.div
              variants={scaleIn}
              custom={1}
              className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-dark-green/[0.08] bg-warm-white/90 p-7 shadow-sm backdrop-blur-xl transition-all duration-500 hover:border-mid-green/30 hover:shadow-md sm:p-8"
            >
              <div>
                <ConcentricRings className="mb-6 h-14 w-14 text-mid-green" />
                <h4 className="mb-2 text-xl font-semibold text-dark-green font-raleway">
                  Rigorous Vetting
                </h4>
                <p className="text-sm leading-relaxed text-dark-green/70 font-raleway">
                  Every candidate passes a multi-stage review. Only the top 1%
                  make it through — saving you months of screening.
                </p>
              </div>
              <div className="mt-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-dark-green/10 bg-beige transition-all duration-300 group-hover:border-mid-green/40 group-hover:bg-mid-green/10">
                  <ArrowUpRight className="h-4 w-4 text-dark-green/50 transition-colors group-hover:text-mid-green" />
                </div>
              </div>
            </motion.div>

            {/* Card 2 — White glass, dark text */}
            <motion.div
              variants={scaleIn}
              custom={2}
              className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-dark-green/[0.08] bg-warm-white/90 p-7 shadow-sm backdrop-blur-xl transition-all duration-500 hover:border-mid-green/30 hover:shadow-md sm:p-8"
            >
              <div>
                <WavyShape className="mb-6 h-10 w-28 text-mid-green" />
                <h4 className="mb-2 text-xl font-semibold text-dark-green font-raleway">
                  Lightning Fast
                </h4>
                <p className="text-sm leading-relaxed text-dark-green/70 font-raleway">
                  Get a curated shortlist of matched, pre-vetted talent
                  delivered in under 48 hours. No more endless searching.
                </p>
              </div>
              <div className="mt-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-dark-green/10 bg-beige transition-all duration-300 group-hover:border-mid-green/40 group-hover:bg-mid-green/10">
                  <ArrowUpRight className="h-4 w-4 text-dark-green/50 transition-colors group-hover:text-mid-green" />
                </div>
              </div>
            </motion.div>

            {/* Card 3 — Featured / highlighted with beige accent */}
            <motion.div
              variants={scaleIn}
              custom={3}
              className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-dark-green/[0.06] bg-beige p-7 shadow-sm backdrop-blur-xl transition-all duration-500 hover:border-mid-green/30 hover:shadow-md sm:col-span-2 sm:p-8 lg:col-span-1"
            >
              {/* Decorative rounded corner accent */}
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-mid-green/[0.06]" />

              <div className="relative">
                <DotGrid className="mb-6 h-14 w-14 text-mid-green" />
                <h4 className="mb-2 text-xl font-semibold text-dark-green font-raleway">
                  Culture-First AI
                </h4>
                <p className="text-sm leading-relaxed text-dark-green/70 font-raleway">
                  Our AI doesn&apos;t just match skills — it matches values, work
                  style, and growth trajectory for lasting hires.
                </p>
              </div>
              <div className="relative mt-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-mid-green transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(22,163,74,0.3)]">
                  <ArrowUpRight className="h-4 w-4 text-warm-white" />
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* ═══════════ BOTTOM CTA ═══════════ */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeUp}
          custom={6}
          className="mt-16 flex flex-col items-center gap-4 sm:mt-20 sm:flex-row sm:justify-center sm:gap-5"
        >
          {isAuthed ? (
            <>
              <Link
                href={dashboardHref}
                className={cn(
                  "group relative inline-flex items-center gap-2 overflow-hidden rounded-full px-7 py-3.5 text-sm font-semibold transition-all duration-300 font-raleway",
                  "bg-bright-green text-dark-green",
                  "hover:shadow-[0_0_30px_rgba(74,222,128,0.25)]"
                )}
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                <Sparkles className="relative h-4 w-4" />
                <span className="relative">Go to Dashboard</span>
                <ArrowRight className="relative h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/pricing"
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium transition-all duration-300 font-raleway",
                  "border border-edge text-body",
                  "hover:border-bright-green/25 hover:text-heading"
                )}
              >
                View Plans
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/sign-up"
                className={cn(
                  "group relative inline-flex items-center gap-2 overflow-hidden rounded-full px-7 py-3.5 text-sm font-semibold transition-all duration-300 font-raleway",
                  "bg-bright-green text-dark-green",
                  "hover:shadow-[0_0_30px_rgba(74,222,128,0.25)]"
                )}
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                <span className="relative">Get Started — It&apos;s Free</span>
                <ArrowRight className="relative h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/for-companies"
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium transition-all duration-300 font-raleway",
                  "border border-edge text-body",
                  "hover:border-bright-green/25 hover:text-heading"
                )}
              >
                Learn More
              </Link>
            </>
          )}
        </motion.div>
      </div>
    </section>
  );
}
