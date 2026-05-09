"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  CheckCircle,
  ClipboardCheck,
  Handshake,
  Search,
  Shield,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

const sectionVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_OUT } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.52, ease: EASE_OUT } },
};

const stats = [
  { value: "2", label: "Founders building the platform" },
  { value: "1%", label: "Talent bar we are designed around" },
  { value: "48h", label: "Target shortlist velocity" },
  { value: "50+", label: "Countries in our talent vision" },
];

const storyMilestones = [
  {
    icon: <Search className="h-5 w-5" />,
    title: "The problem was obvious",
    body: "Great companies were drowning in weak applications, while exceptional builders were stuck proving themselves in noisy, generic pipelines.",
  },
  {
    icon: <ClipboardCheck className="h-5 w-5" />,
    title: "We rebuilt the signal",
    body: "Veloraa combines structured vetting, AI-assisted profile intelligence, and human review so the best people are easier to trust.",
  },
  {
    icon: <Handshake className="h-5 w-5" />,
    title: "Now we match for fit",
    body: "The goal is not more resumes. It is sharper matches between skilled technical talent and teams serious enough to deserve them.",
  },
];

const principles = [
  {
    icon: <Shield className="h-5 w-5" />,
    title: "Quality before volume",
    body: "We would rather send three excellent profiles than flood a hiring team with a hundred maybes.",
  },
  {
    icon: <Target className="h-5 w-5" />,
    title: "Precision over guesswork",
    body: "Skill depth, role context, career goals, and working style all matter before a match reaches either side.",
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: "Technology with taste",
    body: "AI speeds up the work, but the final standard stays human, practical, and anchored in real hiring outcomes.",
  },
];

const founders = [
  {
    name: "Product Founder",
    role: "Founder - Product, AI and platform strategy",
    initials: "PF",
    focus: "Builds the intelligence layer behind vetting, matching, and trusted hiring workflows.",
    highlights: ["Product systems", "AI matching", "Platform craft"],
  },
  {
    name: "Talent Founder",
    role: "Founder - Talent, partnerships and marketplace growth",
    initials: "TF",
    focus: "Shapes the human side of Veloraa: community standards, company relationships, and candidate trust.",
    highlights: ["Talent quality", "Company success", "Marketplace trust"],
  },
];

const platformSteps = [
  {
    num: "01",
    icon: <Briefcase className="h-5 w-5" />,
    title: "Understand the brief",
    body: "We learn what the company truly needs: technical bar, team shape, operating style, and role expectations.",
  },
  {
    num: "02",
    icon: <Users className="h-5 w-5" />,
    title: "Evaluate the person",
    body: "Talent is reviewed for real execution ability, communication, judgment, and career alignment.",
  },
  {
    num: "03",
    icon: <Zap className="h-5 w-5" />,
    title: "Create the match",
    body: "Our matching layer turns both sides into a curated shortlist instead of an endless search.",
  },
  {
    num: "04",
    icon: <CheckCircle className="h-5 w-5" />,
    title: "Protect the outcome",
    body: "We keep the process tight, transparent, and accountable from first conversation to accepted offer.",
  },
];

function FlowArrow({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 90"
      className={cn("text-accent", className)}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M10 64 C56 18, 114 18, 162 46 C178 55, 190 59, 210 54"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="5 8"
        opacity="0.45"
      />
      <path
        d="M196 42 L212 54 L194 64"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.75"
      />
    </svg>
  );
}

function LiquidMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 180 180"
      className={cn("text-bright-green", className)}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M92 10 C128 11 164 36 168 75 C172 116 138 161 96 169 C56 176 20 148 13 108 C6 68 45 9 92 10Z"
        fill="currentColor"
        opacity="0.1"
      />
      <path
        d="M92 23 C122 24 151 45 154 77 C157 111 130 148 95 154 C61 160 31 136 25 105 C19 73 53 22 92 23Z"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.28"
      />
      <path
        d="M59 83 C77 63 101 60 122 76 C104 79 92 91 85 112 C78 98 70 89 59 83Z"
        fill="currentColor"
        opacity="0.38"
      />
    </svg>
  );
}

function SignalGrid({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={cn("text-accent", className)} aria-hidden="true">
      {Array.from({ length: 36 }).map((_, i) => {
        const row = Math.floor(i / 6);
        const col = i % 6;
        const opacity = 0.12 + ((row + col) % 4) * 0.08;

        return (
          <rect
            key={i}
            x={10 + col * 18}
            y={10 + row * 18}
            width="5"
            height="5"
            rx="2.5"
            fill="currentColor"
            opacity={opacity}
          />
        );
      })}
    </svg>
  );
}

