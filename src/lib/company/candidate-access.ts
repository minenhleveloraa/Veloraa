import "server-only";

import { getEffectivePlan, type PlanId } from "@/lib/billing/plans";
import type { CompanyApplication } from "@/lib/types/db";

export const FREE_CANDIDATE_PREVIEW_LIMIT = 2;
export const CANDIDATE_POOL_ORDER_COLUMN = "created_at";

/**
 * Thin wrapper around the canonical {@link getEffectivePlan} resolver.
 * Kept for back-compat with existing call sites.
 */
export function getEffectiveCompanyPlanId(
  application: CompanyApplication | null | undefined
): PlanId {
  return getEffectivePlan(
    application as unknown as Parameters<typeof getEffectivePlan>[0]
  ).id;
}

export function canBrowseFullCandidatePool(planId: PlanId): boolean {
  return planId === "growth" || planId === "scale";
}
