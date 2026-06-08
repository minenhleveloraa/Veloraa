import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Clock3,
  Globe2,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import JobApplicationLauncher from "@/components/talent/jobs/JobApplicationLauncher";
import type {
  CompanyApplication,
  CompanyJob,
  JobApplication,
  Profile,
} from "@/lib/types/db";

export const metadata = { title: "Job role - Veloraa" };

export default async function TalentJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const profile = profileRow as Pick<Profile, "role"> | null;
  if (profile?.role !== "talent") redirect("/profile");

  const admin = createAdminClient();
  const [{ data: jobRow }, { data: recommendationRow }, { data: applicationRow }] =
    await Promise.all([
      admin
        .from("company_jobs")
        .select("*")
        .eq("id", id)
        .eq("status", "published")
        .maybeSingle(),
      admin
        .from("job_recommendations")
        .select("note")
        .eq("job_id", id)
        .eq("talent_user_id", user.id)
        .maybeSingle(),
      admin
        .from("job_applications")
        .select("*")
        .eq("job_id", id)
        .eq("talent_user_id", user.id)
        .maybeSingle(),
    ]);

  if (!jobRow) redirect("/talent/jobs");
  const job = jobRow as CompanyJob;
  const application = applicationRow as JobApplication | null;

  const { data: companyRow } = await admin
    .from("company_applications")
    .select(
      "legal_name, website_url, company_size, hq_country, company_stage, industries, work_style"
    )
    .eq("user_id", job.company_id)
    .maybeSingle();
  const company = companyRow as
    | Pick<
        CompanyApplication,
        | "legal_name"
        | "website_url"
        | "company_size"
        | "hq_country"
        | "company_stage"
        | "industries"
        | "work_style"
      >
    | null;

  const companyName = company?.legal_name?.trim() || "Company";
  const postedDate = new Date(job.created_at).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-24 sm:px-6 sm:pt-28 lg:px-8">
      <Link
        href="/talent/jobs"
        className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-body transition-colors hover:text-accent font-raleway"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to jobs
      </Link>

      <section className="relative overflow-hidden rounded-[28px] border border-edge bg-surface p-5 shadow-[0_30px_90px_-58px_rgba(10,46,26,0.45)] sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-accent/12 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/8 px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-accent font-jetbrains">
                <Briefcase className="h-3.5 w-3.5" />
                Published role
              </span>
              {recommendationRow?.note && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/8 px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-accent font-jetbrains">
                  <Star className="h-3.5 w-3.5" />
                  Curated for you
                </span>
              )}
            </div>

            <h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight text-heading font-raleway sm:text-5xl">
              {job.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-body font-raleway">
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-accent" />
                {companyName}
              </span>
              <span className="inline-flex items-center gap-1.5">
                {job.work_arrangement === "remote" ? (
                  <Globe2 className="h-4 w-4 text-accent" />
                ) : (
                  <MapPin className="h-4 w-4 text-accent" />
                )}
                {job.location || job.work_arrangement}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-4 w-4 text-accent" />
                Posted {postedDate}
              </span>
            </div>

            {recommendationRow?.note && (
              <div className="mt-6 rounded-2xl border border-accent/25 bg-accent/5 p-4">
                <p className="text-[10px] uppercase tracking-[0.14em] text-accent font-jetbrains">
                  Veloraa note
                </p>
                <p className="mt-2 text-sm leading-relaxed text-heading font-raleway italic">
                  {recommendationRow.note}
                </p>
              </div>
            )}
          </div>

          <aside className="rounded-2xl border border-edge bg-page-alt p-4 sm:p-5 lg:sticky lg:top-24">
            <p className="text-[10px] uppercase tracking-[0.14em] text-subtle font-jetbrains">
              Intro status
            </p>
            <p className="mt-2 text-sm leading-relaxed text-body font-raleway">
              Send a focused note to the hiring team. A conversation opens only
              if they shortlist your profile.
            </p>
            <JobApplicationLauncher
              jobId={job.id}
              jobTitle={job.title}
              companyName={companyName}
              initialStatus={application?.status ?? null}
              className="mt-4 w-full"
            />
            {application?.status && (
              <p className="mt-3 text-[11px] leading-relaxed text-subtle font-raleway">
                Current status:{" "}
                <span className="font-semibold text-heading">
                  {application.status}
                </span>
              </p>
            )}
          </aside>
        </div>
      </section>

      <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FactCard label="Seniority" value={job.seniority} />
        <FactCard label="Type" value={job.employment_type} />
        <FactCard label="Work style" value={job.work_arrangement} />
        <FactCard label="Compensation" value={job.salary_range || "Shared later"} />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <main className="space-y-6">
          <section className="rounded-2xl border border-edge bg-surface p-5 sm:p-6">
            <h2 className="text-lg font-bold text-heading font-raleway">
              Role overview
            </h2>
            <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-body font-raleway">
              {job.description}
            </div>
          </section>

          {job.benefits && (
            <section className="rounded-2xl border border-edge bg-surface p-5 sm:p-6">
              <h2 className="text-lg font-bold text-heading font-raleway">
                Benefits and perks
              </h2>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-body font-raleway">
                {job.benefits}
              </p>
            </section>
          )}
        </main>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-edge bg-surface p-5">
            <h2 className="text-sm font-bold text-heading font-raleway">
              Skills requested
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {job.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-pill-bg px-3 py-1 text-xs font-medium text-pill-text font-raleway"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-edge bg-surface p-5">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <h2 className="text-sm font-bold text-heading font-raleway">
                Company signal
              </h2>
            </div>
            <div className="mt-4 space-y-3 text-sm text-body font-raleway">
              <InfoRow label="Company" value={companyName} />
              <InfoRow label="HQ" value={company?.hq_country ?? "Remote-first"} />
              <InfoRow label="Stage" value={company?.company_stage ?? "Not listed"} />
              <InfoRow label="Team size" value={company?.company_size ?? "Not listed"} />
              <InfoRow label="Work style" value={company?.work_style ?? job.work_arrangement} />
            </div>
            {(company?.industries?.length ?? 0) > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {company!.industries.slice(0, 4).map((industry) => (
                  <span
                    key={industry}
                    className="rounded-full border border-edge bg-page-alt px-2.5 py-1 text-[11px] text-heading font-raleway"
                  >
                    {industry}
                  </span>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-accent/25 bg-accent/5 p-5">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <div>
                <p className="text-sm font-bold text-heading font-raleway">
                  Strong intros are specific
                </p>
                <p className="mt-1 text-xs leading-relaxed text-body font-raleway">
                  Mention the kind of work you want to own, relevant proof from
                  your profile, and what you would like to explore with the
                  company.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function FactCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-edge bg-surface p-4">
      <p className="text-[10px] uppercase tracking-[0.14em] text-subtle font-jetbrains">
        {label}
      </p>
      <p className="mt-2 truncate text-sm font-semibold text-heading font-raleway">
        {value}
      </p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-edge pb-2 last:border-0 last:pb-0">
      <span className="text-xs text-subtle font-jetbrains">{label}</span>
      <span className="text-right text-xs font-semibold text-heading font-raleway">
        {value}
      </span>
    </div>
  );
}
