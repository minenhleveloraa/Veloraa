"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Hiring-pulse card.
 *
 * One large featured card, modeled after the "Income Tracker" in the
 * inspiration screenshot. Shows the past 7 days of hiring activity as a
 * lollipop chart with a draggable selection, an active-day tooltip, and a
 * week-over-week delta in the corner.
 *
 * Renders as a server-driven component: the parent passes a 7-element
 * `days` array (oldest → newest), each with a numeric value. Dataset can
 * be all-zero — the card will gracefully read as "quiet week" without
 * collapsing the chart.
 */

export type PulseDay = {
  /** ISO date string (UTC date the bucket represents). */
  dateISO: string;
  /** Single-letter weekday label, S | M | T | W | T | F | S. */
  label: string;
  /** Bucket value — jobs created, invites sent, or any positive metric. */
  value: number;
};

export type PulseRange = "week" | "month";

interface HiringPulseCardProps {
  days: PulseDay[];
  /** Sum of last week's bucket values for delta calculation. */
  prevWeekTotal: number;
  /** Optional headline override — defaults to "Hiring pulse". */
  title?: string;
  /** Subtitle copy below the title. */
  subtitle?: string;
  /** Unit label that follows the active value, e.g. "events", "jobs". */
  unit?: string;
}

export default function HiringPulseCard({
  days,
  prevWeekTotal,
  title = "Hiring pulse",
  subtitle = "Track every move across your hiring funnel — jobs created, invites sent and replies received this week.",
  unit = "events",
}: HiringPulseCardProps) {
  // Default to the most recent day (or the busiest day if all recent are 0).
  const initialIdx = useMemo(() => {
    let bestIdx = days.length - 1;
    let bestVal = -1;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].value > bestVal) {
        bestVal = days[i].value;
        bestIdx = i;
      }
    }
    return bestIdx;
  }, [days]);

  const [activeIdx, setActiveIdx] = useState(initialIdx);
  const active = days[activeIdx];

  const total = useMemo(() => days.reduce((s, d) => s + d.value, 0), [days]);
  const max = useMemo(
    () => Math.max(1, ...days.map((d) => d.value)),
    [days]
  );

  // Delta vs previous week. Uses sentinel -1 to mean "no prior data".
  const delta =
    prevWeekTotal <= 0
      ? null
      : Math.round(((total - prevWeekTotal) / prevWeekTotal) * 100);

  const positive = (delta ?? 0) >= 0;
  const isQuiet = total === 0;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-edge bg-surface p-4 transition-all duration-300 hover:border-accent/25 hover:shadow-[0_24px_60px_-42px_rgba(10,46,26,0.3)] sm:rounded-3xl sm:p-6">
      {/* Decorative corner glow */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/15 blur-3xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl"
      />

      {/* Header row */}
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pill-bg text-accent">
              <TrendingUp className="h-4 w-4" />
            </span>
            <span className="text-[10px] uppercase tracking-[0.14em] text-subtle font-jetbrains">
              This week
            </span>
          </div>
          <h2 className="text-2xl font-bold text-heading sm:text-3xl font-raleway">
            {title}
          </h2>
          <p className="mt-1.5 max-w-md text-xs text-body sm:text-sm font-raleway">
            {subtitle}
          </p>
        </div>

        {/* Range selector — disabled, decorative for now */}
        <button
          type="button"
          disabled
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-edge bg-page-alt px-3 py-1.5 text-[11px] font-semibold text-body transition-colors disabled:cursor-not-allowed font-raleway"
        >
          Week
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>

      {/* Bottom row — desktop side-by-side; mobile stacked */}
      <div className="relative mt-7 flex flex-col-reverse gap-6 md:flex-row md:items-end md:gap-8">
        {/* Delta + total panel */}
        <div className="md:w-44 md:shrink-0">
          {delta === null ? (
            <>
              <p className="text-3xl font-bold text-heading sm:text-4xl font-raleway">
                {total}
              </p>
              <p className="mt-1 max-w-[16rem] text-[11px] text-subtle font-raleway">
                {isQuiet
                  ? "Quiet week. Post a role to start your pulse."
                  : `${unit} this week`}
              </p>
            </>
          ) : (
            <>
              <div className="flex items-baseline gap-1.5">
                <p
                  className={cn(
                    "text-3xl font-bold sm:text-4xl font-raleway",
                    positive ? "text-heading" : "text-amber-600"
                  )}
                >
                  {positive ? "+" : ""}
                  {delta}%
                </p>
                {positive ? (
                  <TrendingUp className="h-4 w-4 text-accent" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-amber-500" />
                )}
              </div>
              <p className="mt-1 max-w-[14rem] text-[11px] leading-snug text-subtle font-raleway">
                This week&apos;s pulse is {positive ? "higher" : "lower"} than
                last week&apos;s.
              </p>
            </>
          )}
        </div>

        {/* Chart */}
        <div className="flex-1">
          <Lollipops
            days={days}
            max={max}
            activeIdx={activeIdx}
            onSelect={setActiveIdx}
            unit={unit}
            active={active}
          />
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Internal: lollipop chart
// ─────────────────────────────────────────────────────────────────────

function Lollipops({
  days,
  max,
  activeIdx,
  onSelect,
  unit,
  active,
}: {
  days: PulseDay[];
  max: number;
  activeIdx: number;
  onSelect: (idx: number) => void;
  unit: string;
  active: PulseDay;
}) {
  return (
    <div className="relative">
      {/* Tooltip — pinned above the active day */}
      <div className="relative h-9">
        {days.map((d, i) => (
          <motion.span
            key={d.dateISO}
            initial={false}
            animate={{
              opacity: i === activeIdx ? 1 : 0,
              scale: i === activeIdx ? 1 : 0.92,
            }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute top-0 -translate-x-1/2 rounded-full bg-heading px-2.5 py-1 text-[10px] font-semibold text-page shadow-md font-jetbrains"
            style={{
              left: percentLeft(i, days.length),
              pointerEvents: i === activeIdx ? "auto" : "none",
            }}
          >
            {active.value} {unit}
            <span
              aria-hidden
              className="absolute left-1/2 top-full -ml-[3px] h-0 w-0 border-x-[3px] border-t-[3px] border-x-transparent border-t-heading"
            />
          </motion.span>
        ))}
      </div>

      {/* Lollipop bars */}
      <div className="mt-2 flex h-32 items-end gap-2 sm:h-36">
        {days.map((d, i) => {
          const ratio = max === 0 ? 0 : d.value / max;
          const heightPct = Math.max(8, ratio * 100); // min 8% so the dot is visible
          const isActive = i === activeIdx;
          return (
            <button
              key={d.dateISO}
              type="button"
              onClick={() => onSelect(i)}
              aria-label={`${d.label} — ${d.value} ${unit}`}
              aria-pressed={isActive}
              className="group relative flex h-full flex-1 flex-col items-center justify-end"
            >
              {/* the line */}
              <span
                aria-hidden
                className={cn(
                  "relative w-px transition-all duration-300",
                  isActive ? "bg-heading" : "bg-edge"
                )}
                style={{ height: `${heightPct}%` }}
              />
              {/* the dot */}
              <span
                aria-hidden
                className={cn(
                  "absolute -translate-y-1/2 rounded-full transition-all duration-300",
                  isActive
                    ? "h-3 w-3 bg-accent shadow-[0_0_18px_rgba(74,222,128,0.7)] ring-4 ring-accent/15"
                    : "h-2 w-2 bg-accent/70 group-hover:h-2.5 group-hover:w-2.5 group-hover:bg-accent"
                )}
                style={{ top: `${100 - heightPct}%` }}
              />
            </button>
          );
        })}
      </div>

      {/* Day-of-week badges */}
      <div className="mt-3 flex items-center gap-2">
        {days.map((d, i) => {
          const isActive = i === activeIdx;
          return (
            <button
              key={`${d.dateISO}-label`}
              type="button"
              onClick={() => onSelect(i)}
              aria-label={`Select ${d.label}`}
              className={cn(
                "flex flex-1 justify-center transition-transform",
                "active:scale-95"
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold transition-all font-raleway sm:h-9 sm:w-9",
                  isActive
                    ? "bg-heading text-page shadow-md"
                    : "bg-page-alt text-subtle hover:text-body"
                )}
              >
                {d.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Convert an index in a fixed-length series to its percent-left position
 * matching the chart's `flex` columns (each column has the same width, so
 * the centre of column `i` sits at `(i + 0.5) / count` of the row width).
 */
function percentLeft(idx: number, count: number): string {
  const pct = ((idx + 0.5) / count) * 100;
  return `${pct}%`;
}
