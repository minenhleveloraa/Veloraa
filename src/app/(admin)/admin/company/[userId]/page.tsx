import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Calendar,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdmin } from "@/lib/admin";
import type { CompanyApplication, Profile } from "@/lib/types/db";
import DecisionPanel from "@/components/admin/DecisionPanel";
import MessageUserButton from "@/components/admin/MessageUserButton";
import {
  COMPANY_SIZES,
  COMPANY_STAGES,
  ENG_CULTURES,
  HIRING_METHODS,
  HIRING_URGENCIES,
  HIRING_VOLUMES,
  SALARY_RANGES,
  WORK_STYLES,
  labelFor,
  planFor,
} from "@/lib/company/options";

export default async function AdminCompanyDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/");

  const { userId } = await params;
  const supabase = createAdminClient();

  const [profileRes, appRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase
      .from("company_applications")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const profile = (profileRes.data ?? null) as Profile | null;
  const app = (appRes.data ?? null) as CompanyApplication | null;
  if (!profile || !app) notFound();

  // Signed logo URL (10 minutes).
  let logoUrl: string | null = null;
  if (app.logo_path) {
    const { data } = await supabase.storage
      .from("company-logos")
      .createSignedUrl(app.logo_path, 60 * 10);
    logoUrl = data?.signedUrl ?? null;
  }

  const companyName = app.legal_name ?? "Unnamed company";
  const plan = planFor(app.selected_plan);
  const reapplyDefault = new Date();
  reapplyDefault.setMonth(reapplyDefault.getMonth() + 3);
  const reapplyDefaultStr = reapplyDefault.toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link
          href="/admin?type=company"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.08em] text-body transition-colors hover:text-heading font-jetbrains"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to queue
        </Link>
        <MessageUserButton userId={userId} />
      </div>

      {/* Header card */}
      <div className="mb-6 rounded-2xl border border-edge bg-surface p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-pill-bg text-accent">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt={`${companyName} logo`}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <Building2 className="h-6 w-6" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-heading sm:text-3xl font-raleway">
                  {companyName}
                </h1>
                <p className="mt-1 text-sm text-body font-raleway">
                  {labelFor(COMPANY_STAGES, app.company_stage)} ·{" "}
                  {labelFor(COMPANY_SIZES, app.company_size)}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-body font-jetbrains">
              {profile.email && (
                <IconText icon={<Mail className="h-3.5 w-3.5" />}>
                  {profile.email}
                </IconText>
              )}
              {app.website_url && (
                <IconText icon={<Globe className="h-3.5 w-3.5" />}>
                  <a
                    href={app.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline-offset-2 hover:underline"
                  >
                    {app.website_url}
                  </a>
                </IconText>
              )}
              {app.hq_country && (
                <IconText icon={<MapPin className="h-3.5 w-3.5" />}>
                  {app.hq_country}
                </IconText>
              )}
              {app.stage_1_submitted_at && (
                <IconText icon={<Calendar className="h-3.5 w-3.5" />}>
                  Submitted{" "}
                  {new Date(app.stage_1_submitted_at).toLocaleDateString()}
                </IconText>
              )}
            </div>
          </div>

          {plan && (
            <div className="flex shrink-0 items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3">
              <Sparkles className="h-5 w-5 text-accent" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.08em] text-accent font-jetbrains">
                  Selected plan
                </p>
                <p className="text-2xl font-bold text-heading font-raleway">
                  {plan.name}
                </p>
                <p className="text-[11px] text-body font-raleway">
                  {plan.price} {plan.requiresCard ? "· card at first post" : ""}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Previous decision banner */}
        {app.review_status !== "pending" && (
          <div
            className={`mt-6 rounded-xl border p-4 text-sm ${
              app.review_status === "approved"
                ? "border-accent/30 bg-accent/5 text-accent"
                : "border-red-500/30 bg-red-500/5 text-red-600"
            }`}
          >
            <p className="text-[11px] uppercase tracking-[0.08em] font-jetbrains">
              Previously {app.review_status}
              {app.review_decision_at
                ? ` · ${new Date(app.review_decision_at).toLocaleDateString()}`
                : ""}
            </p>
            {app.review_reason && (
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-heading font-raleway">
                {app.review_reason}
              </p>
            )}
            {app.reapply_after && (
              <p className="mt-2 text-xs font-jetbrains">
                Reapply after:{" "}
                {new Date(app.reapply_after).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Two-column body */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT — detail sections */}
        <div className="space-y-6 lg:col-span-2">
          <Section title="Industries">
            {app.industries.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {app.industries.map((i) => (
                  <span
                    key={i}
                    className="rounded-full bg-pill-bg px-3 py-1 text-xs font-medium text-accent font-raleway"
                  >
                    {i}
                  </span>
                ))}
              </div>
            ) : (
              <Empty />
            )}
          </Section>

          <Section title={`Roles they hire · ${app.roles_hiring.length}`}>
            {app.roles_hiring.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {app.roles_hiring.map((r) => (
                  <span
                    key={r}
                    className="rounded-full bg-pill-bg px-3 py-1 text-xs font-medium text-accent font-raleway"
                  >
                    {r}
                  </span>
                ))}
              </div>
            ) : (
              <Empty />
            )}
          </Section>

          <Section title="How they work">
            <div className="grid gap-3 sm:grid-cols-2">
              <KV
                k="Work style"
                v={labelFor(WORK_STYLES, app.work_style)}
              />
              <KV
                k="Engineering culture"
                v={labelFor(ENG_CULTURES, app.eng_culture)}
              />
              <KV
                k="Hiring regions"
                v={app.hiring_regions.join(", ") || "—"}
                wide
              />
            </div>
          </Section>

          <Section title="Hiring situation">
            <div className="grid gap-3 sm:grid-cols-2">
              <KV
                k="Urgency"
                v={labelFor(HIRING_URGENCIES, app.hiring_urgency)}
              />
              <KV
                k="Volume (6mo)"
                v={labelFor(HIRING_VOLUMES, app.hiring_volume)}
              />
              <KV
                k="Salary range"
                v={labelFor(SALARY_RANGES, app.salary_range)}
              />
              <KV
                k="Current method"
                v={labelFor(HIRING_METHODS, app.hiring_method)}
              />
            </div>
          </Section>
        </div>

        {/* RIGHT — sidebar */}
        <aside className="space-y-6">
          <Section title="Company">
            <div className="space-y-3 text-sm">
              <KV k="Legal name" v={app.legal_name ?? "—"} />
              <KV k="Size" v={labelFor(COMPANY_SIZES, app.company_size)} />
              <KV k="Stage" v={labelFor(COMPANY_STAGES, app.company_stage)} />
              <KV k="HQ" v={app.hq_country ?? "—"} />
            </div>
          </Section>

          {app.website_url && (
            <Section title="Website">
              <a
                href={app.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 p-4 transition-opacity hover:opacity-80"
              >
                <Globe className="h-5 w-5 text-accent" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-heading font-raleway">
                    {app.website_url.replace(/^https?:\/\//, "")}
                  </p>
                  <p className="text-[11px] text-subtle font-jetbrains">
                    Opens in new tab
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-body" />
              </a>
            </Section>
          )}

          {logoUrl && (
            <Section title="Logo">
              <div className="flex items-center justify-center rounded-xl border border-edge bg-page-alt p-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoUrl}
                  alt={`${companyName} logo`}
                  className="max-h-24 w-auto"
                />
              </div>
              <p className="mt-2 text-[11px] text-subtle font-jetbrains">
                {app.logo_filename ?? "logo"} · signed URL expires in 10 min
              </p>
            </Section>
          )}
        </aside>
      </div>

      {/* Decision panel */}
      <div className="mt-10">
        <DecisionPanel
          userId={userId}
          applicantName={companyName}
          currentStatus={app.review_status}
          reapplyDefault={reapplyDefaultStr}
          applicantType="company"
        />
      </div>
    </div>
  );
}

// =====================================================================
// UI bits
// =====================================================================

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-edge bg-surface p-6">
      <h2 className="mb-4 text-[11px] uppercase tracking-[0.08em] text-subtle font-jetbrains">
        {title}
      </h2>
      {children}
    </section>
  );
}

function IconText({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-accent">{icon}</span>
      {children}
    </span>
  );
}

function KV({
  k,
  v,
  wide = false,
}: {
  k: string;
  v: string | null;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <p className="text-[10px] uppercase tracking-[0.12em] text-subtle font-jetbrains">
        {k}
      </p>
      <p className="mt-1 text-sm font-semibold text-heading font-raleway">
        {v || "—"}
      </p>
    </div>
  );
}

function Empty() {
  return (
    <p className="inline-flex items-center gap-1.5 text-sm text-subtle font-raleway">
      <Users className="h-3.5 w-3.5" />
      None provided
    </p>
  );
}