function FounderPortrait({
  initials,
  index,
  prefersReduced,
}: {
  initials: string;
  index: number;
  prefersReduced: boolean | null;
}) {
  return (
    <div className="relative flex h-44 items-end justify-center overflow-hidden rounded-[28px] border border-dark-green/10 bg-gradient-to-br from-beige via-warm-white to-beige/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-bright-green/15 dark:from-dark-green dark:via-card-surface dark:to-dark-surface">
      <LiquidMark className="absolute -right-10 -top-12 h-36 w-36 opacity-80" />
      <SignalGrid className="absolute bottom-3 left-3 h-20 w-20 opacity-60" />
      <motion.div
        className={cn(
          "relative mb-6 flex h-24 w-24 items-center justify-center rounded-full border text-2xl font-bold font-raleway",
          index === 0
            ? "border-mid-green/30 bg-mid-green/15 text-dark-green dark:text-bright-green"
            : "border-dark-green/15 bg-dark-green/10 text-dark-green dark:border-bright-green/20 dark:bg-bright-green/10 dark:text-bright-green"
        )}
        animate={prefersReduced ? {} : { y: [0, -5, 0] }}
        transition={{ duration: 4 + index * 0.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="absolute inset-2 rounded-full border border-white/50 dark:border-white/10" />
        {initials}
      </motion.div>
    </div>
  );
}

function HeroVisual({ prefersReduced }: { prefersReduced: boolean | null }) {
  return (
    <div className="relative min-h-[460px] lg:min-h-[560px]">
      <div className="absolute inset-0 rounded-[2rem] border border-edge bg-surface/70 shadow-[0_30px_80px_rgba(10,46,26,0.10)] backdrop-blur-2xl dark:bg-card-surface/60" />
      <div className="absolute inset-x-5 top-5 flex gap-3 overflow-hidden sm:inset-x-8 sm:top-8">
        {["VET", "MATCH", "HIRE", "GROW"].map((label, i) => (
          <motion.div
            key={label}
            className="flex h-28 min-w-[116px] flex-1 flex-col justify-between overflow-hidden rounded-2xl border border-edge bg-warm-white/80 p-4 shadow-sm backdrop-blur-xl dark:border-bright-green/10 dark:bg-white/[0.04]"
            animate={prefersReduced ? {} : { y: [0, i % 2 === 0 ? -8 : 8, 0] }}
            transition={{ duration: 5 + i * 0.45, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-[10px] font-semibold tracking-[0.14em] text-accent font-jetbrains">
              {label}
            </span>
            <div className="space-y-1.5">
              <div className="h-2 w-full rounded-full bg-dark-green/10 dark:bg-white/12" />
              <div className="h-2 w-2/3 rounded-full bg-accent/25" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-heading/45 dark:text-bright-green/70" />
          </motion.div>
        ))}
      </div>

      <div className="absolute bottom-8 left-5 right-5 rounded-[28px] border border-dark-green/10 bg-dark-green p-5 text-warm-white shadow-[0_24px_70px_rgba(6,21,9,0.28)] sm:left-8 sm:right-8 sm:p-7">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-bright-green/35 to-transparent" />
        <div className="grid gap-5 sm:grid-cols-[0.9fr_1.1fr] sm:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-bright-green/20 bg-bright-green/[0.06] px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-bright-green font-jetbrains">
              <Sparkles className="h-3 w-3" />
              Veloraa signal
            </span>
            <p className="mt-4 text-3xl font-bold tracking-tight font-raleway">Human first.</p>
            <p className="text-3xl font-bold tracking-tight text-bright-green font-raleway">
              AI precise.
            </p>
          </div>

          <div className="relative min-h-36 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <FlowArrow className="absolute -right-2 top-3 h-28 w-48" />
            <div className="relative z-10 grid grid-cols-2 gap-3">
              {["Vetted talent", "Curated companies", "Clear profiles", "Better fit"].map(
                (item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2"
                  >
                    <p className="text-xs font-medium text-beige/80 font-raleway">{item}</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-3 right-10 hidden h-20 w-20 rotate-12 rounded-3xl border border-accent/25 bg-accent/15 backdrop-blur-xl lg:block" />
      <div className="absolute -left-4 top-48 hidden h-16 w-16 -rotate-12 rounded-2xl border border-dark-green/10 bg-beige/80 backdrop-blur-xl dark:border-bright-green/15 dark:bg-white/[0.05] sm:block" />
    </div>
  );
}

export default function About() {
  const prefersReduced = useReducedMotion();

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
      <section className="relative overflow-hidden pb-20 pt-32 sm:pt-40 lg:pb-28">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 70% 22%, var(--v-glow-soft) 0%, transparent 68%)",
          }}
        />
        <div className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:px-8">
          <motion.div {...motionSection}>
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-pill-border bg-pill-bg px-4 py-1.5 text-xs uppercase tracking-[0.08em] text-pill-text font-jetbrains">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
              About Veloraa
            </span>

            <h1 className="mt-5 text-4xl font-bold leading-[1.06] tracking-tight text-heading sm:text-5xl lg:text-[70px] font-raleway">
              We are building the hiring layer for the{" "}
              <span className="text-accent">top 1%.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-body font-libre italic">
              Veloraa exists for the people who take craft seriously: the
              engineers, designers, product leaders, and companies who want a
              sharper way to find each other.
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Link
                href="#founders"
                className="group inline-flex items-center justify-center rounded-lg bg-btn-bg px-7 py-3.5 text-sm font-semibold text-btn-fg transition-all hover:opacity-90 hover:shadow-lg font-raleway"
              >
                Meet the founders
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/for-companies"
                className="inline-flex items-center justify-center rounded-lg border border-ghost-border px-7 py-3.5 text-sm font-semibold text-ghost-text transition-all hover:opacity-80 font-raleway"
              >
                See how hiring works
              </Link>
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-2 gap-4 sm:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="border-l border-edge pl-4">
                  <p className="text-2xl font-bold text-heading font-raleway">{stat.value}</p>
                  <p className="mt-1 text-xs leading-snug text-body font-raleway">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            {...(prefersReduced
              ? {}
              : {
                  initial: { opacity: 0, y: 30, scale: 0.96 },
                  animate: { opacity: 1, y: 0, scale: 1 },
                  transition: { duration: 0.75, ease: EASE_OUT },
                })}
          >
            <HeroVisual prefersReduced={prefersReduced} />
          </motion.div>
        </div>
      </section>

      <section className="border-y border-edge bg-page-alt/60 px-6 py-24 transition-colors duration-300 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
          <motion.div {...motionSection}>
            <span className="mb-3 inline-block text-xs uppercase tracking-[0.08em] text-accent font-jetbrains">
              Our origin
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-heading sm:text-4xl font-raleway">
              Built from frustration with the old hiring loop.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-body font-raleway">
              Traditional hiring rewards volume. Veloraa is built around signal:
              who can actually do the work, where they will thrive, and which
              companies are ready to move with clarity.
            </p>
          </motion.div>

          <motion.div className="grid gap-4 md:grid-cols-3" {...motionStagger}>
            {storyMilestones.map((item, index) => (
              <motion.div
                key={item.title}
                variants={itemVariants}
                className="group relative overflow-hidden rounded-3xl border border-edge bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-glow-soft"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/25 to-transparent" />
                <div className="mb-5 flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-pill-border bg-pill-bg text-accent">
                    {item.icon}
                  </span>
                  <span className="text-xs font-semibold text-subtle font-jetbrains">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-heading font-raleway">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-body font-raleway">
                  {item.body}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-page px-6 py-24 lg:px-8">
        <div className="relative mx-auto max-w-7xl">
          <motion.div
            {...motionSection}
            className="mx-auto mb-14 max-w-3xl text-center"
          >
            <span className="mb-3 inline-block text-xs uppercase tracking-[0.08em] text-accent font-jetbrains">
              What guides us
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-heading sm:text-4xl font-raleway">
              A marketplace with a high bar and a human center.
            </h2>
          </motion.div>

          <motion.div className="grid gap-5 md:grid-cols-3" {...motionStagger}>
            {principles.map((principle) => (
              <motion.div
                key={principle.title}
                variants={itemVariants}
                className="relative overflow-hidden rounded-3xl border border-edge bg-surface p-8 shadow-sm"
              >
                <LiquidMark className="absolute -right-14 -top-14 h-40 w-40 opacity-70" />
                <div className="relative">
                  <span className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                    {principle.icon}
                  </span>
                  <h3 className="text-xl font-semibold text-heading font-raleway">
                    {principle.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-body font-raleway">
                    {principle.body}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section
        id="founders"
        className="relative overflow-hidden bg-dark-green px-6 py-24 lg:px-8"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-bright-green/30 to-transparent" />
          <FlowArrow className="absolute right-8 top-16 hidden h-28 w-72 text-bright-green/70 lg:block" />
        </div>

        <div className="relative mx-auto max-w-7xl">
          <motion.div
            {...motionSection}
            className="mb-14 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end"
          >
            <div>
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-bright-green/20 bg-bright-green/[0.06] px-4 py-1.5 text-xs uppercase tracking-[0.08em] text-bright-green font-jetbrains">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bright-green opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-bright-green" />
                </span>
                Meet the founders
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-warm-white sm:text-5xl font-raleway">
                Two founders, one standard: better matches.
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-relaxed text-beige/60 font-libre italic lg:justify-self-end">
              Veloraa is being built by a small founding team focused on both
              sides of the marketplace: the platform intelligence that creates
              signal, and the human relationships that turn signal into trust.
            </p>
          </motion.div>

          <motion.div className="grid gap-6 lg:grid-cols-2" {...motionStagger}>
            {founders.map((founder, index) => (
              <motion.article
                key={founder.name}
                variants={itemVariants}
                className="relative overflow-hidden rounded-[2rem] border border-beige/15 bg-white/[0.05] p-5 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-bright-green/30 sm:p-6"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-bright-green/30 to-transparent" />
                <div className="grid gap-6 md:grid-cols-[0.78fr_1fr] md:items-stretch">
                  <FounderPortrait
                    initials={founder.initials}
                    index={index}
                    prefersReduced={prefersReduced}
                  />
                  <div className="flex flex-col">
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-2xl font-bold text-warm-white font-raleway">
                          {founder.name}
                        </h3>
                        <p className="mt-1 text-xs uppercase tracking-[0.12em] text-bright-green/80 font-jetbrains">
                          {founder.role}
                        </p>
                      </div>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-beige/15 bg-beige/10 text-bright-green">
                        <ArrowUpRight className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-beige/60 font-raleway">
                      {founder.focus}
                    </p>
                    <div className="mt-auto flex flex-wrap gap-2 pt-6">
                      {founder.highlights.map((highlight) => (
                        <span
                          key={highlight}
                          className="rounded-full border border-beige/15 bg-beige/10 px-3 py-1 text-xs text-beige/75 font-raleway"
                        >
                          {highlight}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="bg-page px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            {...motionSection}
            className="mb-14 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
          >
            <div>
              <span className="mb-3 inline-block text-xs uppercase tracking-[0.08em] text-accent font-jetbrains">
                The Veloraa method
              </span>
              <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-heading sm:text-4xl font-raleway">
                The platform is designed around trust at every step.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-body font-raleway">
              Every interaction should make the next decision easier, not more
              confusing. That is the product standard behind Veloraa.
            </p>
          </motion.div>

          <motion.div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" {...motionStagger}>
            {platformSteps.map((step) => (
              <motion.div
                key={step.title}
                variants={itemVariants}
                className="relative overflow-hidden rounded-3xl border border-edge bg-surface p-6"
              >
                <div className="mb-7 flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                    {step.icon}
                  </span>
                  <span className="text-sm font-semibold text-subtle font-jetbrains">
                    {step.num}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-heading font-raleway">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-body font-raleway">{step.body}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-dark-green px-6 py-24 lg:px-8">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <LiquidMark className="h-[360px] w-[360px] text-bright-green opacity-50" />
        </div>
        <motion.div
          className="relative mx-auto max-w-2xl text-center"
          {...motionSection}
        >
          <h2 className="text-3xl font-bold tracking-tight text-beige sm:text-4xl font-raleway">
            We are building for the teams and talent who refuse average.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-beige/60 font-libre italic">
            Whether you are hiring elite technical talent or applying to join
            the pool, Veloraa is built to make the standard clear.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/sign-up?role=company"
              className="group inline-flex items-center justify-center rounded-lg bg-bright-green px-8 py-3.5 text-sm font-semibold text-dark-surface transition-all hover:shadow-[0_0_30px_rgba(74,222,128,0.3)] font-raleway"
            >
              Start hiring
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/sign-up?role=talent"
              className="inline-flex items-center justify-center rounded-lg border border-beige/20 px-8 py-3.5 text-sm font-semibold text-beige transition-all hover:border-beige/40 font-raleway"
            >
              Apply as talent
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
