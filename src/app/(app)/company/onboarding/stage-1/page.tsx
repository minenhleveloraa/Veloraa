import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CompanyApplication, Profile } from "@/lib/types/db";
import CompanyWizard from "@/components/company/CompanyWizard";

export const metadata = {
  title: "Company onboarding — Veloraa",
  robots: { index: false, follow: false },
};

export default async function CompanyStage1Page() {
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

  // Only companies use this wizard.
  if (profile?.role !== "company") redirect("/profile");

  // Already submitted? Don't let them re-open the wizard — route to
  // dashboard where review status is shown.
  if ((profile?.onboarding_stage ?? 0) >= 1) redirect("/company/dashboard");

  const { data: existingRow } = await supabase
    .from("company_applications")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  const existing = (existingRow ?? null) as CompanyApplication | null;

  return (
    <CompanyWizard
      userId={user.id}
      prefilledName={profile?.full_name ?? null}
      existing={existing}
    />
  );
}
