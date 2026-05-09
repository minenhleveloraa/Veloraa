import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireApprovedCompany } from "@/lib/company/guard";
import { createClient } from "@/lib/supabase/server";
import NewJobForm from "@/components/company/NewJobForm";

export default async function NewJobPage() {
  const { profile, application } = await requireApprovedCompany();

  const companyPlan = application?.selected_plan ?? "free";
  const cardCollected = application?.card_collected === true;

  // Count existing non-rejected jobs for quota display
  const supabase = await createClient();
  const { count } = await supabase
    .from("company_jobs")
    .select("id", { count: "exact", head: true })
    .eq("company_id", profile.id)
    .not("status", "eq", "rejected");

  const existingJobCount = count ?? 0;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 sm:px-6 lg:px-10">
      <Link
        href="/company/jobs"
        className="mb-6 inline-flex items-center gap-1.5 text-xs text-body transition-colors hover:text-heading font-raleway"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to jobs
      </Link>

      <span className="mb-2 inline-block text-[11px] uppercase tracking-[0.08em] text-accent font-jetbrains">
        New job post
      </span>
      <h1 className="text-3xl font-bold text-heading font-raleway">
        Describe the role
      </h1>
      <p className="mt-2 max-w-xl text-sm text-body font-raleway">
        The more specific you are, the better our matches. Takes about 4
        minutes.
      </p>

      <div className="mt-8">
        <NewJobForm
          companyPlan={companyPlan}
          cardCollected={cardCollected}
          existingJobCount={existingJobCount}
        />
      </div>
    </div>
  );
}
