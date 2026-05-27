import type { PlanId } from "@/lib/billing/plans";

/**
 * Per-plan quotas for non-binary features. Use `Number.POSITIVE_INFINITY`
 * for "unlimited" so callers can compare with `<` cleanly.
 */
export interface PlanQuotas {
  watchlist: number;
  talentAlerts: number;
  teamSeats: number;
  /** Active jobs allowed at a time (excluding rejected). */
  activeJobs: number;
}

export const QUOTAS: Record<PlanId, PlanQuotas> = {
  free: {
    watchlist: 0,
    talentAlerts: 0,
    teamSeats: 1,
    activeJobs: 1,
  },
  growth: {
    watchlist: 50,
    talentAlerts: 3,
    teamSeats: 1,
    activeJobs: Number.POSITIVE_INFINITY,
  },
  scale: {
    watchlist: Number.POSITIVE_INFINITY,
    talentAlerts: Number.POSITIVE_INFINITY,
    teamSeats: 5,
    activeJobs: Number.POSITIVE_INFINITY,
  },
};

/**
 * Returns true if `nextCount` (current count + 1) is still within the
 * plan's quota for the given resource.
 */
export function withinQuota(
  plan: PlanId,
  resource: keyof PlanQuotas,
  nextCount: number
): boolean {
  const cap = QUOTAS[plan][resource];
  if (!Number.isFinite(cap)) return true;
  return nextCount <= cap;
}

/** Human-readable label for the cap, e.g. "50" or "Unlimited". */
export function quotaLabel(
  plan: PlanId,
  resource: keyof PlanQuotas
): string {
  const cap = QUOTAS[plan][resource];
  if (!Number.isFinite(cap)) return "Unlimited";
  return String(cap);
}
