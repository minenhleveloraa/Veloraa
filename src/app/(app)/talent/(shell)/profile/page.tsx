import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TalentRouteFrame from "@/components/talent/TalentRouteFrame";
import { FileText, Clock, CheckCircle, AlertCircle, EyeOff } from "lucide-react";
import ProfileUpdateForm from "@/components/talent/ProfileUpdateForm";
import { hideProfileForEdit, makeProfileLive } from "@/app/actions/talent-profile";
import LiveProfileBanners from "@/components/realtime/LiveProfileBanners";

export default async function TalentProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: app } = await supabase
    .from("talent_applications")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  if (!app || !profile) redirect("/talent/onboarding/stage-1");

  // Determine what to show based on review_status
  const isApproved = app.review_status === "approved";
  const isHidden = app.review_status === "hidden";
  const isPendingUpdate = app.review_status === "pending_update";
  const isRejected = app.review_status === "rejected";
  
  const displayAvatar = app.avatar_url;
  const displayName = profile.full_name || "Applicant";

  return (
    <TalentRouteFrame
      eyebrow="Profile & Visibility"
      title="Manage your talent profile"
      description="Update your information, manage visibility, and see how companies view you."
      icon={FileText}
    >
      <LiveProfileBanners
        initial={{
          review_status: app.review_status,
          review_reason: app.review_reason,
          technical_status: app.technical_status,
          interview_status: app.interview_status,
          previous_approved_state: app.previous_approved_state,
        }}
      >
      <div className="space-y-8">
        
        {/* Profile Header Block */}
        <div className="flex items-center gap-5 rounded-2xl border border-edge bg-surface p-6 shadow-sm">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-page-alt border border-edge flex items-center justify-center">
            {displayAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={displayAvatar} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-accent font-jetbrains">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-heading font-raleway">{displayName}</h2>
            <p className="mt-1 text-sm text-body font-raleway max-w-lg line-clamp-2">
              {app.headline || "No headline provided."}
            </p>
          </div>
        </div>

        {/* Status Banners */}
        {isApproved && (
          <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 p-4 text-accent">
            <CheckCircle className="h-5 w-5" />
            <div>
              <p className="text-sm font-semibold font-raleway">Your profile is live</p>
              <p className="text-xs font-jetbrains mt-1 opacity-80">Visible to matched companies in search.</p>
            </div>
            <form action={hideProfileForEdit} className="ml-auto">
              <button className="rounded-lg bg-surface px-4 py-2 text-xs font-semibold text-heading shadow-sm border border-edge transition-hover hover:border-accent font-raleway">
                Hide Profile to Edit
              </button>
            </form>
          </div>
        )}

        {isHidden && (
          <div className="flex items-center gap-3 rounded-xl border border-edge bg-surface p-4 text-heading shadow-sm">
            <EyeOff className="h-5 w-5 text-subtle" />
            <div>
              <p className="text-sm font-semibold font-raleway">Your profile is hidden</p>
              <p className="text-xs font-jetbrains mt-1 text-subtle">You are currently making edits and are not visible to companies.</p>
            </div>
            {app.previous_approved_state && (
              <form action={makeProfileLive} className="ml-auto">
                <button className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white shadow-sm transition-hover hover:opacity-90 font-raleway">
                  Cancel Edits & Make Live
                </button>
              </form>
            )}
          </div>
        )}

        {isPendingUpdate && (
          <div className="flex items-center gap-3 rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 text-blue-600">
            <Clock className="h-5 w-5" />
            <div>
              <p className="text-sm font-semibold font-raleway">Update under review</p>
              <p className="text-xs font-jetbrains mt-1 opacity-80">Our team is reviewing your recent changes. Your profile is currently hidden.</p>
            </div>
            <form action={makeProfileLive} className="ml-auto">
              <button className="rounded-lg bg-surface px-4 py-2 text-xs font-semibold text-heading shadow-sm border border-edge transition-hover hover:border-blue-500 font-raleway">
                Cancel Update
              </button>
            </form>
          </div>
        )}

        {isRejected && app.previous_approved_state && (
          <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-red-600">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold font-raleway">Profile update rejected</p>
              <p className="text-xs font-jetbrains mt-1 opacity-80 mb-3">{app.review_reason || "No reason provided."}</p>
              <p className="text-xs font-raleway mb-4">Your changes were reverted and your profile remains hidden. You can edit and resubmit, or make your previous approved profile live again.</p>
              
              <div className="flex gap-3">
                <form action={makeProfileLive}>
                  <button className="rounded-lg bg-surface px-4 py-2 text-xs font-semibold text-heading shadow-sm border border-edge transition-hover hover:border-red-500 font-raleway">
                    Discard Changes & Make Live
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Form or ReadOnly View */}
        {(isHidden || (isRejected && app.previous_approved_state)) ? (
          <div>
            <ProfileUpdateForm userId={user.id} initial={app} />
          </div>
        ) : (
          <div className="space-y-6 opacity-70 pointer-events-none grayscale-[20%]">
            <p className="text-xs text-subtle font-jetbrains mb-4 uppercase tracking-widest">Read Only View</p>
            <ProfileUpdateForm userId={user.id} initial={app} />
          </div>
        )}

      </div>
      </LiveProfileBanners>
    </TalentRouteFrame>
  );
}
