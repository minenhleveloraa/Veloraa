/**
 * Single source of truth for every option presented in the company
 * onboarding wizard. Wire these up from both the client wizard (to
 * render) and the server action (to validate).
 *
 * Adding a new option? Do it here and everything else stays in sync.
 */

// ---------------------------------------------------------------------
// Step 2 — Basics
// ---------------------------------------------------------------------

export const COMPANY_SIZES = [
  { id: "1-10", label: "1–10", sub: "Startup" },
  { id: "11-50", label: "11–50", sub: "Scaleup" },
  { id: "51-200", label: "51–200", sub: "Growth" },
  { id: "201-1000", label: "201–1000", sub: "Mid-market" },
  { id: "1000+", label: "1000+", sub: "Enterprise" },
] as const;
export type CompanySize = (typeof COMPANY_SIZES)[number]["id"];

export const COMPANY_STAGES = [
  { id: "pre-seed", label: "Pre-seed / Seed" },
  { id: "series-ab", label: "Series A / B" },
  { id: "series-c-plus", label: "Series C+" },
  { id: "bootstrapped", label: "Profitable / Bootstrapped" },
  { id: "public", label: "Public company" },
] as const;
export type CompanyStage = (typeof COMPANY_STAGES)[number]["id"];

// Short, popular-first list. Users can type to filter.
export const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Germany",
  "France",
  "Netherlands",
  "Spain",
  "Portugal",
  "Italy",
  "Ireland",
  "Sweden",
  "Denmark",
  "Norway",
  "Finland",
  "Switzerland",
  "Belgium",
  "Austria",
  "Poland",
  "Czech Republic",
  "Estonia",
  "Lithuania",
  "Latvia",
  "Australia",
  "New Zealand",
  "Singapore",
  "Hong Kong",
  "Japan",
  "South Korea",
  "India",
  "United Arab Emirates",
  "Saudi Arabia",
  "Israel",
  "Turkey",
  "South Africa",
  "Nigeria",
  "Kenya",
  "Egypt",
  "Ghana",
  "Morocco",
  "Brazil",
  "Mexico",
  "Argentina",
  "Chile",
  "Colombia",
  "Uruguay",
  "Peru",
  "Other",
] as const;

// ---------------------------------------------------------------------
// Step 3 — Industry + roles
// ---------------------------------------------------------------------

export const INDUSTRIES = [
  "SaaS / Software",
  "Fintech",
  "Healthcare / MedTech",
  "E-commerce",
  "Web3 / Crypto",
  "AI / Machine Learning",
  "Cybersecurity",
  "Climate Tech",
  "EdTech",
  "Gaming",
  "Legal Tech",
  "Real Estate Tech",
  "Media / Content",
  "Other",
] as const;

export const ROLE_CATEGORIES = [
  {
    group: "Engineering",
    roles: [
      "Software Engineers",
      "Frontend Developers",
      "Backend Developers",
      "Full Stack Developers",
      "Mobile Developers",
      "DevOps / Infrastructure",
      "QA Engineers",
      "Security Engineers",
      "Engineering Managers",
      "CTOs / VPs of Eng",
    ],
  },
  {
    group: "Data & AI",
    roles: ["Data Engineers", "Data Scientists", "ML Engineers"],
  },
  {
    group: "Product & Design",
    roles: [
      "Product Managers",
      "UX / UI Designers",
      "Product Designers",
      "Brand Designers",
    ],
  },
  {
    group: "Business",
    roles: [
      "Growth / Marketing",
      "Finance / Accounting",
      "Legal / Compliance",
    ],
  },
] as const;

export const ALL_ROLES: string[] = ROLE_CATEGORIES.flatMap((g) => [...g.roles]);

// ---------------------------------------------------------------------
// Step 4 — Work style (optional)
// ---------------------------------------------------------------------

