import "server-only";

import { PLANS, type PlanId } from "@/lib/company/options";
import type { CompanyApplication } from "@/lib/types/db";

export const FREE_CANDIDATE_PREVIEW_LIMIT = 2;
export const CANDIDATE_POOL_ORDER_COLUMN = "created_at";

const PLAN_IDS = new Set<PlanId>(PLANS.map((plan) => plan.id));

type CompanyApplicationWithBilling = CompanyApplication & {
  subscription_plan?: string | null;
  subscription_status?: string | null;
};

function isPlanId(value: string | null | undefined): value is PlanId {
  return PLAN_IDS.has(value as PlanId);
}

export function getEffectiveCompanyPlanId(
  application: CompanyApplication | null | undefined
): PlanId {
  const app = application as CompanyApplicationWithBilling | null | undefined;

  if (app?.subscription_status === "active" && isPlanId(app.subscription_plan)) {
    return app.subscription_plan;
  }

  if (isPlanId(app?.selected_plan)) return app.selected_plan;
  return "free";
}

export function canBrowseFullCandidatePool(planId: PlanId): boolean {
  return planId === "growth" || planId === "scale";
}
