import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/admin";
import MessagingPanelLive from "@/components/messaging/MessagingPanelLive";
import { listThreadsForAdmin } from "@/lib/messaging/queries";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Admin → Messages
 *
 * Central inbox for the Veloraa team. Surfaces every `admin_support` thread:
 * onboarding welcomes, company questions, talent check-ins. The inbox is
 * empty until approvals start happening or an admin explicitly opens a
 * conversation from `/admin/users`.
 */
export default async function AdminMessagesPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/");

  const threads = await listThreadsForAdmin(admin.id);
  const viewerInitials = (admin.email?.trim()?.[0] ?? "A").toUpperCase();

  return (
    <div className="fixed inset-x-0 top-16 bottom-0 bg-page">
      <MessagingPanelLive
        initialThreads={threads}
        viewerUserId={admin.id}
        viewerIsAdmin
        title="Inbox"
        description="All active conversations with talent and companies."
        viewer={{ name: admin.email ?? "Admin", initials: viewerInitials }}
        emptyThreadCopy={{
          title: "Nothing in the inbox yet",
          body: "Approve a company or start a conversation from the Users directory — it'll land here.",
        }}
      />
    </div>
  );
}