export const WORK_STYLES = [
  { id: "remote", label: "Fully remote" },
  { id: "hybrid", label: "Hybrid (some office)" },
  { id: "in-office", label: "In-office only" },
  { id: "depends", label: "Depends on the role" },
] as const;
export type WorkStyle = (typeof WORK_STYLES)[number]["id"];

export const HIRING_REGIONS = [
  "Anywhere in the world",
  "Africa",
  "North America",
  "Latin America",
  "Europe",
  "Middle East",
  "Asia Pacific",
] as const;

export const ENG_CULTURES = [
  { id: "ship-fast", label: "Move fast, ship often" },
  { id: "quality-first", label: "Quality-first, deliberate" },
  { id: "research-driven", label: "Research-driven" },
  { id: "structured", label: "Process-heavy, structured" },
] as const;
export type EngCulture = (typeof ENG_CULTURES)[number]["id"];

// ---------------------------------------------------------------------
// Step 5 — Hiring situation
// ---------------------------------------------------------------------

export const HIRING_URGENCIES = [
  { id: "now", label: "Immediately — open roles now" },
  { id: "1-3mo", label: "Within 1–3 months" },
  { id: "pipeline", label: "Building a pipeline for later" },
  { id: "exploring", label: "Just exploring Veloraa" },
] as const;
export type HiringUrgency = (typeof HIRING_URGENCIES)[number]["id"];

export const HIRING_VOLUMES = [
  { id: "1-2", label: "1–2 people" },
  { id: "3-5", label: "3–5 people" },
  { id: "6-10", label: "6–10 people" },
  { id: "10+", label: "10+ people" },
] as const;
export type HiringVolume = (typeof HIRING_VOLUMES)[number]["id"];

export const SALARY_RANGES = [
  { id: "lt-60", label: "Under $60K" },
  { id: "60-100", label: "$60K – $100K" },
  { id: "100-150", label: "$100K – $150K" },
  { id: "150-200", label: "$150K – $200K" },
  { id: "gt-200", label: "$200K+" },
  { id: "varies", label: "Varies widely" },
] as const;
export type SalaryRange = (typeof SALARY_RANGES)[number]["id"];

export const HIRING_METHODS = [
  { id: "in-house", label: "In-house recruiter" },
  { id: "agency", label: "External agency / headhunter" },
  { id: "linkedin", label: "LinkedIn and job boards" },
  { id: "referrals", label: "Referrals only" },
  { id: "struggle", label: "We struggle to hire — that's why we're here" },
] as const;
export type HiringMethod = (typeof HIRING_METHODS)[number]["id"];

// ---------------------------------------------------------------------
// Step 6 — Plan
// ---------------------------------------------------------------------

export const PLANS = [
  {
    id: "free",
    name: "Free",
    tagline: "1 job post, no card required",
    price: "$0",
    priceSub: "forever",
    features: [
      "1 job posting (30 days)",
      "Basic candidate profiles",
      "Interest-based messaging",
    ],
    requiresCard: false,
    recommended: false,
  },
  {
    id: "growth",
    name: "Growth",
    tagline: "For actively hiring teams",
    price: "$199",
    priceSub: "per month",
    features: [
      "Unlimited job postings",
      "Full talent search & browse",
      "Candidate pipeline (kanban)",
      "In-app messaging",
    ],
    requiresCard: true,
    recommended: true,
  },
  {
    id: "scale",
    name: "Scale",
    tagline: "For high-volume hiring",
    price: "$399",
    priceSub: "per month",
    features: [
      "Everything in Growth",
      "Up to 5 team seats",
      "Priority AI matching",
      "Advanced reports (PDF/CSV)",
    ],
    requiresCard: true,
    recommended: false,
  },
] as const;
export type PlanId = (typeof PLANS)[number]["id"];

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

export function labelFor<T extends { id: string; label: string }>(
  list: readonly T[],
  id: string | null | undefined
): string {
  if (!id) return "—";
  return list.find((o) => o.id === id)?.label ?? id;
}

export function planFor(id: string | null | undefined) {
  if (!id) return null;
  return PLANS.find((p) => p.id === id) ?? null;
}
