import { redirect } from "next/navigation";
import TalentShell from "@/components/talent/TalentShell";
import RealtimeProvider from "@/components/realtime/RealtimeProvider";
import { createClient } from "@/lib/supabase/server";
import { unreadCountForUser } from "@/lib/messaging/queries";

export default async function TalentShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("id", user.id)
    .maybeSingle();
  if (profileRow?.role !== "talent") redirect("/profile");

  const { data: appRow } = await supabase
    .from("talent_applications")
    .select("review_status, interview_status")
    .eq("user_id", user.id)
    .maybeSingle();

  const isLive =
    appRow?.review_status === "approved" &&
    appRow?.interview_status === "passed";

  const messagesUnread = await unreadCountForUser(user.id);

  return (
    <RealtimeProvider userId={user.id} initialMessagesUnread={messagesUnread}>
      <TalentShell
        isLive={isLive}
        userEmail={profileRow.email ?? null}
        userName={profileRow.full_name ?? null}
        messagesUnread={messagesUnread}
      >
        {children}
      </TalentShell>
    </RealtimeProvider>
  );
}
