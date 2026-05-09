"use client";

import { useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";

const Globe = dynamic(() => import("@/components/3d/Globe"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-64 w-64 rounded-full bg-accent-glow/10 blur-3xl" />
    </div>
  ),
});

const avatars = [
  { initials: "JD", bg: "bg-accent/15" },
  { initials: "AM", bg: "bg-accent/10" },
  { initials: "SK", bg: "bg-accent/20" },
  { initials: "LR", bg: "bg-accent/8" },
  { initials: "TP", bg: "bg-accent/12" },
];

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: EASE_OUT },
  }),
};

export default function Hero() {
  const prefersReduced = useReducedMotion();
  const containerRef = useRef<HTMLElement>(null);
  const { user } = useAuth();
  const isAuthed = !!user;

  const motionProps = (i: number) =>
    prefersReduced
      ? {}
      : { variants: fadeUp, initial: "hidden", animate: "visible", custom: i };

  return (
    <section
      ref={containerRef}
      className="relative flex min-h-screen items-center overflow-hidden bg-page pt-16 transition-colors duration-300"
    >
      {/* Subtle radial glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 60% at 75% 50%, var(--v-glow-soft) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-8 px-6 lg:grid-cols-[1fr_0.82fr] lg:gap-12 lg:px-8">
        {/* Left column */}
        <div className="flex flex-col justify-center py-12 lg:py-24">
          {/* Pill badge */}
          <motion.div {...motionProps(0)} className="mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-pill-border bg-pill-bg px-4 py-1.5 text-xs uppercase tracking-[0.08em] text-pill-text font-jetbrains">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
              AI-Powered Talent Marketplace
            </span>
          </motion.div>

          {/* H1 */}
          <motion.h1
            {...motionProps(1)}
            className="text-4xl font-bold leading-[1.08] tracking-tight text-heading sm:text-5xl lg:text-[80px] font-raleway"
          >
            The World&apos;s
            <br />
            Top 1% of Talent
            <br />
            <span className="text-accent">In One Place.</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            {...motionProps(2)}
            className="mt-6 max-w-lg text-lg leading-relaxed text-body font-libre italic"
          >
            A premium marketplace where vetted engineers, designers, and product
            leaders meet the companies worthy of their craft.
          </motion.p>

          {/* CTAs */}
          <motion.div {...motionProps(3)} className="mt-10 flex flex-wrap gap-4">
            {isAuthed ? (
              <Link
                href="/profile"
                className="group relative inline-flex items-center justify-center rounded-lg bg-btn-bg px-7 py-3.5 text-sm font-semibold text-btn-fg transition-all hover:opacity-90 hover:shadow-lg font-raleway"
              >
                Go to your profile
                <svg
                  className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-up?role=company"
                  className="group relative inline-flex items-center justify-center rounded-lg bg-btn-bg px-7 py-3.5 text-sm font-semibold text-btn-fg transition-all hover:opacity-90 hover:shadow-lg font-raleway"
                >
                  Find Top Talent
                  <svg
                    className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  href="/sign-up?role=talent"
                  className="inline-flex items-center justify-center rounded-lg border border-ghost-border px-7 py-3.5 text-sm font-semibold text-ghost-text transition-all hover:opacity-80 font-raleway"
                >
                  Apply as Talent
                </Link>
              </>
            )}
          </motion.div>

          {/* Social proof */}
          <motion.div {...motionProps(4)} className="mt-10 flex items-center gap-4">
            <div className="flex -space-x-2">
              {avatars.map((a, i) => (
                <div
                  key={i}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-page text-[11px] font-medium text-heading ${a.bg} font-raleway`}
                >
                  {a.initials}
                </div>
              ))}
            </div>
            <p className="text-sm text-subtle font-raleway">
              <span className="font-semibold text-heading">2,400+</span> vetted
              professionals
            </p>
          </motion.div>
        </div>

        {/* Right column — dark panel with Globe */}
        <div className="relative hidden min-h-[500px] lg:block">
          <div className="absolute -right-8 -top-8 bottom-0 left-0 overflow-hidden rounded-3xl bg-dark-surface">
            <Globe />
          </div>

          <motion.div
            className="glass absolute bottom-24 left-4 z-20 rounded-xl px-6 py-4"
            animate={prefersReduced ? {} : { y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <p className="text-2xl font-bold text-warm-white font-raleway">183</p>
            <p className="text-xs text-muted-beige font-raleway">hires this month</p>
            <p className="mt-1 text-[11px] tracking-wide text-bright-green/70 font-jetbrains uppercase">
              across 34 countries
            </p>
          </motion.div>

          <motion.div
            className="glass absolute right-4 top-16 z-20 rounded-xl px-5 py-3"
            animate={prefersReduced ? {} : { y: [0, -8, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
          >
            <p className="text-lg font-bold text-warm-white font-raleway">94%</p>
            <p className="text-[11px] text-muted-beige font-raleway">success rate</p>
          </motion.div>
        </div>

        {/* Mobile: dark card with glow */}
        <div className="relative flex h-64 items-center justify-center overflow-hidden rounded-2xl bg-dark-surface lg:hidden">
          <div className="absolute h-48 w-48 rounded-full bg-bright-green/10 blur-3xl" />
          <div className="absolute h-32 w-32 rounded-full bg-bright-green/20 blur-2xl" />
          <div className="glass relative rounded-xl px-6 py-4 text-center">
            <p className="text-2xl font-bold text-warm-white font-raleway">183</p>
            <p className="text-xs text-muted-beige font-raleway">hires this month</p>
            <p className="mt-1 text-[11px] tracking-wide text-bright-green/70 font-jetbrains uppercase">
              across 34 countries
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
