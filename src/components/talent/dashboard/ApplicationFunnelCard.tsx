import { Briefcase, Calendar, Send, Target } from "lucide-react";

export default function ApplicationFunnelCard({
  applied = 0,
  interviews = 0,
  offers = 0,
}: {
  applied?: number;
  interviews?: number;
  offers?: number;
}) {
  const today = new Date().toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
  const cols = [
    { label: "Applied", value: applied, icon: Send },
    { label: "Interviews", value: interviews, icon: Briefcase },
    { label: "Offers", value: offers, icon: Target },
  ];
  const max = Math.max(1, ...cols.map((c) => c.value));

  return (
    <section className="relative flex flex-col overflow-hidden rounded-2xl border border-edge bg-surface p-4 transition-all duration-300 hover:border-accent/25 hover:shadow-[0_24px_60px_-42px_rgba(10,46,26,0.3)] sm:rounded-3xl sm:p-6 max-h-[22rem] sm:max-h-none">
      {/* Glass shimmer */}
      <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl sm:rounded-3xl">
        <span className="velora-glass-shimmer absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
      </span>

      <header className="relative flex items-center justify-between gap-2 sm:gap-3">
        <h3 className="text-[13px] font-bold text-heading font-raleway sm:text-base">Application progress</h3>
        <span className="inline-flex items-center gap-1 rounded-full border border-edge bg-page-alt px-2 py-0.5 text-[9px] uppercase tracking-widest text-subtle font-jetbrains sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-[10px]">
          <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3" />{today}
        </span>
      </header>

      <div className="relative mt-4 grid grid-cols-3 gap-2 sm:mt-5 sm:gap-4">
        {cols.map((c, i) => {
          const Icon = c.icon;
          const ratio = c.value / max;
          const SEGMENTS = 14;
          const filled = Math.round(SEGMENTS * Math.max(0, Math.min(1, ratio)));
          return (
            <div key={c.label} className="min-w-0">
              <p className="flex items-center gap-1 text-[9px] uppercase tracking-widest text-subtle font-jetbrains sm:gap-1.5 sm:text-[10px]">
                <Icon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span className="truncate">{c.label}</span>
              </p>
              <p className="mt-1 text-xl font-bold text-heading font-raleway sm:mt-1.5 sm:text-3xl">{c.value}</p>
              <div className="mt-2.5 flex h-8 items-end gap-[2px] sm:mt-3 sm:h-10">
                {Array.from({ length: SEGMENTS }).map((_, idx) => {
                  const isFilled = idx < filled;
                  const heightPct = 35 + (idx / SEGMENTS) * 60;
                  return (
                    <span key={idx} className={isFilled ? (i === 0 ? "w-1 rounded-sm bg-accent shadow-[0_0_4px_rgba(74,222,128,0.5)]" : "w-1 rounded-sm bg-heading") : "w-1 rounded-sm bg-edge"} style={{ height: `${heightPct}%` }} />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <p className="relative mt-3 text-[9px] leading-relaxed text-subtle font-jetbrains sm:mt-4 sm:text-[10px]">
        Placeholder data. Real application tracking will populate as you apply to roles through Veloraa.
      </p>
    </section>
  );
}
