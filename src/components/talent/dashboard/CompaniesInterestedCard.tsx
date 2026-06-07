import Link from "next/link";
import { Plus } from "lucide-react";

const PLACEHOLDER_COMPANIES = [
  { initial: "H", name: "Halcyon Labs", role: "Fintech · Series B", level: "Active", accent: "from-emerald-400/30 to-emerald-700/30" },
  { initial: "M", name: "Meridian AI", role: "AI/ML · Seed", level: "New", accent: "from-sky-400/30 to-sky-700/30" },
  { initial: "S", name: "Sable Inc.", role: "SaaS · Growth", level: "Active", accent: "from-amber-400/30 to-amber-700/30" },
] as const;

export default function CompaniesInterestedCard() {
  return (
    <section className="relative flex flex-col overflow-hidden rounded-2xl border border-edge bg-surface p-4 transition-all duration-300 hover:border-accent/25 hover:shadow-[0_24px_60px_-42px_rgba(10,46,26,0.3)] sm:rounded-3xl sm:p-6 max-h-[22rem] sm:max-h-none">
      {/* Glass shimmer */}
      <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl sm:rounded-3xl">
        <span className="velora-glass-shimmer absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
      </span>

      <header className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[13px] font-bold text-heading font-raleway sm:text-base">Companies interested</h3>
          <p className="mt-0.5 text-[10px] text-subtle font-jetbrains sm:text-[11px]">Who&apos;s been viewing you</p>
        </div>
        <Link href="/talent/invites" className="shrink-0 text-[10px] font-semibold text-accent transition-opacity hover:opacity-80 font-raleway sm:text-[11px]">
          See all
        </Link>
      </header>

      <ul className="relative mt-3 space-y-2 sm:mt-4 sm:space-y-2.5">
        {PLACEHOLDER_COMPANIES.map((c) => (
          <li key={c.name} className="group flex items-center gap-2.5 rounded-xl border border-edge bg-page-alt p-2 transition-colors hover:border-accent/30 sm:gap-3 sm:rounded-2xl sm:p-2.5">
            <span aria-hidden className={`relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br sm:h-10 sm:w-10 ${c.accent}`}>
              <span className="text-[13px] font-bold text-heading font-raleway sm:text-sm">{c.initial}</span>
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-[13px] font-semibold text-heading font-raleway sm:text-sm">{c.name}</p>
                <span className="shrink-0 rounded-full border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-[8px] uppercase tracking-widest text-accent font-jetbrains sm:text-[9px]">{c.level}</span>
              </div>
              <p className="truncate text-[10px] text-subtle font-jetbrains sm:text-[11px]">{c.role}</p>
            </div>
            <button type="button" disabled className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-edge bg-surface text-subtle transition-colors hover:border-accent/40 hover:text-accent disabled:cursor-not-allowed disabled:opacity-70 sm:h-8 sm:w-8" aria-label={`Connect with ${c.name}`}>
              <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={2.5} />
            </button>
          </li>
        ))}
      </ul>

      <p className="relative mt-3 rounded-xl border border-dashed border-edge bg-page-alt px-2.5 py-1.5 text-[9px] leading-relaxed text-subtle font-jetbrains sm:mt-4 sm:px-3 sm:py-2 sm:text-[10px]">
        Sample preview. Real employer interest will populate here as companies engage with your profile.
      </p>
    </section>
  );
}
