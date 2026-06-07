"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useFormStatus } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  ImagePlus,
  Info,
  Loader2,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { uploadToBucket } from "@/lib/supabase/upload";
import {
  saveCompanyDraft,
  submitCompanyOnboarding,
  type CompanyDraftInput,
  type CompanyOnboardingState,
} from "@/app/actions/company-onboarding";
import {
  ALL_ROLES,
  COMPANY_SIZES,
  COMPANY_STAGES,
  COUNTRIES,
  ENG_CULTURES,
  HIRING_METHODS,
  HIRING_REGIONS,
  HIRING_URGENCIES,
  HIRING_VOLUMES,
  INDUSTRIES,
  PLANS,
  ROLE_CATEGORIES,
  SALARY_OPTIONS,
  WORK_STYLES,
} from "@/lib/company/options";
import type { Currency, Frequency } from "@/lib/company/options";
import type { CompanyApplication } from "@/lib/types/db";

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

// ---------------------------------------------------------------------
// Step definition
// ---------------------------------------------------------------------

type StepId = 0 | 1 | 2 | 3 | 4;

const STEPS: {
  id: StepId;
  label: string;
  number: string;
  hint: string;
  optional?: boolean;
}[] = [
  {
    id: 0,
    label: "Tell us about your company",
    number: "02",
    hint: "The basics — who you are.",
  },
  {
    id: 1,
    label: "Your industry and roles",
    number: "03",
    hint: "What you do and who you hire.",
  },
  {
    id: 2,
    label: "How your team works",
    number: "04",
    hint: "Culture and work style.",
    optional: true,
  },
  {
    id: 3,
    label: "Your hiring situation",
    number: "05",
    hint: "Urgency and volume signals.",
  },
  {
    id: 4,
    label: "Choose your plan",
    number: "06",
    hint: "One free post included — no credit card.",
  },
];

// ---------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------

interface WizardValues {
  legal_name: string;
  website_url: string;
  company_size: string;
  hq_country: string;
  company_stage: string;
  logo_path: string | null;
  logo_filename: string | null;

  industries: string[];
  roles_hiring: string[];

  work_style: string;
  hiring_regions: string[];
  eng_culture: string;

  hiring_urgency: string;
  hiring_volume: string;
  salary_range: string;
  hiring_method: string;

  selected_plan: string;
}

function initialValuesFrom(app: CompanyApplication | null): WizardValues {
  return {
    legal_name: app?.legal_name ?? "",
    website_url: app?.website_url ?? "",
    company_size: app?.company_size ?? "",
    hq_country: app?.hq_country ?? "",
    company_stage: app?.company_stage ?? "",
    logo_path: app?.logo_path ?? null,
    logo_filename: app?.logo_filename ?? null,

    industries: app?.industries ?? [],
    roles_hiring: app?.roles_hiring ?? [],

    work_style: app?.work_style ?? "",
    hiring_regions: app?.hiring_regions ?? [],
    eng_culture: app?.eng_culture ?? "",

    hiring_urgency: app?.hiring_urgency ?? "",
    hiring_volume: app?.hiring_volume ?? "",
    salary_range: app?.salary_range ?? "",
    hiring_method: app?.hiring_method ?? "",

    selected_plan: app?.selected_plan ?? "",
  };
}

// ---------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------

