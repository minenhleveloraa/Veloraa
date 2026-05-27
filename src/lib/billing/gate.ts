import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEffectivePlan, type PlanId } from "@/lib/billing/plans";

export type Feature =
  | "post_job"
  | "talent_search"
  | "full_candidate_profile"
  | "messaging_open"
  | "pipeline"
  | "interview_scheduling"
  | "watchlist"
  | "talent_alerts"
  | "analytics"
  | "company_profile"
  | "team_seats"
  | "priority_matching"
  | "custom_reports";

/**
 * Plans that grant each feature. "post_job" is unique because Free is
 * allowed up to one job ever (see canAccess for the count check).
 */
const FEATURE_GATES: Record<Feature, PlanId[]> = {
  post_job: ["free", "growth", "scale"],
  talent_search: ["growth", "scale"],
  full_candidate_profile: ["growth", "scale"],
  messaging_open: ["growth", "scale"],
  pipeline: ["growth", "scale"],
  interview_scheduling: ["growth", "scale"],
  watchlist: ["growth", "scale"],
  talent_alerts: ["growth", "scale"],
  analytics: ["growth", "scale"],
  company_profile: ["growth", "scale"],
  team_seats: ["scale"],
  priority_matching: ["scale"],
  custom_reports: ["scale"],
};

/**
 * The minimum plan required to access a feature. Used by
 * `<FeatureLock>` to render an accurate upsell label.
 */
export const REQUIRED_PLAN: Record<Feature, PlanId> = {
  post_job: "free",
  talent_search: "growth",
  full_candidate_profile: "growth",
  messaging_open: "growth",
  pipeline: "growth",
  interview_scheduling: "growth",
  watchlist: "growth",
  talent_alerts: "growth",
  analytics: "growth",
  company_profile: "growth",
  team_seats: "scale",
  priority_matching: "scale",
  custom_reports: "scale",
};

export async function canAccess(feature: Feature): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: employer } = await supabase
    .from("company_applications")
    .select(
      "subscription_plan, subscription_status, current_period_end, has_used_free_post"
    )
    .eq("user_id", user.id)
    .single();

  if (!employer) return false;

  const effective = getEffectivePlan(employer);

  // Free plan + post_job: only allowed if they haven't used the free post.
  if (feature === "post_job" && effective.id === "free") {
    return !employer.has_used_free_post;
  }

  return FEATURE_GATES[feature].includes(effective.id);
}

/**
 * Server-side guard: redirect to the subscription page (with the
 * requested feature in the query string) if the user lacks access.
 * Use at the top of any protected page or server action.
 */
export async function assertFeature(feature: Feature): Promise<void> {
  const ok = await canAccess(feature);
  if (!ok) {
    redirect(`/company/subscription?upgrade=${feature}`);
  }
}

export function getFeatureGates() {
  return FEATURE_GATES;
}
