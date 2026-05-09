import type { ReactNode } from "react";
import type { TalentApplication } from "@/lib/types/db";
import { ArrowRight } from "lucide-react";

type ProfileUpdateSnapshot = Partial<
  Pick<
    TalentApplication,
    | "avatar_url"
    | "headline"
    | "location"
    | "years_experience"
    | "bio"
    | "portfolio_url"
    | "skills"
    | "work_experience"
    | "resume_path"
    | "resume_filename"
  >
>;

export default function ProfileUpdateDiff({
  current,
  previous,
}: {
  current: TalentApplication;
  previous: TalentApplication["previous_approved_state"];
}) {
  if (!previous) return null;

  const prev = previous as ProfileUpdateSnapshot;
  const changes: { label: string; old: ReactNode; new: ReactNode }[] = [];

  if (current.avatar_url !== prev.avatar_url) {
    changes.push({
      label: "Avatar",
      old: prev.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={prev.avatar_url} alt="Old avatar" className="h-10 w-10 rounded-full object-cover" />
      ) : "None",
      new: current.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={current.avatar_url} alt="New avatar" className="h-10 w-10 rounded-full object-cover" />
      ) : "None",
    });
  }

  if (current.headline !== prev.headline) {
    changes.push({ label: "Headline", old: prev.headline, new: current.headline });
  }
  if (current.location !== prev.location) {
    changes.push({ label: "Location", old: prev.location, new: current.location });
  }
  if (current.years_experience !== prev.years_experience) {
    changes.push({ label: "Years Experience", old: prev.years_experience, new: current.years_experience });
  }
  if (current.bio !== prev.bio) {
    changes.push({ label: "Bio", old: prev.bio, new: current.bio });
  }
  if (current.portfolio_url !== prev.portfolio_url) {
    changes.push({ label: "Portfolio URL", old: prev.portfolio_url, new: current.portfolio_url });
  }
  
  // Array comparisons
  const oldSkills = prev.skills?.join(", ") || "None";
  const newSkills = current.skills?.join(", ") || "None";
  if (oldSkills !== newSkills) {
    changes.push({ label: "Skills", old: oldSkills, new: newSkills });
  }

  // Work experience comparison is tricky, let's just serialize it or check length
  const oldWork = JSON.stringify(prev.work_experience);
  const newWork = JSON.stringify(current.work_experience);
  if (oldWork !== newWork) {
    changes.push({
      label: "Work Experience",
      old: `${prev.work_experience?.length || 0} roles`,
      new: `${current.work_experience?.length || 0} roles (Details changed)`,
    });
  }

  if (current.resume_path !== prev.resume_path) {
    changes.push({
      label: "Resume",
      old: prev.resume_filename || "None",
      new: current.resume_filename || "Updated File",
    });
  }

  if (changes.length === 0) {
    return (
      <div className="rounded-2xl border border-edge bg-surface p-6 mb-6">
        <h2 className="mb-2 text-[11px] uppercase tracking-[0.08em] text-subtle font-jetbrains">Update Review</h2>
        <p className="text-sm text-body font-raleway">No significant fields changed.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-6 mb-6">
      <h2 className="mb-4 text-[11px] uppercase tracking-[0.08em] text-blue-600 font-jetbrains font-bold">
        Proposed Updates (Before vs After)
      </h2>
      <div className="space-y-4">
        {changes.map((c, i) => (
          <div key={i} className="flex flex-col gap-1 rounded-xl bg-white/50 p-4 shadow-sm border border-blue-500/10">
            <p className="text-xs font-semibold text-heading font-raleway">{c.label}</p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1">
              <div className="flex-1 rounded-lg bg-red-500/5 p-3 text-sm text-red-700/80 line-through decoration-red-500/30">
                {c.old || <span className="italic opacity-50">Empty</span>}
              </div>
              <ArrowRight className="h-4 w-4 text-subtle shrink-0 hidden sm:block" />
              <div className="flex-1 rounded-lg bg-green-500/10 p-3 text-sm text-green-700 font-medium border border-green-500/20">
                {c.new || <span className="italic opacity-50">Empty</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
