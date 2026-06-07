import { listThreadsForUser } from "@/lib/messaging/queries";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TalentMessagesClient from "@/components/talent/TalentMessagesClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Talent → Messages
 *
 * Live candidates get an `admin_support` thread with a welcome message when
 * the interview is passed (see `passInterview` in admin actions), mirroring
 * company approval. `company_candidate` threads appear when a vetted
 * employer reaches out.
 */
export default async function TalentMessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "talent") redirect("/profile");

  const displayName = profile.full_name?.trim() || profile.email?.trim() || "Talent";
  const viewerInitials = (
    profile.full_name?.trim()?.[0] ??
    profile.email?.trim()?.[0] ??
    "T"
  ).toUpperCase();

  const threads = await listThreadsForUser(user.id);
  return (
    <div className="fixed inset-x-0 top-16 bottom-[calc(4.5rem_+_env(safe-area-inset-bottom))] bg-page lg:bottom-0">
      <TalentMessagesClient
        threads={threads}
        viewerUserId={user.id}
        viewerName={displayName}
        viewerInitials={viewerInitials}
      />
    </div>
  );
}
