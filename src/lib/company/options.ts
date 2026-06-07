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
  { 
    id: "pre-seed", 
    label: "Pre-seed / Seed",
    description: "Just starting out. You're building the first version of your product or testing your idea.",
    example: "e.g., a team of 2-5 people working on a beta version, funded by personal savings or angel investors."
  },
  { 
    id: "series-ab", 
    label: "Series A / B",
    description: "Early growth. You have a working product, active customers, and are scaling up your team.",
    example: "e.g., a startup of 15-50 people that raised $2M-$15M to expand fast."
  },
  { 
    id: "series-c-plus", 
    label: "Series C+",
    description: "Mature scaling. You have established market fit and are expanding globally or buying other firms.",
    example: "e.g., a well-known brand with 100+ employees and massive venture funding."
  },
  { 
    id: "bootstrapped", 
    label: "Profitable / Bootstrapped",
    description: "Self-funded. You run entirely on the revenue paid by your customers, not investor money.",
    example: "e.g., a stable software business with a small team that pays for itself."
  },
  { 
    id: "public", 
    label: "Public company",
    description: "Stock market listed. Anyone can buy shares of your company on public stock exchanges.",
    example: "e.g., tech giants or large enterprises (like Google, Apple, or Spotify)."
  },
] as const;
export type CompanyStage = (typeof COMPANY_STAGES)[number]["id"];

