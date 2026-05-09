import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { Profile, TalentApplication } from "@/lib/types/db";
import Stage1Wizard from "@/components/talent/Stage1Wizard";

export const metadata: Metadata = {
  title: "Stage 1 — Tell us about you — Veloraa",
};

export default async function Stage1Page() {
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

  if (!profile) redirect("/profile");
  if (profile.role !== "talent") redirect("/profile");
  if (profile.onboarding_stage >= 1) redirect("/talent/dashboard");

  const { data: appRow } = await supabase
    .from("talent_applications")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  const existing = appRow as TalentApplication | null;

  return (
    <div className="mx-auto max-w-3xl px-6 pb-24 pt-28 lg:px-8">
      <div className="mb-10">
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.08em] text-accent font-jetbrains">
            Stage 01 of 05
          </span>
          <span className="rounded-full bg-pill-bg px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-pill-text font-jetbrains">
            ~5 min
          </span>
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-heading sm:text-4xl font-raleway">
          Tell us about <span className="text-accent">you.</span>
        </h1>
        <p className="mt-3 text-base leading-relaxed text-body font-libre italic">
          We build your profile from your own words. You can edit later, but
          take your time — this is what employers see first.
        </p>
      </div>

      <Stage1Wizard
        userId={user.id}
        fullName={profile.full_name ?? ""}
        initial={existing}
      />
    </div>
  );
}
