import "server-only";
import { createClient } from "@/lib/supabase/server";

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

const FEATURE_GATES: Record<Feature, ("free" | "growth" | "scale")[]> = {
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

export async function canAccess(feature: Feature): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: employer } = await supabase
    .from("company_applications")
    .select("subscription_plan, subscription_status, has_used_free_post")
    .eq("user_id", user.id)
    .single();

  if (!employer) return false;

  const plan = employer.subscription_plan as string;
  const status = employer.subscription_status as string;

  const hasActiveAccess = status === "active" || status === "free";
  if (!hasActiveAccess) return false;

  if (feature === "post_job" && plan === "free") {
    return !employer.has_used_free_post;
  }

  return FEATURE_GATES[feature].includes(plan as "free" | "growth" | "scale");
}

export function getFeatureGates() {
  return FEATURE_GATES;
}
