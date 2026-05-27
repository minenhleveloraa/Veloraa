"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, TrendingDown, TrendingUp, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export type PulseDay = {
  dateISO: string;
  label: string;
  value: number;
};

export default function TalentActivityPulse({
  days,
  prevWeekTotal,
  title = "Profile activity",
  subtitle = "Track profile views, messages and saves from employers this week.",
  unit = "views",
}: {
  days: PulseDay[];
  prevWeekTotal: number;
  title?: string;
  subtitle?: string;
  unit?: string;
}) {
  const initialIdx = useMemo(() => {
    let best = days.length - 1;
    let bestV = -1;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].value > bestV) { bestV = days[i].value; best = i; }
    }
    return best;
  }, [days]);

  const [activeIdx, setActiveIdx] = useState(initialIdx);
  const active = days[activeIdx];
  const total = useMemo(() => days.reduce((s, d) => s + d.value, 0), [days]);
  const max = useMemo(() => Math.max(1, ...days.map((d) => d.value)), [days]);
  const delta = prevWeekTotal <= 0 ? null : Math.round(((total - prevWeekTotal) / prevWeekTotal) * 100);
  const positive = (delta ?? 0) >= 0;
  const isQuiet = total === 0;

  return (
    <section className="group relative overflow-hidden rounded-2xl border border-edge bg-surface p-4 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.25)] sm:rounded-3xl sm:p-7">
      <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl sm:rounded-3xl">
        <span className="velora-glass-shimmer absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
      </span>
      <span aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
      <span aria-hidden className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative flex items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <div className="mb-1.5 flex items-center gap-2 sm:mb-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pill-bg text-accent sm:h-9 sm:w-9 sm:rounded-xl">
              <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
            <span className="text-[9px] uppercase tracking-[0.1em] text-subtle font-jetbrains sm:text-[10px] sm:tracking-widest">This week</span>
          </div>
          <h2 className="text-xl font-bold text-heading font-raleway sm:text-3xl">{title}</h2>
          <p className="mt-1 max-w-md text-[11px] leading-relaxed text-body font-raleway sm:mt-1.5 sm:text-sm">{subtitle}</p>
        </div>
        <button type="button" disabled className="inline-flex shrink-0 items-center gap-1 rounded-full border border-edge bg-page-alt px-2.5 py-1 text-[10px] font-semibold text-body disabled:cursor-not-allowed font-raleway sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-[11px]">
          Week <ChevronDown className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
        </button>
      </div>

      <div className="relative mt-5 flex flex-col-reverse gap-4 sm:mt-7 sm:gap-6 md:flex-row md:items-end md:gap-8">
        <div className="md:w-44 md:shrink-0">
          {delta === null ? (
            <>
              <p className="text-2xl font-bold text-heading font-raleway sm:text-4xl">{total}</p>
              <p className="mt-1 max-w-[16rem] text-[10px] leading-relaxed text-subtle font-raleway sm:text-[11px]">
                {isQuiet ? "Quiet week — activity will appear as employers engage." : `${unit} this week`}
              </p>
            </>
          ) : (
            <>
              <div className="flex items-baseline gap-1.5">
                <p className={cn("text-2xl font-bold font-raleway sm:text-4xl", positive ? "text-heading" : "text-amber-600")}>
                  {positive ? "+" : ""}{delta}%
                </p>
                {positive ? <TrendingUp className="h-3.5 w-3.5 text-accent sm:h-4 sm:w-4" /> : <TrendingDown className="h-3.5 w-3.5 text-amber-500 sm:h-4 sm:w-4" />}
              </div>
              <p className="mt-1 max-w-[14rem] text-[10px] leading-snug text-subtle font-raleway sm:text-[11px]">
                This week&apos;s activity is {positive ? "higher" : "lower"} than last week&apos;s.
              </p>
            </>
          )}
        </div>

        <div className="flex-1">
          <div className="relative">
            <div className="relative h-9">
              {days.map((d, i) => (
                <motion.span key={d.dateISO} initial={false}
                  animate={{ opacity: i === activeIdx ? 1 : 0, scale: i === activeIdx ? 1 : 0.92 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="absolute top-0 -translate-x-1/2 rounded-full bg-heading px-2.5 py-1 text-[10px] font-semibold text-page shadow-md font-jetbrains"
                  style={{ left: `${((i + 0.5) / days.length) * 100}%`, pointerEvents: i === activeIdx ? "auto" : "none" }}>
                  {active.value} {unit}
                  <span aria-hidden className="absolute left-1/2 top-full -ml-[3px] h-0 w-0 border-x-[3px] border-t-[3px] border-x-transparent border-t-heading" />
                </motion.span>
              ))}
            </div>
            <div className="mt-2 flex h-28 items-end gap-1.5 sm:h-36 sm:gap-2">
              {days.map((d, i) => {
                const ratio = max === 0 ? 0 : d.value / max;
                const hPct = Math.max(8, ratio * 100);
                const isA = i === activeIdx;
                return (
                  <button key={d.dateISO} type="button" onClick={() => setActiveIdx(i)}
                    aria-label={`${d.label} — ${d.value} ${unit}`} aria-pressed={isA}
                    className="group relative flex h-full flex-1 flex-col items-center justify-end">
                    <span aria-hidden className={cn("relative w-px transition-all duration-300", isA ? "bg-heading" : "bg-edge")} style={{ height: `${hPct}%` }} />
                    <span aria-hidden className={cn("absolute -translate-y-1/2 rounded-full transition-all duration-300",
                      isA ? "h-3 w-3 bg-accent shadow-[0_0_18px_rgba(74,222,128,0.7)] ring-4 ring-accent/15" : "h-2 w-2 bg-accent/70 group-hover:h-2.5 group-hover:w-2.5 group-hover:bg-accent"
                    )} style={{ top: `${100 - hPct}%` }} />
                  </button>
                );
              })}
            </div>
            <div className="mt-2.5 flex items-center gap-1.5 sm:mt-3 sm:gap-2">
              {days.map((d, i) => (
                <button key={`${d.dateISO}-l`} type="button" onClick={() => setActiveIdx(i)}
                  className="flex flex-1 justify-center active:scale-95">
                  <span className={cn("flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold transition-all font-raleway sm:h-9 sm:w-9 sm:text-[11px]",
                    i === activeIdx ? "bg-heading text-page shadow-md" : "bg-page-alt text-subtle hover:text-body")}>
                    {d.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
