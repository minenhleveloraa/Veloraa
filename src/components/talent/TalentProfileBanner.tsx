"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Talent profile banner — futuristic glass header echoing the company
 * profile banner so the two surfaces feel like siblings while staying
 * subtly distinct (talent uses a slightly cooler blue-green tone).
 *
 * Visual stack (back → front):
 *   1. Solid dark-green base.
 *   2. Diagonal grid pattern.
 *   3. Two drifting radial blobs (accent + emerald).
 *   4. Diagonal light streaks for depth.
 *   5. Film grain.
 *   6. Top highlight + bottom fade to dissolve into page bg.
 */
export function TalentProfileBanner() {
  const prefersReduced = useReducedMotion();

  const driftA = prefersReduced
    ? {}
    : { x: [0, 28, -14, 0], y: [0, -20, 14, 0] };
  const driftB = prefersReduced
    ? {}
    : { x: [0, -22, 18, 0], y: [0, 18, -12, 0] };

  return (
    <div
      aria-hidden
      className="absolute inset-0 overflow-hidden bg-[#0A2E1A]"
    >
      {/* Diagonal grid pattern */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.18]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="talent-profile-grid"
            width="42"
            height="42"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-6)"
          >
            <path
              d="M 42 0 L 0 0 0 42"
              fill="none"
              stroke="#4ADE80"
              strokeWidth="0.55"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#talent-profile-grid)" />
      </svg>

      {/* Drifting blob A — top-right, bright accent */}
      <motion.div
        className="absolute -right-24 -top-24 h-[380px] w-[380px] rounded-full blur-3xl will-change-transform"
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

      {/* Drifting blob B — bottom-left, deeper emerald */}
      <motion.div
        className="absolute -bottom-32 -left-20 h-[440px] w-[440px] rounded-full blur-3xl will-change-transform"
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

      {/* Top-right highlight streak */}
      <div
        className="absolute right-0 top-0 h-40 w-80 rotate-[18deg] rounded-full opacity-50 mix-blend-screen blur-2xl"
        style={{
          background:
            "linear-gradient(120deg, rgba(245,240,232,0.45), rgba(245,240,232,0) 70%)",
        }}
      />

      {/* Bottom-left warm highlight streak */}
      <div
        className="absolute -bottom-10 left-12 h-28 w-80 rotate-12 rounded-full opacity-40 mix-blend-screen blur-2xl"
        style={{
          background:
            "linear-gradient(80deg, rgba(245,240,232,0) 0%, rgba(245,240,232,0.5) 50%, rgba(245,240,232,0) 100%)",
        }}
      />

      {/* Procedural film grain */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.10] mix-blend-overlay"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="talent-profile-noise">
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
          filter="url(#talent-profile-noise)"
          opacity="0.6"
        />
      </svg>

      {/* Inner glass border highlight along the top */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(to right, transparent 0%, rgba(245,240,232,0.45) 30%, rgba(245,240,232,0.45) 70%, transparent 100%)",
        }}
      />

      {/* Bottom fade — dissolves into the page background */}
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

export default TalentProfileBanner;
