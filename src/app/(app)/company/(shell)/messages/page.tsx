import { requireApprovedCompany } from "@/lib/company/guard";
import MessagingPanelLive from "@/components/messaging/MessagingPanelLive";
import { listThreadsForUser } from "@/lib/messaging/queries";

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

  // Full-viewport layout that sits under the fixed company top nav (h-16)
  // and above the fixed mobile bottom-tab bar (~4.5rem + safe-area).
  return (
    <div className="fixed inset-x-0 top-16 bottom-[calc(4.5rem_+_env(safe-area-inset-bottom))] bg-page lg:bottom-0">
      <MessagingPanelLive
        initialThreads={threads}
        viewerUserId={profile.id}
        title="Messages"
        description="Talk to the Veloraa team and the candidates we match you with."
        viewer={{ name: companyName, initials: viewerInitials }}
        scheduleKinds={["candidate"]}
        emptyThreadCopy={{
          title: "Pick a conversation",
          body: "Start with the Veloraa team on the left — they'll help you get the most out of the platform.",
        }}
        initialThreadId={initialThreadId}
      />
    </div>
  );
}
