import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, Briefcase, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import TalentRouteFrame from "@/components/talent/TalentRouteFrame";
import JobsBoardClient, {
  type JobCard,
} from "@/components/talent/jobs/JobsBoardClient";
import type { CompanyJob, Profile } from "@/lib/types/db";

export const metadata = { title: "Jobs · Veloraa" };

export default async function TalentJobsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  // Verify talent role
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const profile = profileRow as Pick<Profile, "role"> | null;
  if (!profile || profile.role !== "talent") redirect("/profile");

  // 1. All published jobs + recommendations for this talent in parallel
  const [{ data: jobRows }, { data: recRows }] = await Promise.all([
    supabase
      .from("company_jobs")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false }),
    supabase
      .from("job_recommendations")
      .select("job_id, note")
      .eq("talent_user_id", user.id),
  ]);

  const jobs = (jobRows ?? []) as CompanyJob[];
  const recs = (recRows ?? []) as { job_id: string; note: string | null }[];

  // 2. Resolve company names from company_applications
  const uniqueCompanyIds = [...new Set(jobs.map((j) => j.company_id))];
  let companyNames: Map<string, string> = new Map();

  if (uniqueCompanyIds.length > 0) {
    const { data: companyApps } = await supabase
      .from("company_applications")
      .select("user_id, legal_name")
      .in("user_id", uniqueCompanyIds);

    companyNames = new Map(
      ((companyApps ?? []) as { user_id: string; legal_name: string | null }[])
        .filter((c) => !!c.legal_name)
        .map((c) => [c.user_id, c.legal_name!])
    );
  }

  // 3. Build the merged list — recommended jobs surface first
  const recMap = new Map(recs.map((r) => [r.job_id, r.note]));

  const cards: JobCard[] = jobs.map((j) => ({
    id: j.id,
    company_id: j.company_id,
    company_name: companyNames.get(j.company_id) ?? "Company",
    title: j.title,
    role_category: j.role_category,
    seniority: j.seniority,
    employment_type: j.employment_type,
    work_arrangement: j.work_arrangement,
    location: j.location,
    salary_range: j.salary_range,
    description: j.description,
    skills: j.skills,
    benefits: j.benefits,
    created_at: j.created_at,
    recommended: recMap.has(j.id),
    recommendation_note: recMap.get(j.id) ?? null,
  }));

  // Recommended first, then the rest ordered by newest
  cards.sort((a, b) => {
    if (a.recommended && !b.recommended) return -1;
    if (!a.recommended && b.recommended) return 1;
    return 0;
  });

  // Stats
  const totalJobs = cards.length;
  const remoteCount = cards.filter((c) =>
    c.work_arrangement?.toLowerCase().includes("remote")
  ).length;
  const curatedCount = cards.filter((c) => c.recommended).length;

  return (
    <TalentRouteFrame
      eyebrow="Talent jobs"
      title="Available jobs matched to your profile"
      description="These are the roles on Veloraa right now. Roles personally curated for you are marked with a star and surface at the top."
      icon={Briefcase}
      actions={[
        { href: "/talent/messages", label: "Open messages" },
        { href: "/talent/invites", label: "Review invites" },
      ]}
      stats={[
        {
          label: "Open roles",
          value: String(totalJobs).padStart(2, "0"),
          detail: "Published on Veloraa",
        },
        {
          label: "Remote-friendly",
          value: String(remoteCount).padStart(2, "0"),
          detail: "Open to distributed talent",
        },
        {
          label: "Curated for you",
          value: String(curatedCount).padStart(2, "0"),
          detail: "Hand-picked by the Veloraa team",
        },
      ]}
    >
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.9fr)]">
        <JobsBoardClient jobs={cards} />

        <aside className="space-y-3 sm:space-y-4">
          <section className="rounded-xl border border-edge bg-surface p-4 sm:rounded-2xl sm:p-5">
            <p className="text-[10px] uppercase tracking-[0.14em] text-accent font-jetbrains sm:text-[11px] sm:tracking-[0.16em]">
              How ranking works
            </p>
            <ul className="mt-3 space-y-2.5 sm:mt-4 sm:space-y-3">
              <li className="flex gap-2.5 sm:gap-3">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent sm:h-4 sm:w-4" />
                <p className="text-[13px] leading-relaxed text-body font-raleway sm:text-sm">
                  Roles marked &quot;Curated&quot; have been personally selected
                  by the Veloraa team based on your skills and experience.
                </p>
              </li>
              <li className="flex gap-2.5 sm:gap-3">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent sm:h-4 sm:w-4" />
                <p className="text-[13px] leading-relaxed text-body font-raleway sm:text-sm">
                  Remote flexibility and compensation alignment are weighted
                  early so you don&apos;t waste time on low-fit openings.
                </p>
              </li>
            </ul>
          </section>

          <section className="rounded-xl border border-edge bg-surface p-4 sm:rounded-2xl sm:p-5">
            <p className="text-[10px] uppercase tracking-[0.14em] text-subtle font-jetbrains sm:text-[11px] sm:tracking-[0.16em]">
              Best next move
            </p>
            <p className="mt-2.5 text-[13px] leading-relaxed text-body font-raleway sm:mt-3 sm:text-sm">
              If a role looks right, tap the card to expand it and read the
              full description. Then message the Veloraa team for hiring
              context before you commit.
            </p>
            <Link
              href="/talent/messages"
              className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-accent transition-opacity hover:opacity-80 font-raleway sm:mt-4 sm:text-xs"
            >
              Go to messages
              <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </Link>
          </section>
        </aside>
      </div>
    </TalentRouteFrame>
  );
}
