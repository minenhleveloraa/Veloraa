"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Company-profile banner: a futuristic glassmorphic header that adapts
 * to light & dark mode and never crops or stretches at any breakpoint.
 *
 * Visual stack (back → front):
 *   1. Solid dark-green base (always; provides our brand floor).
 *   2. SVG noise grain (procedural, weightless).
 *   3. Two drifting radial blobs of brand green (framer-motion).
 *   4. Diagonal grid pattern (SVG <pattern>).
 *   5. Top-left & bottom-right glow streaks.
 *   6. Inner border highlight + bottom fade into the page bg.
 *
 * No raster image is loaded. Everything is vector + CSS.
 */
export function CompanyProfileBanner() {
  const prefersReduced = useReducedMotion();

  // Animations are subtle and looping — disabled when the user has
  // reduce-motion turned on, per a11y best practice.
  const driftA = prefersReduced
    ? {}
    : { x: [0, 32, -16, 0], y: [0, -18, 12, 0] };
  const driftB = prefersReduced
    ? {}
    : { x: [0, -28, 14, 0], y: [0, 16, -10, 0] };

  return (
    <div
      aria-hidden
      className="absolute inset-0 overflow-hidden bg-[#0A2E1A]"
    >
      {/* 1. Diagonal grid pattern — extremely subtle, brand green strokes. */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.18]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="profile-banner-grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(8)"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="#16A34A"
              strokeWidth="0.6"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#profile-banner-grid)" />
      </svg>

      {/* 2. Drifting blob A — top-left, bright accent. */}
      <motion.div
        className="absolute -left-24 -top-24 h-[360px] w-[360px] rounded-full blur-3xl will-change-transform"
        style={{
          background:
            "radial-gradient(closest-side, rgba(74,222,128,0.55), rgba(22,163,74,0.18) 55%, transparent 80%)",
        }}
        animate={driftA}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* 3. Drifting blob B — bottom-right, deeper green. */}
      <motion.div
        className="absolute -bottom-32 -right-20 h-[420px] w-[420px] rounded-full blur-3xl will-change-transform"
        style={{
          background:
            "radial-gradient(closest-side, rgba(16,185,129,0.45), rgba(10,46,26,0.0) 70%)",
        }}
        animate={driftB}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* 4. Top-left highlight streak. */}
      <div
        className="absolute -left-12 top-0 h-40 w-72 rotate-[18deg] rounded-full opacity-50 mix-blend-screen blur-2xl"
        style={{
          background:
            "linear-gradient(120deg, rgba(245,240,232,0.45), rgba(245,240,232,0) 70%)",
        }}
      />

      {/* 5. Bottom-right warm highlight streak (beige). */}
      <div
        className="absolute -bottom-10 right-12 h-28 w-80 -rotate-12 rounded-full opacity-40 mix-blend-screen blur-2xl"
        style={{
          background:
            "linear-gradient(80deg, rgba(245,240,232,0) 0%, rgba(245,240,232,0.5) 50%, rgba(245,240,232,0) 100%)",
        }}
      />

      {/* 6. Procedural film grain (cheap; no raster). */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.12] mix-blend-overlay"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="profile-banner-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect
          width="100%"
          height="100%"
          filter="url(#profile-banner-noise)"
          opacity="0.6"
        />
      </svg>

      {/* 7. Inner glass border highlight along the top. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(to right, transparent 0%, rgba(245,240,232,0.45) 30%, rgba(245,240,232,0.45) 70%, transparent 100%)",
        }}
      />

      {/* 8. Bottom fade — dissolves into the page background so the
          avatar/logo sits cleanly without a hard edge. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, rgba(10,46,26,0.65) 100%)",
        }}
      />
    </div>
  );
}

export default CompanyProfileBanner;
