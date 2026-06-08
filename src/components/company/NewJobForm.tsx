"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  CreditCard,
  Globe2,
  Info,
  Loader2,
  Lock,
  MapPin,
  Save,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { ROLE_CATEGORIES, SALARY_OPTIONS, CURRENCIES, FREQUENCIES } from "@/lib/company/options";
import type { Currency, Frequency } from "@/lib/company/options";
import { submitJobForReview } from "@/app/actions/job-posting";
import type { JobSubmitState } from "@/app/actions/job-posting";

const SENIORITIES = [
  { id: "junior", label: "Junior" },
  { id: "mid", label: "Mid" },
  { id: "senior", label: "Senior" },
  { id: "staff", label: "Staff" },
  { id: "principal", label: "Principal" },
  { id: "lead", label: "Lead / Manager" },
] as const;

const EMPLOYMENT_TYPES = [
  { id: "full-time", label: "Full time" },
  { id: "contract", label: "Contract" },
  { id: "part-time", label: "Part time" },
  { id: "internship", label: "Internship" },
] as const;

const WORK_ARRANGEMENTS = [
  { id: "remote", label: "Fully remote" },
  { id: "hybrid", label: "Hybrid" },
  { id: "onsite", label: "In-office" },
] as const;

export default function NewJobForm({
  companyPlan,
  cardCollected,
  existingJobCount,
}: {
  companyPlan: string;
  cardCollected: boolean;
  existingJobCount: number;
}) {
  // Quota logic: free or paid-without-card → max 1 job
  const isPaidWithCard = companyPlan !== "free" && cardCollected;
  const quotaExhausted = !isPaidWithCard && existingJobCount >= 1;
  const quotaReason =
    companyPlan === "free"
      ? "free"
      : !cardCollected
        ? "no_card"
        : null;
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [role, setRole] = useState("");
  const [seniority, setSeniority] = useState<string>("");
  const [employment, setEmployment] = useState<string>("full-time");
  const [workArrangement, setWorkArrangement] = useState<string>("remote");
  const [location, setLocation] = useState("");
  const [salaryRange, setSalaryRange] = useState<string>("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [benefits, setBenefits] = useState("");

  // Compensation state — mirrors onboarding wizard UX
  const [currency, setCurrency] = useState<Currency>(() => {
    const raw = salaryRange;
    if (!raw) return "USD";
    if (raw.startsWith("R") || raw.includes("R ") || raw.includes("ZAR")) return "ZAR";
    if (raw.startsWith("€") || raw.includes("EUR")) return "EUR";
    if (raw.startsWith("£") || raw.includes("GBP")) return "GBP";
    return "USD";
  });
  const [frequency, setFrequency] = useState<Frequency>(() => {
    const raw = salaryRange;
    if (!raw) return "Yearly";
    if (raw.toLowerCase().includes("month")) return "Monthly";
    if (raw.toLowerCase().includes("hr") || raw.toLowerCase().includes("hour")) return "Hourly";
    return "Yearly";
  });

  // Migrate old short-key salary values to new descriptive format
  useEffect(() => {
    const OLD_KEYS = ["lt-60", "60-100", "100-150", "150-200", "gt-200", "varies"];
    if (salaryRange && OLD_KEYS.includes(salaryRange)) {
      const MAP: Record<string, string> = {
        "lt-60": "Under $60K / year",
        "60-100": "$60K – $100K / year",
        "100-150": "$100K – $150K / year",
        "150-200": "$150K – $200K / year",
        "gt-200": "$200K+ / year",
        "varies": "Varies widely",
      };
      queueMicrotask(() => setSalaryRange(MAP[salaryRange]));
    }
  }, [salaryRange]);

  const [isPending, startTransition] = useTransition();
  const [submitState, setSubmitState] = useState<JobSubmitState | null>(null);

  const descriptionLen = description.length;
  const descriptionTooShort = descriptionLen > 0 && descriptionLen < 120;

  const allRoles = useMemo(
    () => ROLE_CATEGORIES.flatMap((g) => g.roles.map((r) => ({ group: g.group, label: r }))),
    []
  );

  // Determine if the form is ready to submit
  const canSubmit =
    title.trim().length >= 3 &&
    role.trim().length > 0 &&
    seniority.trim().length > 0 &&
    description.trim().length >= 120 &&
    skills.length >= 1 &&
    !isPending;

  function addSkill() {
    const raw = skillInput.trim();
    if (!raw) return;
    if (skills.includes(raw)) {
      setSkillInput("");
      return;
    }
    if (skills.length >= 15) return;
    setSkills((s) => [...s, raw]);
    setSkillInput("");
  }

  function removeSkill(s: string) {
    setSkills((list) => list.filter((x) => x !== s));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;

    // Build FormData
    const fd = new FormData();
    fd.set("title", title.trim());
    fd.set("role_category", role.trim());
    fd.set("seniority", seniority.trim());
    fd.set("employment_type", employment);
    fd.set("work_arrangement", workArrangement);
    fd.set("location", location.trim());
    fd.set("salary_range", salaryRange);
    fd.set("description", description.trim());
    fd.set("skills", JSON.stringify(skills));
    fd.set("benefits", benefits.trim());

    startTransition(async () => {
      const result = await submitJobForReview(undefined, fd);
      setSubmitState(result);

      if (result.ok) {
        // Redirect to jobs list after a brief pause to show success
        setTimeout(() => {
          router.push("/company/jobs");
        }, 1500);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* -------- QUOTA EXHAUSTED — full lock -------- */}
      {quotaExhausted && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-amber-500/50 bg-gradient-to-br from-amber-500/10 via-surface to-surface p-6 sm:p-8">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-500/8 blur-3xl"
          />
          <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-6">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600">
              <Lock className="h-7 w-7" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-lg font-bold text-heading font-raleway">
                {quotaReason === "free"
                  ? "You\u2019ve used your free job post"
                  : "Add a payment method to continue"}
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-body font-raleway">
                {quotaReason === "free" ? (
                  <>
                    The free plan includes <strong>1 job posting</strong>. Upgrade to
                    the <strong>Growth</strong> or <strong>Scale</strong> plan for
                    unlimited postings, priority matching, and direct candidate
                    messaging.
                  </>
                ) : (
                  <>
                    You\u2019re on the <strong>{companyPlan}</strong> plan, but we
                    need a payment method on file before you can post additional
                    jobs. Your first post was free — add a card to unlock unlimited
                    postings.
                  </>
                )}
              </p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Link
                  href="/company/subscription"
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-xs font-semibold text-white transition-all hover:opacity-90 hover:shadow-[0_0_24px_rgba(74,222,128,0.35)] font-raleway"
                >
                  {quotaReason === "free" ? (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      Upgrade plan
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-3.5 w-3.5" />
                      Add payment method
                    </>
                  )}
                </Link>
                <Link
                  href="/company/jobs"
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-ghost-border bg-surface px-5 py-2.5 text-xs font-semibold text-heading transition-opacity hover:opacity-80 font-raleway"
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  View your jobs
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------- Success / error banner -------- */}
      {!quotaExhausted && submitState && (
        <div
          className={`flex items-start gap-3 rounded-xl border p-4 ${
            submitState.ok
              ? "border-accent/40 bg-accent/5 text-accent"
              : "border-red-500/40 bg-red-500/5 text-red-500"
          }`}
        >
          {submitState.ok ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          )}
          <div>
            <p className="text-sm font-semibold font-raleway">
              {submitState.ok ? "Submitted!" : "Something went wrong"}
            </p>
            <p className="mt-0.5 text-xs font-raleway">{submitState.message}</p>
          </div>
        </div>
      )}

      {/* -------- Remaining quota info (when not exhausted) -------- */}
      {!quotaExhausted && !isPaidWithCard && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/5 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-semibold text-amber-600 font-raleway">
              {companyPlan === "free"
                ? "Free plan \u2014 1 job posting included"
                : "First post is free \u2014 card required for more"}
            </p>
            <p className="mt-0.5 text-xs text-amber-600/80 font-raleway">
              {companyPlan === "free"
                ? "This is your only free post. Upgrade anytime for unlimited postings."
                : "Add a payment method on the subscription page to unlock unlimited postings after this one."}
            </p>
          </div>
        </div>
      )}

      {/* -------- Form sections (locked when quota exhausted) -------- */}
      <div className={quotaExhausted ? "pointer-events-none select-none opacity-40" : ""}>

      {/* -------- Section: Basics -------- */}
      <Section
        number="01"
        title="The basics"
        subtitle="What's the headline? Where does it sit?"
      >
        <Field
          label="Job title"
          required
          error={submitState && !submitState.ok ? submitState.fieldErrors?.title?.[0] : undefined}
        >
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Senior Backend Engineer — Payments"
            maxLength={120}
            className={inputCls}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Role category"
            required
            error={submitState && !submitState.ok ? submitState.fieldErrors?.role_category?.[0] : undefined}
          >
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={selectCls}
            >
              <option value="">Select a role…</option>
              {allRoles.map((r) => (
                <option key={r.label} value={r.label}>
                  {r.label} — {r.group}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Seniority"
            required
            error={submitState && !submitState.ok ? submitState.fieldErrors?.seniority?.[0] : undefined}
          >
            <div className="flex flex-wrap gap-2">
              {SENIORITIES.map((s) => (
                <Chip
                  key={s.id}
                  active={seniority === s.id}
                  onClick={() => setSeniority(s.id)}
                  label={s.label}
                />
              ))}
            </div>
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Employment type">
            <div className="flex flex-wrap gap-2">
              {EMPLOYMENT_TYPES.map((t) => (
                <Chip
                  key={t.id}
                  active={employment === t.id}
                  onClick={() => setEmployment(t.id)}
                  label={t.label}
                />
              ))}
            </div>
          </Field>
          <Field label="Work arrangement">
            <div className="flex flex-wrap gap-2">
              {WORK_ARRANGEMENTS.map((t) => (
                <Chip
                  key={t.id}
                  active={workArrangement === t.id}
                  onClick={() => setWorkArrangement(t.id)}
                  label={t.label}
                  icon={
                    t.id === "remote"
                      ? Globe2
                      : t.id === "onsite"
                      ? MapPin
                      : undefined
                  }
                />
              ))}
            </div>
          </Field>
        </div>

        <Field
          label="Location"
          hint={
            workArrangement === "remote"
              ? "Optional — e.g. 'Any EU timezone'"
              : "City, country or metro area"
          }
        >
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={
              workArrangement === "remote"
                ? "Anywhere in Europe"
                : "Lisbon, Portugal"
            }
            className={inputCls}
          />
        </Field>
      </Section>

      {/* -------- Section: Compensation -------- */}
      <Section
        number="02"
        title="Compensation"
        subtitle="Posting a salary band lifts reply rates by ~2×."
      >
        <div className="space-y-4 rounded-xl border border-edge bg-surface/50 p-5 shadow-glow-soft">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-heading font-raleway">
              Salary range
            </span>
            <span className="text-xs text-subtle font-libre italic">
              Configure currency and payment terms to view calibrated salary options.
            </span>
          </div>

          {/* Currency & Frequency selection row */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="block text-[10px] text-subtle font-jetbrains mb-1.5 uppercase tracking-wider">
                Select Currency
              </span>
              <div className="flex rounded-lg bg-pill-bg p-0.5 border border-edge">
                {CURRENCIES.map((curr) => {
                  const isSelected = currency === curr;
                  return (
                    <button
                      key={curr}
                      type="button"
                      onClick={() => {
                        setCurrency(curr);
                        setSalaryRange("");
                      }}
                      className={`flex-1 rounded-md py-1.5 text-center text-xs font-semibold transition-all font-raleway ${
                        isSelected
                          ? "bg-accent text-white shadow-sm border border-accent/15"
                          : "text-body hover:text-heading"
                      }`}
                    >
                      {curr === "ZAR" ? "ZAR (R)" : curr === "USD" ? "USD ($)" : curr === "EUR" ? "EUR (€)" : "GBP (£)"}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="block text-[10px] text-subtle font-jetbrains mb-1.5 uppercase tracking-wider">
                Payment Terms
              </span>
              <div className="flex rounded-lg bg-pill-bg p-0.5 border border-edge">
                {FREQUENCIES.map((freq) => {
                  const isSelected = frequency === freq;
                  return (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => {
                        setFrequency(freq);
                        setSalaryRange("");
                      }}
                      className={`flex-1 rounded-md py-1.5 text-center text-xs font-semibold transition-all font-raleway ${
                        isSelected
                          ? "bg-accent text-white shadow-sm border border-accent/15"
                          : "text-body hover:text-heading"
                      }`}
                    >
                      {freq}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Dynamic Salary Cards grid */}
          <div>
            <span className="block text-[10px] text-subtle font-jetbrains mb-2.5 uppercase tracking-wider">
              Calibrated Ranges
            </span>
            <div className="grid gap-2 sm:grid-cols-3">
              {SALARY_OPTIONS[currency][frequency].map((option) => (
                <RadioCard
                  key={option.id}
                  checked={salaryRange === option.id}
                  onChange={() => setSalaryRange(option.id)}
                  label={option.label}
                />
              ))}
            </div>
          </div>
        </div>

        <Field label="Benefits, equity, perks" hint="Optional, short list">
          <textarea
            rows={3}
            value={benefits}
            onChange={(e) => setBenefits(e.target.value)}
            placeholder="e.g. 0.1–0.5% equity · 30 days PTO · Learning budget"
            className={textareaCls}
          />
        </Field>
      </Section>

      {/* -------- Section: Role detail -------- */}
      <Section
        number="03"
        title="About the role"
        subtitle="Describe the work, the stack and what great looks like."
      >
        <Field
          label="Description"
          required
          error={submitState && !submitState.ok ? submitState.fieldErrors?.description?.[0] : undefined}
        >
          <textarea
            rows={8}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={`What you'll build\n• …\n\nWho we're looking for\n• …`}
            className={textareaCls}
          />
          <div className="mt-1 flex items-center justify-between">
            <span
              className={`text-[11px] font-jetbrains ${
                descriptionTooShort ? "text-amber-600" : "text-subtle"
              }`}
            >
              {descriptionTooShort
                ? "At least 120 characters recommended"
                : "Markdown-ish formatting supported"}
            </span>
            <span className="text-[11px] text-subtle font-jetbrains">
              {descriptionLen} chars
            </span>
          </div>
        </Field>

        <Field
          label="Must-have skills"
          hint="Up to 15 — press Enter or comma"
          error={submitState && !submitState.ok ? submitState.fieldErrors?.skills?.[0] : undefined}
        >
          <div className="flex flex-wrap gap-2 rounded-lg border border-edge bg-surface p-3 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
            {skills.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1.5 rounded-full bg-pill-bg px-3 py-1 text-xs font-medium text-pill-text font-raleway"
              >
                {s}
                <button
                  type="button"
                  onClick={() => removeSkill(s)}
                  className="transition-opacity hover:opacity-70"
                  aria-label={`Remove ${s}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addSkill();
                } else if (
                  e.key === "Backspace" &&
                  skillInput === "" &&
                  skills.length > 0
                ) {
                  setSkills((list) => list.slice(0, -1));
                }
              }}
              placeholder={
                skills.length === 0
                  ? "TypeScript, Postgres, AWS…"
                  : "Add another…"
              }
              className="min-w-[140px] flex-1 border-none bg-transparent text-sm text-heading placeholder:text-subtle focus:outline-none font-raleway"
            />
          </div>
          <p className="mt-1 text-[11px] text-subtle font-jetbrains">
            {skills.length} / 15
          </p>
        </Field>
      </Section>

      {/* -------- Section: Visibility -------- */}
      <Section
        number="04"
        title="Visibility"
        subtitle="Who can see this role?"
      >
        <div className="rounded-xl border border-edge bg-surface p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-heading font-raleway">
                Veloraa shortlist — recommended
              </p>
              <p className="mt-1 text-xs text-body font-raleway">
                Our team hand-curates 5–10 pre-vetted matches within 48 hours
                of going live. You review and reply.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-dashed border-edge bg-page-alt p-3 text-xs text-body font-raleway">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-subtle" />
          Public job board is rolling out — you&apos;ll be able to toggle it
          once we launch. For now, jobs stay private to Veloraa&apos;s
          matching engine.
        </div>
      </Section>

      </div>{/* end quota lock wrapper */}

      {/* -------- Footer CTAs -------- */}
      <div className="sticky bottom-0 -mx-4 flex flex-col-reverse gap-3 border-t border-edge bg-page/90 px-4 py-4 backdrop-blur-xl sm:-mx-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:-mx-10 lg:px-10">
        <button
          type="button"
          disabled
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-ghost-border bg-surface px-5 py-2.5 text-xs font-semibold text-heading transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60 font-raleway"
        >
          <Save className="h-3.5 w-3.5" />
          Save draft
        </button>
        <button
          type="submit"
          disabled={!canSubmit || quotaExhausted}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-xs font-semibold text-white transition-all hover:opacity-90 hover:shadow-[0_0_24px_rgba(74,222,128,0.35)] disabled:cursor-not-allowed disabled:opacity-60 font-raleway"
        >
          {isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Submitting…
            </>
          ) : (
            <>
              <Send className="h-3.5 w-3.5" />
              Submit for review
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------

const inputCls =
  "w-full rounded-lg border border-edge bg-surface px-4 py-2.5 text-base text-heading placeholder:text-subtle transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:text-sm font-raleway";

const selectCls = inputCls;

const textareaCls =
  "w-full resize-y rounded-lg border border-edge bg-surface px-4 py-2.5 text-sm text-heading placeholder:text-subtle transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 font-raleway";

function Section({
  number,
  title,
  subtitle,
  children,
}: {
  number: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-edge bg-surface p-5 sm:p-6">
      <div className="mb-5 border-b border-edge pb-4">
        <p className="text-[11px] uppercase tracking-[0.1em] text-accent font-jetbrains">
          {number} · {title}
        </p>
        <p className="mt-1 text-xs text-body font-raleway">{subtitle}</p>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  required,
  error,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-xs uppercase tracking-[0.08em] text-body font-jetbrains">
          {label}
          {required && <span className="ml-1 text-accent">*</span>}
        </label>
        {hint && (
          <span className="text-[10px] text-subtle font-jetbrains">{hint}</span>
        )}
      </div>
      {children}
      {error && (
        <p className="mt-1 text-[11px] text-red-500 font-jetbrains">{error}</p>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  label,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all font-raleway ${
        active
          ? "border-accent bg-accent text-white"
          : "border-edge bg-surface text-body hover:border-accent/40 hover:text-heading"
      }`}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}

function RadioCard({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-all font-raleway ${
        checked
          ? "border-accent bg-accent/5 text-heading shadow-[0_0_0_1px_rgba(74,222,128,0.4)]"
          : "border-edge bg-surface text-body hover:border-accent/40 hover:text-heading"
      }`}
    >
      {label}
    </button>
  );
}
