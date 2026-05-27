import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";

export default function TalentUpgradeCard() {
  return (
    <section className="group relative overflow-hidden rounded-2xl border border-edge bg-page-alt p-4 transition-all duration-300 hover:border-accent/25 sm:rounded-3xl sm:p-6">
      {/* Layered radial glows */}
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{
        background: "radial-gradient(120% 60% at 100% 0%, rgba(74,222,128,0.18), transparent 65%), radial-gradient(80% 50% at 0% 100%, rgba(22,163,74,0.12), transparent 70%)",
      }} />

      {/* Dot grid overlay */}
      <svg aria-hidden className="absolute inset-0 h-full w-full opacity-30" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="talent-upgrade-dots" width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#talent-upgrade-dots)" className="text-accent" />
      </svg>

      {/* Floating sparkle */}
      <span aria-hidden className="velora-float absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border border-accent/30 bg-surface/80 text-accent backdrop-blur-sm sm:right-4 sm:top-4 sm:h-8 sm:w-8">
        <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
      </span>

      <div className="relative">
        <span className="inline-block text-[9px] uppercase tracking-widest text-accent font-jetbrains sm:text-[10px]">Premium</span>
        <h3 className="mt-1.5 text-base font-bold leading-tight text-heading font-raleway sm:mt-2 sm:text-xl">
          Unlock premium features
        </h3>
        <p className="mt-1.5 text-[11px] leading-relaxed text-body font-raleway sm:mt-2 sm:text-[12px]">
          Get priority visibility, exclusive roles from top employers, and dedicated career support.
        </p>

        <Link href="/talent/settings" className="mt-4 inline-flex w-full items-center justify-between gap-2 rounded-full bg-heading px-3.5 py-2 text-[11px] font-semibold text-page transition-transform hover:-translate-y-0.5 font-raleway sm:mt-5 sm:px-4 sm:py-2.5 sm:text-xs">
          Upgrade now
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-page text-heading sm:h-6 sm:w-6">
            <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </span>
        </Link>
      </div>
    </section>
  );
}
