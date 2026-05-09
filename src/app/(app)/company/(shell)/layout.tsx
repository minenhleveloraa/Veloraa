import CompanyShell from "@/components/company/CompanyShell";
import RealtimeProvider from "@/components/realtime/RealtimeProvider";
import { planFor } from "@/lib/company/options";
import { requireCompany } from "@/lib/company/guard";
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

  return (
    <RealtimeProvider userId={profile.id} initialMessagesUnread={messagesUnread}>
      <CompanyShell
        companyName={application?.legal_name ?? null}
        planName={planName}
        reviewStatus={reviewStatus}
        userEmail={profile.email ?? null}
        userName={profile.full_name ?? null}
        messagesUnread={messagesUnread}
      >
        {children}
      </CompanyShell>
    </RealtimeProvider>
  );
}
