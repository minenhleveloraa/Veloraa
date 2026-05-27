import CompanyShell from "@/components/company/CompanyShell";
import RealtimeProvider from "@/components/realtime/RealtimeProvider";
import { planFor } from "@/lib/company/options";
import { requireCompany } from "@/lib/company/guard";
import { createClient } from "@/lib/supabase/server";
import { unreadCountForUser } from "@/lib/messaging/queries";

export default async function CompanyShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, application } = await requireCompany();

  const planName = planFor(application?.selected_plan)?.name ?? "Free";
  const reviewStatus = application?.review_status ?? "pending";

  // Only approved companies have messaging enabled — no point scanning
  // the table otherwise.
  const messagesUnread =
    reviewStatus === "approved" ? await unreadCountForUser(profile.id) : 0;

  // Sign the logo URL once at the layout level so the avatar control,
  // the dropdown, and the mobile sheet all share it without duplicate
  // round-trips.
  let logoUrl: string | null = null;
  if (application?.logo_path) {
    const supabase = await createClient();
    const { data } = await supabase.storage
      .from("company-logos")
      .createSignedUrl(application.logo_path, 60 * 10);
    logoUrl = data?.signedUrl ?? null;
  }

  return (
    <RealtimeProvider userId={profile.id} initialMessagesUnread={messagesUnread}>
      <CompanyShell
        companyName={application?.legal_name ?? null}
        planName={planName}
        reviewStatus={reviewStatus}
        userEmail={profile.email ?? null}
        userName={profile.full_name ?? null}
        logoUrl={logoUrl}
        messagesUnread={messagesUnread}
      >
        {children}
      </CompanyShell>
    </RealtimeProvider>
  );
}
