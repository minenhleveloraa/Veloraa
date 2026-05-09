export type PlanId = "free" | "growth" | "scale";
export type BillingInterval = "monthly" | "annual";
export type Currency = "USD" | "ZAR";

export interface PlanPricing {
  monthly: number;
  annual: number;
  monthlyEquivalent: number; // annual / 12 rounded
  savings: number; // monthly * 12 - annual
}

export interface PlanDefinition {
  id: PlanId;
  name: string;
  description: string;
  badge?: string;
  usd: PlanPricing;
  zar: PlanPricing;
  features: { text: string; included: boolean; detail?: string }[];
  limits: {
    jobPosts: string;
    talentSearch: boolean;
    fullProfiles: boolean;
    messaging: string;
    pipeline: boolean;
    interviewScheduling: boolean;
    watchlist: string;
    talentAlerts: string;
    analytics: boolean;
    companyProfile: string;
    teamSeats: number;
    priorityMatching: boolean;
    customReports: boolean;
    support: string;
  };
}

export const BILLING_PLANS: PlanDefinition[] = [
  {
    id: "free",
    name: "Free",
    description: "Try Veloraa with a single job post. No credit card required.",
    usd: { monthly: 0, annual: 0, monthlyEquivalent: 0, savings: 0 },
    zar: { monthly: 0, annual: 0, monthlyEquivalent: 0, savings: 0 },
    features: [
      { text: "1 job post (30 days live)", included: true },
      { text: "Candidate interest messaging", included: true },
      { text: "Basic candidate profiles", included: true },
      { text: "Talent search & browse", included: false },
      { text: "Candidate pipeline", included: false },
      { text: "Hiring analytics", included: false },
      { text: "Company profile page", included: false },
      { text: "Team seats", included: false },
    ],
    limits: {
      jobPosts: "1 ever",
      talentSearch: false,
      fullProfiles: false,
      messaging: "Limited",
      pipeline: false,
      interviewScheduling: false,
      watchlist: "None",
      talentAlerts: "None",
      analytics: false,
      companyProfile: "None",
      teamSeats: 1,
      priorityMatching: false,
      customReports: false,
      support: "None",
    },
  },
  {
    id: "growth",
    name: "Growth",
    description:
      "For actively hiring teams that need full access to vetted talent.",
    badge: "Most Popular",
    usd: {
      monthly: 199,
      annual: 1990,
      monthlyEquivalent: 166,
      savings: 398,
    },
    zar: {
      monthly: 3699,
      annual: 36990,
      monthlyEquivalent: 3083,
      savings: 7398,
    },
    features: [
      { text: "Unlimited job posts", included: true },
      { text: "Full talent search & browse", included: true },
      { text: "Full candidate profiles", included: true },
      { text: "Open in-app messaging", included: true },
      { text: "Candidate pipeline (kanban)", included: true },
      { text: "Interview scheduling", included: true },
      { text: "Talent watchlist", included: true, detail: "50 profiles" },
      { text: "Talent match alerts", included: true, detail: "3 searches" },
      { text: "Hiring analytics dashboard", included: true },
      { text: "Company profile page", included: true },
      { text: "Email digest (weekly)", included: true },
      { text: "1 team seat", included: true },
      { text: "Email support (48hr)", included: true },
    ],
    limits: {
      jobPosts: "Unlimited",
      talentSearch: true,
      fullProfiles: true,
      messaging: "Full",
      pipeline: true,
      interviewScheduling: true,
      watchlist: "50 profiles",
      talentAlerts: "3 searches",
      analytics: true,
      companyProfile: "Standard",
      teamSeats: 1,
      priorityMatching: false,
      customReports: false,
      support: "Email 48hr",
    },
  },
  {
    id: "scale",
    name: "Scale",
    description:
      "For high-volume hiring teams that need priority access and advanced tools.",
    badge: "Best Value",
    usd: {
      monthly: 399,
      annual: 3990,
      monthlyEquivalent: 333,
      savings: 798,
    },
    zar: {
      monthly: 7399,
      annual: 73990,
      monthlyEquivalent: 6166,
      savings: 14798,
    },
    features: [
      { text: "Everything in Growth", included: true },
      { text: "Up to 5 team seats", included: true },
      { text: "Priority AI talent matching", included: true },
      { text: "Unlimited talent watchlist", included: true },
      { text: "Unlimited standing searches", included: true },
      {
        text: "Advanced reports (PDF/CSV)",
        included: true,
      },
      { text: "Featured company profile", included: true },
      { text: "Priority support (4hr)", included: true },
      { text: "Early access to features", included: true },
      { text: "Quarterly hiring review call", included: true },
    ],
    limits: {
      jobPosts: "Unlimited",
      talentSearch: true,
      fullProfiles: true,
      messaging: "Full",
      pipeline: true,
      interviewScheduling: true,
      watchlist: "Unlimited",
      talentAlerts: "Unlimited",
      analytics: true,
      companyProfile: "Featured",
      teamSeats: 5,
      priorityMatching: true,
      customReports: true,
      support: "Priority 4hr",
    },
  },
];

export function getPlan(id: PlanId): PlanDefinition {
  return BILLING_PLANS.find((p) => p.id === id)!;
}

export function formatPrice(
  amount: number,
  currency: Currency,
  interval?: BillingInterval
): string {
  const symbol = currency === "ZAR" ? "R" : "$";
  const formatted =
    currency === "ZAR"
      ? `${symbol}${amount.toLocaleString("en-ZA")}`
      : `${symbol}${amount.toLocaleString("en-US")}`;

  if (!interval) return formatted;
  return interval === "monthly" ? `${formatted}/mo` : `${formatted}/yr`;
}

export const COMPARISON_ROWS: {
  label: string;
  free: string;
  growth: string;
  scale: string;
}[] = [
  { label: "Job posts", free: "1 ever", growth: "Unlimited", scale: "Unlimited" },
  { label: "Talent search & browse", free: "—", growth: "✓", scale: "✓" },
  { label: "Full candidate profiles", free: "—", growth: "✓", scale: "✓" },
  { label: "In-app messaging", free: "Limited", growth: "Full", scale: "Full" },
  { label: "Candidate pipeline", free: "—", growth: "✓", scale: "✓" },
  { label: "Interview scheduling", free: "—", growth: "✓", scale: "✓" },
  { label: "Talent watchlist", free: "—", growth: "50 profiles", scale: "Unlimited" },
  { label: "Talent match alerts", free: "—", growth: "3 searches", scale: "Unlimited" },
  { label: "Hiring analytics", free: "—", growth: "✓", scale: "✓" },
  { label: "Company profile page", free: "—", growth: "Standard", scale: "Featured" },
  { label: "Team seats", free: "1", growth: "1", scale: "5" },
  { label: "Priority AI matching", free: "—", growth: "—", scale: "✓" },
  { label: "Custom reports", free: "—", growth: "—", scale: "✓" },
  { label: "Support", free: "None", growth: "Email 48hr", scale: "Priority 4hr" },
];
