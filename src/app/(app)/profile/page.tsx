import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types/db";

/**
 * Central routing hub for authenticated users.
 * - If no role yet → choose-role screen.
 * - Talent + stage 0 → /talent/onboarding/stage-1
 * - Talent + stage 1 submitted → (stub) /talent/dashboard placeholder.
 * - Company → (stub) /company placeholder for now.
 */
export default async function ProfileRouter() {
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

  // No role yet (e.g. OAuth signup without role query param).
  if (!profile?.role) {
    return (
      <div className="mx-auto max-w-xl px-6 pb-24 pt-32 text-center lg:px-8">
        <span className="mb-3 inline-block text-xs uppercase tracking-[0.08em] text-accent font-jetbrains">
          Quick step
        </span>
        <h1 className="text-3xl font-bold text-heading sm:text-4xl font-raleway">
          How will you use <span className="text-accent">Veloraa</span>?
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-body font-libre italic">
          Pick one to continue. You can&apos;t change this later without
          support.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link
            href="/profile/choose-role?role=talent"
            className="rounded-2xl border-[3px] border-accent bg-surface p-8 text-left transition-shadow hover:shadow-lg hover:shadow-glow-soft"
          >
            <p className="text-xs uppercase tracking-[0.08em] text-accent font-jetbrains">
              I&apos;m here to —
            </p>
            <p className="mt-2 text-xl font-bold text-heading font-raleway">
              Find world-class work
            </p>
            <p className="mt-2 text-sm text-body font-raleway">
              Join as talent. Pass our vetting once, get matched to top roles.
            </p>
          </Link>
          <Link
            href="/profile/choose-role?role=company"
            className="rounded-2xl border border-edge bg-surface p-8 text-left transition-shadow hover:shadow-lg hover:shadow-glow-soft"
          >
            <p className="text-xs uppercase tracking-[0.08em] text-body font-jetbrains">
              I&apos;m here to —
            </p>
            <p className="mt-2 text-xl font-bold text-heading font-raleway">
              Hire pre-vetted talent
            </p>
            <p className="mt-2 text-sm text-body font-raleway">
              Join as a company. Get AI-matched shortlists in 48 hours.
            </p>
          </Link>
        </div>
      </div>
    );
  }

  // Talent routing
  if (profile.role === "talent") {
    if (profile.onboarding_stage < 1) {
      redirect("/talent/onboarding/stage-1");
    }
    if (profile.onboarding_stage < 2) {
      redirect("/talent/onboarding/stage-2");
    }
    redirect("/talent/dashboard");
  }

  // Company routing
  if (profile.role === "company") {
    if ((profile.onboarding_stage ?? 0) < 1) {
      redirect("/company/onboarding/stage-1");
    }
    redirect("/company/dashboard");
  }

  redirect("/company/dashboard");
}
