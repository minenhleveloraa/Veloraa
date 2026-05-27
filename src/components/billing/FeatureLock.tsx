import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import type { Feature } from "@/lib/billing/gate";
import type { PlanId } from "@/lib/billing/plans";

const FEATURE_LABELS: Record<Feature, string> = {
  post_job: "unlimited job posts",
  talent_search: "the full talent search",
  full_candidate_profile: "full candidate profiles",
  messaging_open: "open in-app messaging",
  pipeline: "the candidate pipeline",
  interview_scheduling: "interview scheduling",
  watchlist: "the talent watchlist",
  talent_alerts: "talent match alerts",
  analytics: "the hiring analytics dashboard",
  company_profile: "your company profile page",
  team_seats: "team seats",
  priority_matching: "priority AI matching",
  custom_reports: "advanced reports",
};

const PLAN_NAME: Record<PlanId, string> = {
  free: "Free",
  growth: "Growth",
  scale: "Scale",
};

/**
 * Spotify-style overlay: renders the underlying UI behind a blurred
 * mask with a centred upsell card. Use when you want users to *see*
 * what they're missing instead of hiding the feature outright.
 */
export function FeatureLock({
  feature,
  plan,
  children,
  className,
}: {
  feature: Feature;
  /** The minimum plan required to unlock the feature. */
  plan: Exclude<PlanId, "free">;
  children: React.ReactNode;
  className?: string;
}) {
  const featureLabel = FEATURE_LABELS[feature] ?? "this feature";

  return (
    <div className={`relative ${className ?? ""}`}>
      <div
        aria-hidden
        className="pointer-events-none select-none blur-[4px] grayscale-[40%]"
      >
        {children}
      </div>

      <div className="absolute inset-0 flex items-center justify-center bg-page/70 backdrop-blur-sm">
        <div className="mx-4 max-w-sm rounded-2xl border border-edge bg-surface p-6 text-center shadow-lg">
          <Sparkles className="mx-auto mb-3 h-6 w-6 text-accent" />
          <h3 className="text-base font-semibold text-heading font-raleway">
            Available on the {PLAN_NAME[plan]} plan
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-body font-raleway">
            Unlock {featureLabel} and the rest of the {PLAN_NAME[plan]}{" "}
            toolkit.
          </p>
          <Link
            href={`/company/subscription?upgrade=${plan}`}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 font-raleway"
          >
            Upgrade <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default FeatureLock;