// Comprehensive list of world countries. Popular ones first for empty-input suggestions,
// followed by all other countries in alphabetical order.
export const COUNTRIES = [
  // Popular / High-frequency defaults (shows when input is empty)
  "United States",
  "United Kingdom",
  "Canada",
  "Germany",
  "France",
  "Netherlands",
  "Australia",
  "Singapore",
  "South Africa",
  "India",

  // Alphabetical list of all world countries (duplicates automatically handled/avoided)
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo (Congo-Brazzaville)",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czechia (Czech Republic)",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "Gabon",
  "Gambia",
  "Georgia",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hong Kong",
  "Hungary",
  "Iceland",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Macau",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar (Burma)",
  "Namibia",
  "Nauru",
  "Nepal",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
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

// ---------------------------------------------------------------------
// Dynamic salary options — used by both onboarding wizard & job form
// ---------------------------------------------------------------------

export const CURRENCIES = ["ZAR", "USD", "EUR", "GBP"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const FREQUENCIES = ["Yearly", "Monthly", "Hourly"] as const;
export type Frequency = (typeof FREQUENCIES)[number];

export interface SalaryRangeOption {
  id: string;
  label: string;
}

export const SALARY_OPTIONS: Record<
  Currency,
  Record<Frequency, SalaryRangeOption[]>
> = {
  USD: {
    Yearly: [
      { id: "Under $60K / year", label: "Under $60K" },
      { id: "$60K – $100K / year", label: "$60K – $100K" },
      { id: "$100K – $150K / year", label: "$100K – $150K" },
      { id: "$150K – $200K / year", label: "$150K – $200K" },
      { id: "$200K+ / year", label: "$200K+" },
      { id: "Varies widely", label: "Varies widely" },
    ],
    Monthly: [
      { id: "Under $5,000 / month", label: "Under $5,000" },
      { id: "$5,000 – $8,000 / month", label: "$5,000 – $8,000" },
      { id: "$8,000 – $12,000 / month", label: "$8,000 – $12,000" },
      { id: "$12,000 – $16,000 / month", label: "$12,000 – $16,000" },
      { id: "$16,000+ / month", label: "$16,000+" },
      { id: "Varies widely", label: "Varies widely" },
    ],
    Hourly: [
      { id: "Under $30 / hr", label: "Under $30" },
      { id: "$30 – $50 / hr", label: "$30 – $50" },
      { id: "$50 – $80 / hr", label: "$50 – $80" },
      { id: "$80 – $120 / hr", label: "$80 – $120" },
      { id: "$120+ / hr", label: "$120+" },
      { id: "Varies widely", label: "Varies widely" },
    ],
  },
  ZAR: {
    Yearly: [
      { id: "Under R350K / year", label: "Under R350K" },
      { id: "R350K – R600K / year", label: "R350K – R600K" },
      { id: "R600K – R1M / year", label: "R600K – R1M" },
      { id: "R1M – R1.5M / year", label: "R1M – R1.5M" },
      { id: "R1.5M+ / year", label: "R1.5M+" },
      { id: "Varies widely", label: "Varies widely" },
    ],
    Monthly: [
      { id: "Under R30K / month", label: "Under R30K" },
      { id: "R30K – R50K / month", label: "R30K – R50K" },
      { id: "R50K – R80K / month", label: "R50K – R80K" },
      { id: "R80K – R120K / month", label: "R80K – R120K" },
      { id: "R120K+ / month", label: "R120K+" },
      { id: "Varies widely", label: "Varies widely" },
    ],
    Hourly: [
      { id: "Under R150 / hr", label: "Under R150" },
      { id: "R150 – R300 / hr", label: "R150 – R300" },
      { id: "R300 – R500 / hr", label: "R300 – R500" },
      { id: "R500 – R800 / hr", label: "R500 – R800" },
      { id: "R800+ / hr", label: "R800+" },
      { id: "Varies widely", label: "Varies widely" },
    ],
  },
  EUR: {
    Yearly: [
      { id: "Under €50K / year", label: "Under €50K" },
      { id: "€50K – €80K / year", label: "€50K – €80K" },
      { id: "€80K – €120K / year", label: "€80K – €120K" },
      { id: "€120K – €160K / year", label: "€120K – €160K" },
      { id: "€160K+ / year", label: "€160K+" },
      { id: "Varies widely", label: "Varies widely" },
    ],
    Monthly: [
      { id: "Under €4,000 / month", label: "Under €4,000" },
      { id: "€4,000 – €7,000 / month", label: "€4,000 – €7,000" },
      { id: "€7,000 – €10,000 / month", label: "€7,000 – €10,000" },
      { id: "€10,000 – €14,000 / month", label: "€10,000 – €14,000" },
      { id: "€14,000+ / month", label: "€14,000+" },
      { id: "Varies widely", label: "Varies widely" },
    ],
    Hourly: [
      { id: "Under €25 / hr", label: "Under €25" },
      { id: "€25 – €45 / hr", label: "€25 – €45" },
      { id: "€45 – €75 / hr", label: "€45 – €75" },
      { id: "€75 – €110 / hr", label: "€75 – €110" },
      { id: "€110+ / hr", label: "€110+" },
      { id: "Varies widely", label: "Varies widely" },
    ],
  },
  GBP: {
    Yearly: [
      { id: "Under £45K / year", label: "Under £45K" },
      { id: "£45K – £75K / year", label: "£45K – £75K" },
      { id: "£75K – £110K / year", label: "£75K – £110K" },
      { id: "£110K – £150K / year", label: "£110K – £150K" },
      { id: "£150K+ / year", label: "£150K+" },
      { id: "Varies widely", label: "Varies widely" },
    ],
    Monthly: [
      { id: "Under £3,500 / month", label: "Under £3,500" },
      { id: "£3,500 – £6,000 / month", label: "£3,500 – £6,000" },
      { id: "£6,000 – £9,000 / month", label: "£6,000 – £9,000" },
      { id: "£9,000 – £12,500 / month", label: "£9,000 – £12,500" },
      { id: "£12,500+ / month", label: "£12,500+" },
      { id: "Varies widely", label: "Varies widely" },
    ],
    Hourly: [
      { id: "Under £25 / hr", label: "Under £25" },
      { id: "£25 – £45 / hr", label: "£25 – £45" },
      { id: "£45 – £70 / hr", label: "£45 – £70" },
      { id: "£70 – £100 / hr", label: "£70 – £100" },
      { id: "£100+ / hr", label: "£100+" },
      { id: "Varies widely", label: "Varies widely" },
    ],
  },
};

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