export default function CompanyWizard({
  userId,
  prefilledName,
  existing,
}: {
  userId: string;
  prefilledName?: string | null;
  existing: CompanyApplication | null;
}) {
  const [values, setValues] = useState<WizardValues>(() => {
    const init = initialValuesFrom(existing);
    if (!init.legal_name && prefilledName) init.legal_name = prefilledName;
    return init;
  });

  const [step, setStep] = useState<StepId>(
    () => Math.min(4, Math.max(0, existing?.draft_step ?? 0)) as StepId
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSave] = useTransition();
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const setField = useCallback(
    <K extends keyof WizardValues>(key: K, value: WizardValues[K]) => {
      setValues((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // ------------------------------------------------------------
  // Per-step validation (client-side mirror of server validation)
  // ------------------------------------------------------------
  const stepValidation = useMemo(() => {
    const errors: string[] = [];
    if (step === 0) {
      if (!values.legal_name.trim() || values.legal_name.trim().length < 2)
        errors.push("Company name is required.");
      if (!/^https?:\/\/.+/i.test(values.website_url.trim()))
        errors.push("Website must start with http:// or https://");
      if (!values.company_size) errors.push("Pick your company size.");
      if (!values.hq_country.trim()) errors.push("Pick your HQ country.");
      if (!values.company_stage) errors.push("Pick your company stage.");
    }
    if (step === 1) {
      if (values.industries.length < 1)
        errors.push("Pick at least one industry.");
      if (values.industries.length > 3)
        errors.push("Pick up to 3 industries.");
      if (values.roles_hiring.length < 1)
        errors.push("Pick at least one role you hire for.");
    }
    // Step 2 is fully optional — no hard requirements.
    if (step === 3) {
      if (!values.hiring_urgency) errors.push("Pick your hiring urgency.");
      if (!values.hiring_volume) errors.push("Pick your hiring volume.");
      if (!values.salary_range) errors.push("Pick your salary range.");
      if (!values.hiring_method) errors.push("Pick how you currently hire.");
    }
    if (step === 4) {
      if (!values.selected_plan) errors.push("Pick a plan to continue.");
    }
    return { ok: errors.length === 0, errors };
  }, [step, values]);

  // ------------------------------------------------------------
  // Autosave — fires when moving between steps
  // ------------------------------------------------------------
  const persistDraft = useCallback(
    (overrides: Partial<CompanyDraftInput> = {}) => {
      const payload: CompanyDraftInput = {
        legal_name: values.legal_name || null,
        website_url: values.website_url || null,
        company_size: values.company_size || null,
        hq_country: values.hq_country || null,
        company_stage: values.company_stage || null,
        logo_path: values.logo_path,
        logo_filename: values.logo_filename,
        industries: values.industries,
        roles_hiring: values.roles_hiring,
        work_style: values.work_style || null,
        hiring_regions: values.hiring_regions,
        eng_culture: values.eng_culture || null,
        hiring_urgency: values.hiring_urgency || null,
        hiring_volume: values.hiring_volume || null,
        salary_range: values.salary_range || null,
        hiring_method: values.hiring_method || null,
        selected_plan: values.selected_plan || null,
        draft_step: step,
        ...overrides,
      };
      startSave(async () => {
        const res = await saveCompanyDraft(payload);
        if (res.ok) setSavedAt(new Date());
      });
    },
    [values, step]
  );

  // Save on window close / blur for extra safety.
  useEffect(() => {
    const onHide = () => {
      const data = new Blob([JSON.stringify({ draft_step: step })], {
        type: "application/json",
      });
      // Best-effort — sendBeacon doesn't hit server actions directly.
      // We rely on manual persist on step advance instead; this is a
      // last-ditch nudge.
      void data;
    };
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, [step]);

  const handleNext = useCallback(() => {
    setError(null);
    if (!stepValidation.ok) {
      setError(stepValidation.errors[0] ?? "Check the fields above.");
      return;
    }
    persistDraft({ draft_step: Math.min(4, step + 1) });
    if (step < 4) setStep((step + 1) as StepId);
  }, [stepValidation, persistDraft, step]);

  const handleBack = useCallback(() => {
    setError(null);
    if (step === 0) return;
    persistDraft({ draft_step: step - 1 });
    setStep((step - 1) as StepId);
  }, [persistDraft, step]);

  const handleSkip = useCallback(() => {
    if (!STEPS[step].optional) return;
    setError(null);
    persistDraft({ draft_step: Math.min(4, step + 1) });
    setStep((step + 1) as StepId);
  }, [persistDraft, step]);

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  const currentStep = STEPS[step];

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10 lg:px-8">
      {/* Step indicator */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-[0.08em] text-subtle font-jetbrains">
          <span>
            Step {step + 1} of {STEPS.length}
            {currentStep.optional && (
              <span className="ml-2 text-accent">· Optional</span>
            )}
          </span>
          <AutosaveIndicator isSaving={isSaving} savedAt={savedAt} />
        </div>

        {/* Numbered circles + connecting lines */}
        <ol className="flex items-center">
          {STEPS.map((s, i) => {
            const isDone = i < step;
            const isCurrent = i === step;
            const isLast = i === STEPS.length - 1;
            return (
              <li
                key={s.id}
                className="flex flex-1 items-center last:flex-none"
                aria-current={isCurrent ? "step" : undefined}
              >
                <div className="relative flex h-7 w-7 shrink-0 items-center justify-center">
                  {isCurrent && (
                    <motion.span
                      layoutId="wizard-current-ring"
                      className="absolute inset-0 rounded-full ring-2 ring-accent ring-offset-2 ring-offset-page"
                      transition={{ duration: 0.3, ease: EASE_OUT }}
                      aria-hidden
                    />
                  )}
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold transition-colors font-jetbrains ${
                      isDone
                        ? "bg-accent text-white"
                        : isCurrent
                        ? "bg-surface text-heading border border-accent"
                        : "bg-pill-bg text-subtle"
                    }`}
                  >
                    {isDone ? (
                      <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                    ) : (
                      i + 1
                    )}
                  </span>
                </div>
                {!isLast && (
                  <div className="relative mx-2 h-px flex-1 bg-pill-bg">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-accent"
                      initial={false}
                      animate={{ width: isDone ? "100%" : "0%" }}
                      transition={{ duration: 0.4, ease: EASE_OUT }}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Step header */}
      <header className="mb-8">
        <span className="mb-2 inline-block text-[11px] uppercase tracking-[0.08em] text-accent font-jetbrains">
          Veloraa for companies
        </span>
        <h1 className="text-3xl font-bold text-heading sm:text-4xl font-raleway">
          {currentStep.label}
        </h1>
        <p className="mt-3 text-base text-body font-libre italic">
          {currentStep.hint}
        </p>
      </header>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25, ease: EASE_OUT }}
        >
          {step === 0 && (
            <StepBasics
              userId={userId}
              values={values}
              setField={setField}
            />
          )}
          {step === 1 && <StepIndustryRoles values={values} setField={setField} />}
          {step === 2 && <StepWorkStyle values={values} setField={setField} />}
          {step === 3 && <StepHiring values={values} setField={setField} />}
          {step === 4 && <StepPlan values={values} setField={setField} />}
        </motion.div>
      </AnimatePresence>

      {error && (
        <div className="mt-5 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-500 font-raleway">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Nav */}
      <div className="mt-10 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleBack}
          disabled={step === 0}
          className="inline-flex items-center gap-1.5 rounded-lg border border-ghost-border bg-surface px-4 py-2 text-xs font-semibold text-heading transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40 font-raleway"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>

        <div className="flex items-center gap-3">
          {currentStep.optional && step < 4 && (
            <button
              type="button"
              onClick={handleSkip}
              className="text-xs uppercase tracking-[0.08em] text-body transition-colors hover:text-heading font-jetbrains"
            >
              Skip for now
            </button>
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 rounded-lg bg-btn-bg px-5 py-2.5 text-xs font-semibold text-btn-fg transition-opacity hover:opacity-90 font-raleway"
            >
              Continue
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <SubmitButton
              values={values}
              disabled={!stepValidation.ok}
              onBeforeSubmit={() => persistDraft()}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Autosave indicator
// ---------------------------------------------------------------------

function AutosaveIndicator({
  isSaving,
  savedAt,
}: {
  isSaving: boolean;
  savedAt: Date | null;
}) {
  if (isSaving) {
    return (
      <span className="inline-flex items-center gap-1 text-accent">
        <Loader2 className="h-3 w-3 animate-spin" />
        Saving…
      </span>
    );
  }
  if (savedAt) {
    return (
      <span className="inline-flex items-center gap-1 text-accent">
        <Check className="h-3 w-3" />
        Saved
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-subtle">
      <Clock className="h-3 w-3" />
      Autosaves
    </span>
  );
}

// ---------------------------------------------------------------------
// STEP 2 — Basics
// ---------------------------------------------------------------------

function StepBasics({
  userId,
  values,
  setField,
}: {
  userId: string;
  values: WizardValues;
  setField: <K extends keyof WizardValues>(k: K, v: WizardValues[K]) => void;
}) {
  return (
    <div className="space-y-6">
      <Field label="Company's full legal name" htmlFor="legal_name">
        <input
          id="legal_name"
          type="text"
          value={values.legal_name}
          onChange={(e) => setField("legal_name", e.target.value)}
          placeholder="Acme Inc."
          className={inputCls}
        />
      </Field>

      <Field label="Company website" htmlFor="website_url" hint="We'll use this to auto-fetch your logo.">
        <input
          id="website_url"
          type="url"
          inputMode="url"
          value={values.website_url}
          onChange={(e) => setField("website_url", e.target.value)}
          placeholder="https://yourcompany.com"
          className={inputCls}
        />
      </Field>

      <Field label="How many people work at your company?">
        <div className="grid gap-2 sm:grid-cols-5">
          {COMPANY_SIZES.map((s) => (
            <RadioCard
              key={s.id}
              checked={values.company_size === s.id}
              onChange={() => setField("company_size", s.id)}
              label={s.label}
              sub={s.sub}
            />
          ))}
        </div>
      </Field>

      <Field
        label="Where is your company headquartered?"
        htmlFor="hq_country"
      >
        <CountryPicker
          value={values.hq_country}
          onChange={(v) => setField("hq_country", v)}
        />
      </Field>

      <Field label="What stage is your company at?">
        <div className="grid gap-2 sm:grid-cols-2">
          {COMPANY_STAGES.map((s) => (
            <RadioCard
              key={s.id}
              checked={values.company_stage === s.id}
              onChange={() => setField("company_stage", s.id)}
              label={s.label}
              tooltip={{ description: s.description, example: s.example }}
            />
          ))}
        </div>
      </Field>

      <Field
        label="Upload your company logo"
        hint="Optional · PNG, JPG, SVG, WEBP · up to 2MB"
      >
        <LogoUploader
          userId={userId}
          logoPath={values.logo_path}
          logoFilename={values.logo_filename}
          onUploaded={(path, name) => {
            setField("logo_path", path);
            setField("logo_filename", name);
          }}
          onRemoved={() => {
            setField("logo_path", null);
            setField("logo_filename", null);
          }}
        />
      </Field>
    </div>
  );
}

// ---------------------------------------------------------------------
// STEP 3 — Industry + roles
// ---------------------------------------------------------------------

function StepIndustryRoles({
  values,
  setField,
}: {
  values: WizardValues;
  setField: <K extends keyof WizardValues>(k: K, v: WizardValues[K]) => void;
}) {
  const toggleIndustry = (v: string) => {
    const on = values.industries.includes(v);
    if (on) {
      setField(
        "industries",
        values.industries.filter((x) => x !== v)
      );
    } else {
      if (values.industries.length >= 3) return;
      setField("industries", [...values.industries, v]);
    }
  };
  const toggleRole = (v: string) => {
    const on = values.roles_hiring.includes(v);
    setField(
      "roles_hiring",
      on
        ? values.roles_hiring.filter((x) => x !== v)
        : [...values.roles_hiring, v]
    );
  };

  return (
    <div className="space-y-8">
      <Field
        label="What industry does your company operate in?"
        hint={`Pick up to 3 · ${values.industries.length}/3 selected`}
      >
        <div className="flex flex-wrap gap-2">
          {INDUSTRIES.map((ind) => {
            const on = values.industries.includes(ind);
            return (
              <Chip
                key={ind}
                active={on}
                onClick={() => toggleIndustry(ind)}
                label={ind}
              />
            );
          })}
        </div>
      </Field>

      <Field
        label="What roles do you typically hire for?"
        hint={`Pick all that apply · ${values.roles_hiring.length} selected`}
      >
        <div className="space-y-4">
          {ROLE_CATEGORIES.map((cat) => (
            <div key={cat.group}>
              <p className="mb-2 text-[10px] uppercase tracking-[0.12em] text-subtle font-jetbrains">
                {cat.group}
              </p>
              <div className="flex flex-wrap gap-2">
                {cat.roles.map((r) => (
                  <Chip
                    key={r}
                    active={values.roles_hiring.includes(r)}
                    onClick={() => toggleRole(r)}
                    label={r}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Field>
    </div>
  );
}

// ---------------------------------------------------------------------
// STEP 4 — Work style (optional)
// ---------------------------------------------------------------------

function StepWorkStyle({
  values,
  setField,
}: {
  values: WizardValues;
  setField: <K extends keyof WizardValues>(k: K, v: WizardValues[K]) => void;
}) {
  const toggleRegion = (v: string) => {
    const on = values.hiring_regions.includes(v);
    setField(
      "hiring_regions",
      on
        ? values.hiring_regions.filter((x) => x !== v)
        : [...values.hiring_regions, v]
    );
  };
  return (
    <div className="space-y-8">
      <Field label="How does your team primarily work?">
        <div className="grid gap-2 sm:grid-cols-2">
          {WORK_STYLES.map((w) => (
            <RadioCard
              key={w.id}
              checked={values.work_style === w.id}
              onChange={() => setField("work_style", w.id)}
              label={w.label}
            />
          ))}
        </div>
      </Field>

      <Field
        label="Which regions do you hire from?"
        hint="Pick all that apply"
      >
        <div className="flex flex-wrap gap-2">
          {HIRING_REGIONS.map((r) => (
            <Chip
              key={r}
              active={values.hiring_regions.includes(r)}
              onClick={() => toggleRegion(r)}
              label={r}
            />
          ))}
        </div>
      </Field>

      <Field label="How would you describe your engineering culture?">
        <div className="grid gap-2 sm:grid-cols-2">
          {ENG_CULTURES.map((c) => (
            <RadioCard
              key={c.id}
              checked={values.eng_culture === c.id}
              onChange={() => setField("eng_culture", c.id)}
              label={c.label}
            />
          ))}
        </div>
      </Field>
    </div>
  );
}

// ---------------------------------------------------------------------
// STEP 5 — Hiring situation
// ---------------------------------------------------------------------



function StepHiring({
  values,
  setField,
}: {
  values: WizardValues;
  setField: <K extends keyof WizardValues>(k: K, v: WizardValues[K]) => void;
}) {
  // Local state for interactive choices, prefilled from `values.salary_range`
  const [currency, setCurrency] = useState<Currency>(() => {
    const raw = values.salary_range;
    if (!raw) return "USD";
    if (raw.startsWith("R") || raw.includes("R ") || raw.includes("ZAR")) return "ZAR";
    if (raw.startsWith("€") || raw.includes("EUR")) return "EUR";
    if (raw.startsWith("£") || raw.includes("GBP")) return "GBP";
    return "USD";
  });

  const [frequency, setFrequency] = useState<Frequency>(() => {
    const raw = values.salary_range;
    if (!raw) return "Yearly";
    if (raw.toLowerCase().includes("month")) return "Monthly";
    if (raw.toLowerCase().includes("hr") || raw.toLowerCase().includes("hour")) return "Hourly";
    return "Yearly";
  });

  // Synchronize old keys to new full strings if they exist
  useEffect(() => {
    const raw = values.salary_range;
    if (raw && ["lt-60", "60-100", "100-150", "150-200", "gt-200", "varies"].includes(raw)) {
      const OLD_SALARY_MAP: Record<string, string> = {
        "lt-60": "Under $60K / year",
        "60-100": "$60K – $100K / year",
        "100-150": "$100K – $150K / year",
        "150-200": "$150K – $200K / year",
        "gt-200": "$200K+ / year",
        "varies": "Varies widely",
      };
      setField("salary_range", OLD_SALARY_MAP[raw]);
    }
  }, [values.salary_range, setField]);

  return (
    <div className="space-y-8">
      <Field label="How urgently are you looking to hire?">
        <div className="grid gap-2 sm:grid-cols-2">
          {HIRING_URGENCIES.map((u) => (
            <RadioCard
              key={u.id}
              checked={values.hiring_urgency === u.id}
              onChange={() => setField("hiring_urgency", u.id)}
              label={u.label}
            />
          ))}
        </div>
      </Field>

      <Field label="How many people do you plan to hire in the next 6 months?">
        <div className="grid gap-2 sm:grid-cols-4">
          {HIRING_VOLUMES.map((v) => (
            <RadioCard
              key={v.id}
              checked={values.hiring_volume === v.id}
              onChange={() => setField("hiring_volume", v.id)}
              label={v.label}
            />
          ))}
        </div>
      </Field>

      <div className="space-y-4 rounded-xl border border-edge bg-surface/50 p-5 shadow-glow-soft">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-heading font-raleway">
            Typical salary range
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
              {(["ZAR", "USD", "EUR", "GBP"] as const).map((curr) => {
                const isSelected = currency === curr;
                return (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => {
                      setCurrency(curr);
                      setField("salary_range", ""); // Clear value to force selection
                    }}
                    className={`flex-1 rounded-md py-1.5 text-center text-xs font-semibold transition-all font-raleway ${
                      isSelected
                        ? "bg-accent text-btn-fg shadow-sm border border-accent/15"
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
              {(["Yearly", "Monthly", "Hourly"] as const).map((freq) => {
                const isSelected = frequency === freq;
                return (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => {
                      setFrequency(freq);
                      setField("salary_range", ""); // Clear value to force selection
                    }}
                    className={`flex-1 rounded-md py-1.5 text-center text-xs font-semibold transition-all font-raleway ${
                      isSelected
                        ? "bg-accent text-btn-fg shadow-sm border border-accent/15"
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
                checked={values.salary_range === option.id}
                onChange={() => setField("salary_range", option.id)}
                label={option.label}
              />
            ))}
          </div>
        </div>
      </div>

      <Field label="How do you currently hire technical talent?">
        <div className="space-y-2">
          {HIRING_METHODS.map((m) => (
            <RadioCard
              key={m.id}
              checked={values.hiring_method === m.id}
              onChange={() => setField("hiring_method", m.id)}
              label={m.label}
            />
          ))}
        </div>
      </Field>
    </div>
  );
}

// ---------------------------------------------------------------------
// STEP 6 — Plan selection
// ---------------------------------------------------------------------

function StepPlan({
  values,
  setField,
}: {
  values: WizardValues;
  setField: <K extends keyof WizardValues>(k: K, v: WizardValues[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 text-xs text-body font-raleway">
        Every plan includes <strong className="text-heading">one free job post</strong>.
        We won&apos;t ask for a credit card today — if you pick a paid
        tier, we&apos;ll collect billing when you post your second job.
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {PLANS.map((p) => {
          const on = values.selected_plan === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setField("selected_plan", p.id)}
              className={`group relative flex flex-col rounded-2xl border p-5 text-left transition-all ${
                on
                  ? "border-[3px] border-accent bg-surface shadow-lg shadow-glow-soft"
                  : "border border-edge bg-surface hover:border-accent/50"
              }`}
            >
              {p.recommended && (
                <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-accent font-jetbrains">
                  <Sparkles className="h-3 w-3" />
                  Popular
                </span>
              )}
              <p className="text-xs uppercase tracking-[0.08em] text-subtle font-jetbrains">
                {p.tagline}
              </p>
              <p className="mt-1 text-xl font-bold text-heading font-raleway">
                {p.name}
              </p>
              <div className="mt-4">
                <span className="text-3xl font-bold text-heading font-raleway">
                  {p.price}
                </span>
                <span className="ml-1 text-xs text-subtle font-jetbrains">
                  / {p.priceSub}
                </span>
              </div>
              <ul className="mt-4 space-y-1.5 text-xs text-body font-raleway">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                    {f}
                  </li>
                ))}
              </ul>
              {p.requiresCard && (
                <p className="mt-3 text-[10px] uppercase tracking-[0.08em] text-subtle font-jetbrains">
                  Card required at first paid post
                </p>
              )}
              <div
                className={`mt-4 inline-flex items-center justify-center rounded-lg py-2 text-xs font-semibold font-raleway ${
                  on
                    ? "bg-accent text-white"
                    : "bg-pill-bg text-accent"
                }`}
              >
                {on ? "Selected" : "Select"}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Submit button
// ---------------------------------------------------------------------

function SubmitButton({
  values,
  disabled,
  onBeforeSubmit,
}: {
  values: WizardValues;
  disabled?: boolean;
  onBeforeSubmit?: () => void;
}) {
  const [, action] = useActionState<
    CompanyOnboardingState | undefined,
    FormData
  >(submitCompanyOnboarding, undefined);
  const ref = useRef<HTMLFormElement | null>(null);
  return (
    <form action={action} ref={ref} className="inline-flex">
      <input type="hidden" name="legal_name" value={values.legal_name} />
      <input type="hidden" name="website_url" value={values.website_url} />
      <input type="hidden" name="company_size" value={values.company_size} />
      <input type="hidden" name="hq_country" value={values.hq_country} />
      <input type="hidden" name="company_stage" value={values.company_stage} />
      <input type="hidden" name="logo_path" value={values.logo_path ?? ""} />
      <input
        type="hidden"
        name="logo_filename"
        value={values.logo_filename ?? ""}
      />
      <input
        type="hidden"
        name="industries"
        value={JSON.stringify(values.industries)}
      />
      <input
        type="hidden"
        name="roles_hiring"
        value={JSON.stringify(values.roles_hiring)}
      />
      <input type="hidden" name="work_style" value={values.work_style} />
      <input
        type="hidden"
        name="hiring_regions"
        value={JSON.stringify(values.hiring_regions)}
      />
      <input type="hidden" name="eng_culture" value={values.eng_culture} />
      <input
        type="hidden"
        name="hiring_urgency"
        value={values.hiring_urgency}
      />
      <input type="hidden" name="hiring_volume" value={values.hiring_volume} />
      <input type="hidden" name="salary_range" value={values.salary_range} />
      <input type="hidden" name="hiring_method" value={values.hiring_method} />
      <input type="hidden" name="selected_plan" value={values.selected_plan} />
      <SubmitInner disabled={disabled} onBeforeSubmit={onBeforeSubmit} />
    </form>
  );
}

function SubmitInner({
  disabled,
  onBeforeSubmit,
}: {
  disabled?: boolean;
  onBeforeSubmit?: () => void;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      onClick={() => {
        if (!pending) onBeforeSubmit?.();
      }}
      className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-xs font-semibold text-white transition-all hover:opacity-90 hover:shadow-[0_0_24px_rgba(74,222,128,0.35)] disabled:opacity-50 font-raleway"
    >
      {pending ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Submitting…
        </>
      ) : (
        <>
          Submit for review
          <ArrowRight className="h-3.5 w-3.5" />
        </>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------
// Shared UI primitives
// ---------------------------------------------------------------------

const inputCls =
  "w-full rounded-lg border border-edge bg-surface px-4 py-2.5 text-base text-heading placeholder:text-subtle transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:text-sm font-raleway";

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label
          htmlFor={htmlFor}
          className="text-xs uppercase tracking-[0.08em] text-body font-jetbrains"
        >
          {label}
        </label>
        {hint && (
          <span className="text-[10px] text-subtle font-jetbrains">{hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}

interface TooltipContent {
  description: string;
  example: string;
}

function RadioCard({
  checked,
  onChange,
  label,
  sub,
  tooltip,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  sub?: string;
  tooltip?: TooltipContent;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  // Close tooltip when clicking outside
  useEffect(() => {
    if (!showTooltip) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setShowTooltip(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showTooltip]);

  const cardContent = (
    <>
      <div className="flex flex-col items-start gap-0.5 pr-4">
        <span className="text-sm font-semibold text-heading font-raleway">
          {label}
        </span>
        {sub && (
          <span className="text-[11px] text-subtle font-jetbrains">{sub}</span>
        )}
      </div>

      {tooltip && (
        <div 
          ref={tooltipRef}
          className="absolute right-3 top-3 z-10"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip((prev) => !prev);
            }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="flex h-5 w-5 items-center justify-center rounded-full bg-pill-bg text-subtle transition-colors hover:bg-accent/15 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label={`More information about ${label}`}
          >
            <Info className="h-3.5 w-3.5" />
          </button>

          <AnimatePresence>
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute right-0 bottom-full mb-2 w-72 rounded-xl border border-edge bg-surface p-4 shadow-xl pointer-events-none"
              >
                {/* Arrow */}
                <div className="absolute right-3 top-full h-2 w-2 -translate-y-1 rotate-45 border-b border-r border-edge bg-surface" />
                
                <p className="text-xs font-medium text-heading leading-relaxed font-raleway">
                  {tooltip.description}
                </p>
                <div className="mt-2.5 border-l-2 border-accent bg-accent/5 pl-2.5 py-1 text-[11px] font-medium italic text-accent font-raleway rounded-r-md">
                  {tooltip.example}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </>
  );

  const containerCls = `relative flex w-full flex-col justify-center rounded-xl border px-4 py-3 text-left transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-page ${
    checked
      ? "border-accent bg-accent/5 shadow-[0_0_0_1px_rgba(74,222,128,0.4)]"
      : "border-edge bg-surface hover:border-accent/40"
  }`;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onChange}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onChange();
        }
      }}
      className={containerCls}
    >
      {cardContent}
    </div>
  );
}

function Chip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all font-raleway ${
        active
          ? "border-accent bg-accent text-white"
          : "border-edge bg-surface text-body hover:border-accent/40 hover:text-heading"
      }`}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------
// Country picker (searchable)
// ---------------------------------------------------------------------

function CountryPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  // Parent `value` is the source of truth. No local "query" state — the
  // input is fully controlled by the prop so typing is forwarded on
  // every keystroke (free text is allowed until the user picks one).
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!value) return COUNTRIES.slice(0, 10);
    const lower = value.toLowerCase();
    return COUNTRIES.filter((c) => c.toLowerCase().includes(lower)).slice(0, 10);
  }, [value]);

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // Give clicks on options time to register.
          setTimeout(() => setOpen(false), 150);
        }}
        placeholder="Start typing a country…"
        className={inputCls}
      />
      {open && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-auto rounded-lg border border-edge bg-surface shadow-lg">
          {filtered.map((c) => (
            <button
              key={c}
              type="button"
              onMouseDown={() => {
                onChange(c);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-heading transition-colors hover:bg-page-alt font-raleway"
            >
              {c}
              {c === value && <Check className="h-3.5 w-3.5 text-accent" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Logo uploader — stores in Supabase Storage (company-logos bucket)
// ---------------------------------------------------------------------

function LogoUploader({
  userId,
  logoPath,
  logoFilename,
  onUploaded,
  onRemoved,
}: {
  userId: string;
  logoPath: string | null;
  logoFilename: string | null;
  onUploaded: (path: string, filename: string) => void;
  onRemoved: () => void;
}) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Fetch a signed URL for preview.
  useEffect(() => {
    let alive = true;
    async function run() {
      if (!logoPath) {
        setPreview(null);
        return;
      }
      const { data } = await supabase.storage
        .from("company-logos")
        .createSignedUrl(logoPath, 60 * 10);
      if (alive) setPreview(data?.signedUrl ?? null);
    }
    void run();
    return () => {
      alive = false;
    };
  }, [logoPath, supabase]);

  const onFile = useCallback(
    async (file: File) => {
      setError(null);
      if (file.size > 2 * 1024 * 1024) {
        setError("Logo must be under 2MB.");
        return;
      }
      const ok = [
        "image/png",
        "image/jpeg",
        "image/svg+xml",
        "image/webp",
      ].includes(file.type);
      if (!ok) {
        setError("Only PNG, JPG, SVG or WEBP.");
        return;
      }
      setUploading(true);
      try {
        const ext = file.name.split(".").pop() ?? "png";
        const path = `${userId}/logo-${Date.now()}.${ext}`;
        await uploadToBucket({
          bucket: "company-logos",
          path,
          file,
          upsert: true,
          timeoutMs: 45_000,
        });
        onUploaded(path, file.name);
      } catch (e) {
        console.error("Logo upload error:", e);
        setError(
          e instanceof Error ? e.message : "Couldn't upload logo. Try again."
        );
      } finally {
        setUploading(false);
      }
    },
    [userId, onUploaded]
  );

  if (logoPath) {
    return (
      <div className="flex items-center gap-4 rounded-xl border border-edge bg-page-alt p-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt={logoFilename ?? "Logo preview"}
              className="h-full w-full object-contain"
            />
          ) : (
            <ImagePlus className="h-5 w-5 text-body" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-heading font-raleway">
            {logoFilename ?? "logo"}
          </p>
          <p className="text-[11px] text-subtle font-jetbrains">
            Stored securely · will appear on your job listings
          </p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-xs font-semibold text-accent transition-opacity hover:opacity-70 font-raleway"
        >
          Replace
        </button>
        <button
          type="button"
          onClick={onRemoved}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-body transition-colors hover:bg-surface hover:text-red-500"
          aria-label="Remove logo"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onFile(f);
            e.target.value = "";
          }}
        />
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-edge bg-surface px-6 py-7 text-xs text-body transition-colors hover:border-accent/50 hover:text-heading disabled:opacity-50 font-raleway"
      >
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading…
          </>
        ) : (
          <>
            <UploadCloud className="h-4 w-4 text-accent" />
            Choose a file
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onFile(f);
          e.target.value = "";
        }}
      />
      {error && (
        <div className="mt-2 inline-flex items-start gap-2 text-xs text-red-500 font-raleway">
          <X className="mt-0.5 h-3 w-3" />
          {error}
        </div>
      )}
    </>
  );
}

// Silence unused-import warnings on option lists that might not ship
// with every step once the wizard is used in production.
void ALL_ROLES;
