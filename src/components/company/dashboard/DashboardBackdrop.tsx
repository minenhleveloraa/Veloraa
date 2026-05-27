import { cn } from "@/lib/utils";

/**
 * Ambient SVG backdrop for the company dashboard overview page.
 *
 * Inspired by mid-century abstract poster art: bold flat shapes with
 * generous overlap, restricted palette, organic curves balanced by
 * geometric circles. Drawn with the Veloraa palette only — dark green,
 * mid green, bright green, beige and muted beige — so it reads as quiet
 * ambient texture in light mode and as soft luminance in dark mode.
 *
 * The component renders absolutely behind dashboard content. Wrap your
 * page in `relative` and the dashboard content in `relative z-10` so
 * the art doesn't intercept clicks (it already sets `pointer-events-none`).
 *
 * Each shape is wrapped in its own positioned `<div>` so they reflow
 * gracefully on narrow viewports and stay perfectly responsive.
 */
export default function DashboardBackdrop({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 -z-0 overflow-hidden",
        className
      )}
    >
      {/* Layer 0 — soft global tint that sits underneath everything */}
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(80% 50% at 100% 0%, rgba(74,222,128,0.08), transparent 60%), radial-gradient(70% 60% at 0% 30%, rgba(22,163,74,0.06), transparent 70%), radial-gradient(60% 40% at 100% 100%, rgba(184,176,154,0.10), transparent 65%)",
        }}
      />

      {/* Layer 1 — fine dot grid for technical/futuristic texture */}
      <svg
        className="absolute inset-0 h-full w-full text-heading opacity-[0.04]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="velora-bg-dots"
            x="0"
            y="0"
            width="26"
            height="26"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="1" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#velora-bg-dots)" />
      </svg>

      {/* Layer 2 — top-right "leaf" (bright green) drifting gently */}
      <div className="velora-drift-y-slow absolute -right-[8%] top-[2%] h-[34vw] w-[55vw] max-h-[420px] max-w-[640px]">
        <svg
          viewBox="0 0 640 480"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full"
        >
          {/* Filled organic blade */}
          <path
            d="M620 40 C 540 -10, 380 30, 280 130 C 180 230, 80 360, 60 460 C 220 460, 380 380, 480 280 C 580 180, 640 100, 620 40 Z"
            fill="#4ADE80"
            fillOpacity="0.10"
          />
          {/* Inset stroke echo */}
          <path
            d="M600 70 C 520 30, 380 70, 290 160 C 200 250, 130 340, 110 420"
            stroke="#16A34A"
            strokeOpacity="0.18"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
      </div>

      {/* Layer 3 — small "sun" disc, top-center-right */}
      <div className="velora-pulse-soft absolute right-[18%] top-[10%] h-16 w-16 sm:h-20 sm:w-20">
        <svg
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full"
        >
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="#B8B09A"
            fillOpacity="0.18"
          />
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke="#0A2E1A"
            strokeOpacity="0.12"
            strokeWidth="1"
            fill="none"
          />
          <circle
            cx="40"
            cy="40"
            r="22"
            fill="#16A34A"
            fillOpacity="0.10"
          />
        </svg>
      </div>

      {/* Layer 4 — left-side dark-green organic blade slicing in */}
      <div className="velora-drift-x-slow absolute -left-[12%] top-[28%] h-[28vw] w-[46vw] max-h-[360px] max-w-[520px]">
        <svg
          viewBox="0 0 520 360"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full"
        >
          <path
            d="M 0 360 C 60 280, 180 220, 280 200 C 380 180, 460 140, 520 80 L 520 0 C 420 40, 320 80, 240 130 C 160 180, 60 240, 0 320 Z"
            fill="#0A2E1A"
            fillOpacity="0.12"
          />
          <path
            d="M 30 340 C 100 270, 220 220, 320 200 C 420 180, 480 140, 520 100"
            stroke="#16A34A"
            strokeOpacity="0.22"
            strokeWidth="1.25"
            fill="none"
          />
        </svg>
      </div>

      {/* Layer 5 — middle scattered dot cluster */}
      <div className="absolute left-[8%] top-[44%] hidden h-32 w-32 sm:block">
        <svg
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full"
        >
          <circle cx="20" cy="20" r="3" fill="#16A34A" fillOpacity="0.45" />
          <circle cx="60" cy="40" r="2" fill="#0A2E1A" fillOpacity="0.55" />
          <circle cx="100" cy="20" r="4" fill="#4ADE80" fillOpacity="0.4" />
          <circle cx="40" cy="80" r="2.5" fill="#B8B09A" fillOpacity="0.6" />
          <circle cx="90" cy="100" r="3" fill="#16A34A" fillOpacity="0.4" />
        </svg>
      </div>

      {/* Layer 6 — bottom-right overlapping pair (mid + dark) */}
      <div className="velora-drift-y absolute -bottom-[5%] -right-[8%] h-[42vw] w-[55vw] max-h-[480px] max-w-[680px]">
        <svg
          viewBox="0 0 680 480"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full"
        >
          {/* dark base */}
          <path
            d="M 680 480 L 680 80 C 580 120, 420 140, 320 220 C 220 300, 140 380, 80 480 Z"
            fill="#0A2E1A"
            fillOpacity="0.12"
          />
          {/* mid green overlay */}
          <path
            d="M 680 480 L 680 200 C 580 230, 480 280, 400 340 C 320 400, 260 440, 220 480 Z"
            fill="#16A34A"
            fillOpacity="0.14"
          />
          {/* small accent circle */}
          <circle
            cx="540"
            cy="260"
            r="34"
            fill="#4ADE80"
            fillOpacity="0.25"
          />
          <circle
            cx="540"
            cy="260"
            r="34"
            stroke="#0A2E1A"
            strokeOpacity="0.2"
            strokeWidth="1"
            fill="none"
          />
        </svg>
      </div>

      {/* Layer 7 — soft curving sweep that arcs across mid-page */}
      <svg
        className="absolute inset-x-0 top-[55%] h-[40%] w-full opacity-[0.18]"
        viewBox="0 0 1200 400"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
      >
        <path
          d="M -50 350 C 200 250, 500 380, 760 220 C 980 90, 1100 170, 1250 80"
          stroke="#16A34A"
          strokeOpacity="0.6"
          strokeWidth="1.25"
        />
        <path
          d="M -50 380 C 220 290, 500 410, 780 250 C 1000 120, 1120 200, 1250 120"
          stroke="#4ADE80"
          strokeOpacity="0.4"
          strokeWidth="1"
        />
      </svg>

      {/* Layer 8 — small accent triangle, bottom-left */}
      <div className="velora-pulse-soft absolute bottom-[12%] left-[6%] hidden h-16 w-16 lg:block">
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full"
        >
          <path
            d="M 8 56 L 56 56 L 32 12 Z"
            fill="#B8B09A"
            fillOpacity="0.25"
          />
          <path
            d="M 8 56 L 56 56 L 32 12 Z"
            stroke="#0A2E1A"
            strokeOpacity="0.18"
            strokeWidth="1"
          />
        </svg>
      </div>

      {/* Layer 9 — vignette tying everything together */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 40% at 50% 100%, transparent 60%, rgba(0,0,0,0.04) 100%)",
        }}
      />
    </div>
  );
}
