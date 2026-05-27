import { requireApprovedCompany } from "@/lib/company/guard";
import { listThreadsForUser } from "@/lib/messaging/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import CompanyMessagesClient from "@/components/company/CompanyMessagesClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Company → Messages
 *
 * Every approved company gets an `admin_support` thread seeded with a welcome
 * message the moment their application is approved (see
 * `@/app/actions/admin#approveCompany`). That thread is their direct line to
 * the Veloraa team. Company↔candidate threads open lazily once the company
 * messages a candidate.
 */
export default async function CompanyMessagesPage() {
  const { profile, application } = await requireApprovedCompany();

  const companyName = application?.legal_name ?? profile.full_name ?? "Company";
  const viewerInitials = (
    profile.full_name?.trim()?.[0] ??
    profile.email?.trim()?.[0] ??
    "C"
  ).toUpperCase();

  const threads = await listThreadsForUser(profile.id);

  // Prefer the admin thread on first load so the viewer sees the welcome
  // message the moment they land on /messages.
  const initialThreadId =
    threads.find((t) => t.kind === "admin")?.id ?? threads[0]?.id;

  // Fetch published jobs for the interview scheduler
  const admin = createAdminClient();
  const { data: pubJobRows } = await admin
    .from("company_jobs")
    .select("id, title")
    .eq("company_id", profile.id)
    .eq("status", "published")
    .order("created_at", { ascending: false });
  const companyJobs = (pubJobRows ?? []).map((j: { id: string; title: string }) => ({
    id: j.id,
    title: j.title,
  }));

  // Full-viewport layout that sits under the fixed company top nav (h-16)
  // and above the fixed mobile bottom-tab bar (~4.5rem + safe-area).
  return (
    <div className="fixed inset-x-0 top-16 bottom-[calc(4.5rem_+_env(safe-area-inset-bottom))] bg-page lg:bottom-0">
      <CompanyMessagesClient
        threads={threads}
        viewerUserId={profile.id}
        viewerName={companyName}
        viewerInitials={viewerInitials}
        companyJobs={companyJobs}
        initialThreadId={initialThreadId}
      />
    </div>
  );
}
