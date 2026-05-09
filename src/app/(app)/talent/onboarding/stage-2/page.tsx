import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, TalentAiAnalysis } from "@/lib/types/db";
import AiAnalysisRunner from "@/components/talent/AiAnalysisRunner";
import AnalysisResults from "@/components/talent/AnalysisResults";

export const metadata = {
  title: "AI Analysis — Veloraa",
};

export default async function TalentStage2Page() {
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
  if (profile.role !== "talent") redirect("/profile");

  // Haven't even finished stage 1 yet — bounce back.
  if (profile.onboarding_stage < 1) {
    redirect("/talent/onboarding/stage-1");
  }

  const { data: analysisRow } = await supabase
    .from("talent_ai_analyses")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  const analysis = analysisRow as TalentAiAnalysis | null;

  // ------------------------------------------------------------
  // Already analyzed → show the results dashboard.
  // ------------------------------------------------------------
  if (analysis?.status === "ready") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <AnalysisResults analysis={analysis} />
      </div>
    );
  }

  // ------------------------------------------------------------
  // Otherwise (null | pending | failed) → kick off the runner.
  // ------------------------------------------------------------
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <AiAnalysisRunner initialError={analysis?.status === "failed" ? analysis.error : null} />
    </div>
  );
}
