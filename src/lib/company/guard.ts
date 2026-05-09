import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CompanyApplication, Profile } from "@/lib/types/db";

export interface CompanyContext {
  profile: Profile;
  application: CompanyApplication | null;
}

/**
 * Shared server-side guard for the authenticated company area.
 *
 * - Redirects signed-out users to `/sign-in`.
 * - Redirects non-company roles to `/profile` (the role picker).
 * - Redirects companies who haven't completed onboarding to the wizard.
 * - Returns the caller's profile + company application.
 */
export async function requireCompany(): Promise<CompanyContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  const profile = profileRow as Profile | null;
  if (!profile) redirect("/sign-in");
  if (profile.role !== "company") redirect("/profile");
  if ((profile.onboarding_stage ?? 0) < 1) {
    redirect("/company/onboarding/stage-1");
  }

  const { data: appRow } = await supabase
    .from("company_applications")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  const application = (appRow as CompanyApplication | null) ?? null;

  return { profile, application };
}

/**
 * Same as `requireCompany`, but additionally redirects non-approved companies
 * back to the dashboard. Use this to gate features that only unlock once
 * Veloraa has reviewed and approved the company.
 */
export async function requireApprovedCompany(): Promise<CompanyContext> {
  const ctx = await requireCompany();
  if (ctx.application?.review_status !== "approved") {
    redirect("/company/dashboard");
  }
  return ctx;
}
