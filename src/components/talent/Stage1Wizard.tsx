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
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Check,
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadToBucket } from "@/lib/supabase/upload";
import {
  saveStage1Draft,
  submitStage1,
  type Stage1State,
} from "@/app/actions/talent-onboarding";
import type { TalentApplication, WorkExperience } from "@/lib/types/db";

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

type Step = 0 | 1 | 2;

interface FormValues {
  headline: string;
  location: string;
  years_experience: string;
  bio: string;
  linkedin_url: string;
  github_url: string;
  portfolio_url: string;
  skills: string[];
  work_experience: WorkExperience[];
  resume_path: string | null;
  resume_filename: string | null;
}

function emptyRole(): WorkExperience {
  return {
    id: crypto.randomUUID(),
    company: "",
    title: "",
    start: "",
    end: "",
    current: false,
    description: "",
  };
}

// ---------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------

export default function Stage1Wizard({
  userId,
  fullName,
  initial,
}: {
  userId: string;
  fullName: string;
  initial: TalentApplication | null;
}) {
  const supabase = useMemo(() => createClient(), []);

  const [step, setStep] = useState<Step>(0);
  const [values, setValues] = useState<FormValues>(() => ({
    headline: initial?.headline ?? "",
    location: initial?.location ?? "",
    years_experience:
      initial?.years_experience != null ? String(initial.years_experience) : "",
    bio: initial?.bio ?? "",
    linkedin_url: initial?.linkedin_url ?? "",
    github_url: initial?.github_url ?? "",
    portfolio_url: initial?.portfolio_url ?? "",
    skills: initial?.skills ?? [],
    work_experience:
      initial?.work_experience && initial.work_experience.length > 0
        ? initial.work_experience
        : [emptyRole()],
    resume_path: initial?.resume_path ?? null,
    resume_filename: initial?.resume_filename ?? null,
  }));

  const setField = useCallback(<K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
  }, []);

  // ---- Validation per step ----
  const stepErrors = useMemo(() => {
    const errs: string[] = [];
    if (step === 0) {
      if (values.headline.trim().length < 3) errs.push("headline");
      if (values.location.trim().length < 2) errs.push("location");
      if (
        values.years_experience === "" ||
        Number.isNaN(Number(values.years_experience)) ||
        Number(values.years_experience) < 0
      )
        errs.push("years_experience");
      if (values.bio.trim().length < 50) errs.push("bio");
      if (!/^https?:\/\/.+/i.test(values.portfolio_url.trim()))
        errs.push("portfolio_url");
      // Optional URLs — validated only when provided
      if (
        values.linkedin_url.trim() &&
        !/^https?:\/\/.+/i.test(values.linkedin_url.trim())
      )
        errs.push("linkedin_url");
      if (
        values.github_url.trim() &&
        !/^https?:\/\/.+/i.test(values.github_url.trim())
      )
        errs.push("github_url");
    } else if (step === 1) {
      if (values.skills.length < 3) errs.push("skills");
      if (
        values.work_experience.length < 1 ||
        values.work_experience.some(
          (w) =>
            !w.company.trim() ||
            !w.title.trim() ||
            !/^\d{4}-\d{2}$/.test(w.start) ||
            (!w.current && !/^\d{4}-\d{2}$/.test(w.end ?? ""))
        )
      )
        errs.push("work_experience");
    } else if (step === 2) {
      if (!values.resume_path) errs.push("resume");
    }
    return errs;
  }, [step, values]);

  const canProceed = stepErrors.length === 0;

  // ---- Submit action state ----
  const [state, formAction] = useActionState<Stage1State | undefined, FormData>(
    submitStage1,
    undefined
  );

  // ---- Autosave state ----
  const [isSaving, startSave] = useTransition();
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const persistDraft = useCallback(() => {
    setSaveError(null);
    startSave(async () => {
      const yearsNum = Number(values.years_experience);
      const res = await saveStage1Draft({
        headline: values.headline || undefined,
        location: values.location || undefined,
        years_experience:
          values.years_experience !== "" && !Number.isNaN(yearsNum)
            ? yearsNum
            : undefined,
        bio: values.bio || undefined,
        linkedin_url: values.linkedin_url || null,
        github_url: values.github_url || null,
        portfolio_url: values.portfolio_url || null,
        skills: values.skills,
        work_experience: values.work_experience,
        resume_path: values.resume_path,
        resume_filename: values.resume_filename,
      });
      if (!res.ok) {
        setSaveError(res.message ?? "Couldn't save draft.");
      } else {
        setSavedAt(new Date());
      }
    });
  }, [values]);

  const handleContinue = useCallback(() => {
    if (!canProceed) return;
    persistDraft();
    setStep((s) => ((s + 1) as Step));
  }, [canProceed, persistDraft]);

  return (
    <div>
      {/* Step indicator */}
      <StepIndicator step={step} isSaving={isSaving} savedAt={savedAt} />

      {saveError && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-600 font-raleway">
          Couldn&apos;t save draft: {saveError}
        </div>
      )}

      {/* Hidden native form used for final submit */}
      <form action={formAction}>
        <input type="hidden" name="headline" value={values.headline} />
        <input type="hidden" name="location" value={values.location} />
        <input
          type="hidden"
          name="years_experience"
          value={values.years_experience}
        />
        <input type="hidden" name="bio" value={values.bio} />
        <input type="hidden" name="linkedin_url" value={values.linkedin_url} />
        <input type="hidden" name="github_url" value={values.github_url} />
        <input
          type="hidden"
          name="portfolio_url"
          value={values.portfolio_url}
        />
        <input
          type="hidden"
          name="skills"
          value={JSON.stringify(values.skills)}
        />
        <input
          type="hidden"
          name="work_experience"
          value={JSON.stringify(values.work_experience)}
        />
        <input
          type="hidden"
          name="resume_path"
          value={values.resume_path ?? ""}
        />
        <input
          type="hidden"
          name="resume_filename"
          value={values.resume_filename ?? ""}
        />

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.section
              key="step-0"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
            >
              <StepBasics
                values={values}
                setField={setField}
                fullName={fullName}
                errors={state?.fieldErrors}
              />
            </motion.section>
          )}

          {step === 1 && (
            <motion.section
              key="step-1"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
            >
              <StepExperience
                values={values}
                setField={setField}
                errors={state?.fieldErrors}
              />
            </motion.section>
          )}

          {step === 2 && (
            <motion.section
              key="step-2"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
            >
              <StepResume
                userId={userId}
                supabase={supabase}
                values={values}
                setField={setField}
              />
            </motion.section>
          )}
        </AnimatePresence>

        {/* Server error banner */}
        {state?.ok === false && state.message && (
          <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-500 font-raleway">
            {state.message}
          </div>
        )}

        {/* Nav buttons */}
        <div className="mt-10 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => (s > 0 ? ((s - 1) as Step) : s))}
            disabled={step === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-ghost-border px-5 py-2.5 text-sm font-semibold text-ghost-text transition-opacity hover:opacity-80 disabled:opacity-40 font-raleway"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          {step < 2 ? (
            <button
              type="button"
              onClick={handleContinue}
              disabled={!canProceed || isSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-btn-bg px-6 py-2.5 text-sm font-semibold text-btn-fg transition-all hover:opacity-90 hover:shadow-lg disabled:opacity-40 font-raleway"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          ) : (
            <SubmitButton disabled={!canProceed} />
          )}
        </div>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------

function StepIndicator({
  step,
  isSaving,
  savedAt,
}: {
  step: Step;
  isSaving: boolean;
  savedAt: Date | null;
}) {
  const labels = ["Basics", "Experience", "Resume & Review"];
  return (
    <div className="mb-10">
      <div className="mb-3 flex h-4 items-center justify-end">
        <AutosaveIndicator isSaving={isSaving} savedAt={savedAt} />
      </div>
      <div className="flex items-center justify-between gap-2">
        {labels.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <div key={label} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-jetbrains transition-colors ${
                  done
                    ? "bg-accent text-white"
                    : active
                    ? "border-2 border-accent bg-surface text-accent"
                    : "border border-edge bg-surface text-subtle"
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span
                className={`text-xs font-medium transition-colors font-raleway ${
                  done || active ? "text-heading" : "text-subtle"
                }`}
              >
                {label}
              </span>
              {i < labels.length - 1 && (
                <div className="ml-2 h-px flex-1 bg-edge" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AutosaveIndicator({
  isSaving,
  savedAt,
}: {
  isSaving: boolean;
  savedAt: Date | null;
}) {
  if (isSaving) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-subtle font-jetbrains">
        <Loader2 className="h-3 w-3 animate-spin" />
        Saving…
      </span>
    );
  }
  if (savedAt) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-accent font-jetbrains">
        <Check className="h-3 w-3" strokeWidth={3} />
        Saved · {savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </span>
    );
  }
  return null;
}

// ---------------------------------------------------------------------
// STEP 0 — Basics
// ---------------------------------------------------------------------

function StepBasics({
  values,
  setField,
  fullName,
  errors,
}: {
  values: FormValues;
  setField: <K extends keyof FormValues>(k: K, v: FormValues[K]) => void;
  fullName: string;
  errors?: Record<string, string[] | undefined>;
}) {
  return (
    <div className="space-y-6">
      <p className="text-xs text-body font-raleway">
        Signed in as <span className="font-semibold text-heading">{fullName}</span>
      </p>

      <Field label="Headline" hint="e.g. Senior ML Engineer · NLP & RAG systems">
        <input
          type="text"
          value={values.headline}
          onChange={(e) => setField("headline", e.target.value)}
          maxLength={120}
          className="w-full rounded-lg border border-edge bg-surface px-4 py-2.5 text-base text-heading placeholder:text-subtle transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:text-sm font-raleway"
          placeholder="What do you do, in one line?"
        />
        <ErrorText error={errors?.headline?.[0]} />
      </Field>

      <div className="grid items-start gap-6 sm:grid-cols-2">
        <Field label="Location" hint="City, Country — remote is OK">
          <input
            type="text"
            value={values.location}
            onChange={(e) => setField("location", e.target.value)}
            className="w-full rounded-lg border border-edge bg-surface px-4 py-2.5 text-base text-heading placeholder:text-subtle transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:text-sm font-raleway"
            placeholder="Lisbon, Portugal"
          />
          <ErrorText error={errors?.location?.[0]} />
        </Field>

        <Field label="Years of experience" hint="Total time in industry">
          <input
            type="number"
            min={0}
            max={60}
            value={values.years_experience}
            onChange={(e) => setField("years_experience", e.target.value)}
            className="w-full rounded-lg border border-edge bg-surface px-4 py-2.5 text-base text-heading placeholder:text-subtle transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:text-sm font-raleway"
            placeholder="7"
          />
          <ErrorText error={errors?.years_experience?.[0]} />
        </Field>
      </div>

      <Field
        label="Short bio"
        hint="What makes you, you? What are you proud of building? (min 50 characters)"
      >
        <textarea
          value={values.bio}
          onChange={(e) => setField("bio", e.target.value)}
          rows={5}
          maxLength={2000}
          className="w-full resize-y rounded-lg border border-edge bg-surface px-4 py-2.5 text-base text-heading placeholder:text-subtle transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:text-sm font-raleway"
          placeholder="I've spent the last 7 years shipping ML systems to production…"
        />
        <div className="flex items-center justify-between">
          <ErrorText error={errors?.bio?.[0]} />
          <p className="text-[11px] text-subtle font-jetbrains">
            {values.bio.length} / 2000
          </p>
        </div>
      </Field>

      <div className="grid items-start gap-6 sm:grid-cols-3">
        <Field label="LinkedIn" hint="Optional">
          <input
            type="url"
            value={values.linkedin_url}
            onChange={(e) => setField("linkedin_url", e.target.value)}
            className="w-full rounded-lg border border-edge bg-surface px-4 py-2.5 text-base text-heading placeholder:text-subtle transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:text-sm font-raleway"
            placeholder="https://linkedin.com/in/…"
          />
          <ErrorText error={errors?.linkedin_url?.[0]} />
        </Field>
        <Field label="GitHub" hint="Optional">
          <input
            type="url"
            value={values.github_url}
            onChange={(e) => setField("github_url", e.target.value)}
            className="w-full rounded-lg border border-edge bg-surface px-4 py-2.5 text-base text-heading placeholder:text-subtle transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:text-sm font-raleway"
            placeholder="https://github.com/…"
          />
          <ErrorText error={errors?.github_url?.[0]} />
        </Field>
        <Field
          label={
            <>
              Portfolio <span className="text-accent">*</span>
            </>
          }
          hint="Your best work — site, Notion, GitHub repo, anywhere"
        >
          <input
            type="url"
            required
            value={values.portfolio_url}
            onChange={(e) => setField("portfolio_url", e.target.value)}
            className="w-full rounded-lg border border-edge bg-surface px-4 py-2.5 text-base text-heading placeholder:text-subtle transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:text-sm font-raleway"
            placeholder="https://your.site"
          />
          <ErrorText error={errors?.portfolio_url?.[0]} />
        </Field>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// STEP 1 — Experience
// ---------------------------------------------------------------------

function StepExperience({
  values,
  setField,
  errors,
}: {
  values: FormValues;
  setField: <K extends keyof FormValues>(k: K, v: FormValues[K]) => void;
  errors?: Record<string, string[] | undefined>;
}) {
  const [skillInput, setSkillInput] = useState("");

  const addSkill = () => {
    const raw = skillInput.trim();
    if (!raw) return;
    if (values.skills.includes(raw)) {
      setSkillInput("");
      return;
    }
    if (values.skills.length >= 20) return;
    setField("skills", [...values.skills, raw]);
    setSkillInput("");
  };

  const removeSkill = (s: string) =>
    setField(
      "skills",
      values.skills.filter((x) => x !== s)
    );

  const updateRole = (id: string, patch: Partial<WorkExperience>) =>
    setField(
      "work_experience",
      values.work_experience.map((w) => (w.id === id ? { ...w, ...patch } : w))
    );

  const removeRole = (id: string) =>
    setField(
      "work_experience",
      values.work_experience.filter((w) => w.id !== id)
    );

  const addRole = () =>
    setField("work_experience", [...values.work_experience, emptyRole()]);

  return (
    <div className="space-y-8">
      {/* Skills */}
      <Field
        label="Skills & stack"
        hint="Add 3–20 skills. Press Enter or comma to add each."
      >
        <div className="flex flex-wrap gap-2 rounded-lg border border-edge bg-surface p-3 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
          {values.skills.map((s) => (
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
                values.skills.length > 0
              ) {
                setField("skills", values.skills.slice(0, -1));
              }
            }}
            placeholder={
              values.skills.length === 0
                ? "TypeScript, Python, Postgres…"
                : "Add another…"
            }
            className="min-w-[140px] flex-1 border-none bg-transparent text-sm text-heading placeholder:text-subtle focus:outline-none font-raleway"
          />
        </div>
        <ErrorText error={errors?.skills?.[0]} />
        <p className="mt-1 text-[11px] text-subtle font-jetbrains">
          {values.skills.length} / 20
        </p>
      </Field>

      {/* Work experience */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <label className="text-xs uppercase tracking-[0.08em] text-body font-jetbrains">
              Work experience
            </label>
            <p className="text-xs text-subtle font-raleway">
              Add at least one role. Start with your current or most recent.
            </p>
          </div>
          <button
            type="button"
            onClick={addRole}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ghost-border px-3 py-1.5 text-xs font-semibold text-ghost-text transition-opacity hover:opacity-80 font-raleway"
          >
            <Plus className="h-3.5 w-3.5" />
            Add role
          </button>
        </div>

        <div className="space-y-4">
          {values.work_experience.map((role, idx) => (
            <RoleCard
              key={role.id}
              role={role}
              index={idx}
              canRemove={values.work_experience.length > 1}
              onChange={(patch) => updateRole(role.id, patch)}
              onRemove={() => removeRole(role.id)}
            />
          ))}
        </div>
        <ErrorText error={errors?.work_experience?.[0]} />
      </div>
    </div>
  );
}

function RoleCard({
  role,
  index,
  canRemove,
  onChange,
  onRemove,
}: {
  role: WorkExperience;
  index: number;
  canRemove: boolean;
  onChange: (patch: Partial<WorkExperience>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-2xl border border-edge bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pill-bg text-accent">
            <Briefcase className="h-4 w-4" />
          </div>
          <span className="text-xs uppercase tracking-[0.08em] text-body font-jetbrains">
            Role {String(index + 1).padStart(2, "0")}
          </span>
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-body transition-colors hover:bg-red-500/10 hover:text-red-500"
            aria-label="Remove role"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          type="text"
          value={role.company}
          onChange={(e) => onChange({ company: e.target.value })}
          className="w-full rounded-lg border border-edge bg-page-alt px-4 py-2.5 text-sm text-heading placeholder:text-subtle focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 font-raleway"
          placeholder="Company"
        />
        <input
          type="text"
          value={role.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="w-full rounded-lg border border-edge bg-page-alt px-4 py-2.5 text-sm text-heading placeholder:text-subtle focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 font-raleway"
          placeholder="Your title"
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-[11px] text-subtle font-jetbrains">
            Start
          </label>
          <input
            type="month"
            value={role.start}
            onChange={(e) => onChange({ start: e.target.value })}
            className="mt-1 w-full rounded-lg border border-edge bg-page-alt px-4 py-2.5 text-sm text-heading focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 font-raleway"
          />
        </div>
        <div>
          <label className="text-[11px] text-subtle font-jetbrains">End</label>
          <input
            type="month"
            value={role.end ?? ""}
            disabled={role.current}
            onChange={(e) => onChange({ end: e.target.value })}
            className="mt-1 w-full rounded-lg border border-edge bg-page-alt px-4 py-2.5 text-sm text-heading focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50 font-raleway"
          />
          <label className="mt-2 inline-flex items-center gap-2 text-xs text-body font-raleway">
            <input
              type="checkbox"
              checked={role.current}
              onChange={(e) =>
                onChange({
                  current: e.target.checked,
                  end: e.target.checked ? null : "",
                })
              }
              className="h-3.5 w-3.5 rounded border-edge text-accent focus:ring-accent/30"
            />
            I currently work here
          </label>
        </div>
      </div>

      <textarea
        value={role.description}
        onChange={(e) => onChange({ description: e.target.value })}
        rows={3}
        className="mt-3 w-full resize-y rounded-lg border border-edge bg-page-alt px-4 py-2.5 text-sm text-heading placeholder:text-subtle focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 font-raleway"
        placeholder="What did you build? What impact did it have? (optional but recommended)"
      />
    </div>
  );
}

// ---------------------------------------------------------------------
// STEP 2 — Resume & Review
// ---------------------------------------------------------------------

function StepResume({
  userId,
  supabase,
  values,
  setField,
}: {
  userId: string;
  supabase: ReturnType<typeof createClient>;
  values: FormValues;
  setField: <K extends keyof FormValues>(k: K, v: FormValues[K]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const openPreview = useCallback(async () => {
    if (!values.resume_path) return;
    setPreviewLoading(true);
    const { data, error: err } = await supabase.storage
      .from("resumes")
      .createSignedUrl(values.resume_path, 60 * 5); // 5-minute link
    setPreviewLoading(false);
    if (err || !data?.signedUrl) {
      setError(err?.message ?? "Couldn't open resume.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  }, [supabase, values.resume_path]);

  const onFile = useCallback(
    async (file: File) => {
      setError(null);
      const allowed = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowed.includes(file.type)) {
        setError("Please upload a PDF, DOC, or DOCX file.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("File must be under 10 MB.");
        return;
      }

      setUploading(true);

      try {
        const ext = file.name.split(".").pop() ?? "pdf";
        const path = `${userId}/resume-${Date.now()}.${ext}`;

        await uploadToBucket({
          bucket: "resumes",
          path,
          file,
          upsert: false,
          timeoutMs: 60_000,
        });

        setField("resume_path", path);
        setField("resume_filename", file.name);
      } catch (e) {
        console.error("Resume upload error:", e);
        setError(
          e instanceof Error ? e.message : "Couldn't upload resume. Try again."
        );
      } finally {
        setUploading(false);
      }
    },
    [userId, setField]
  );

  const removeResume = () => {
    setField("resume_path", null);
    setField("resume_filename", null);
  };

  return (
    <div className="space-y-8">
      {/* Upload */}
      <Field
        label="Resume"
        hint="PDF, DOC, or DOCX. Max 10 MB. We extract details for our AI to review in stage 2."
      >
        {!values.resume_path ? (
          <label
            htmlFor="resume-file"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) void onFile(f);
            }}
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-edge bg-surface px-6 py-10 text-center transition-colors hover:border-accent hover:bg-accent/5"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pill-bg text-accent">
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Upload className="h-5 w-5" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-heading font-raleway">
                {uploading ? "Uploading…" : "Drop your resume here, or click to choose"}
              </p>
              <p className="mt-1 text-xs text-subtle font-raleway">
                PDF / DOC / DOCX · up to 10 MB
              </p>
            </div>
            <input
              id="resume-file"
              ref={inputRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onFile(f);
              }}
            />
          </label>
        ) : (
          <div className="rounded-2xl border border-accent bg-accent/5 p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-heading font-raleway">
                  {values.resume_filename ?? "Resume uploaded"}
                </p>
                <p className="text-xs text-body font-raleway">
                  Stored securely — only you can view this.
                </p>
              </div>
              <button
                type="button"
                onClick={removeResume}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-body transition-colors hover:bg-red-500/10 hover:text-red-500"
                aria-label="Remove resume"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-accent/20 pt-4">
              <button
                type="button"
                onClick={openPreview}
                disabled={previewLoading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-ghost-border bg-surface px-3 py-1.5 text-xs font-semibold text-heading transition-opacity hover:opacity-80 disabled:opacity-50 font-raleway"
              >
                {previewLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ExternalLink className="h-3.5 w-3.5" />
                )}
                View uploaded resume
              </button>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-ghost-border bg-surface px-3 py-1.5 text-xs font-semibold text-heading transition-opacity hover:opacity-80 font-raleway"
              >
                <Upload className="h-3.5 w-3.5" />
                Replace
              </button>
              <input
                id="resume-file-replace"
                ref={inputRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onFile(f);
                }}
              />
            </div>
          </div>
        )}
        {error && (
          <p className="mt-2 text-xs text-red-500 font-raleway">{error}</p>
        )}
      </Field>

      {/* Review summary */}
      <div className="rounded-2xl border border-edge bg-surface p-6">
        <div className="mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold text-heading font-raleway">
            Review before you submit
          </h3>
        </div>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <ReviewRow label="Headline" value={values.headline} />
          <ReviewRow label="Location" value={values.location} />
          <ReviewRow
            label="Years of experience"
            value={values.years_experience}
          />
          <ReviewRow
            label="Skills"
            value={values.skills.join(", ")}
            full
          />
          <ReviewRow
            label="Roles"
            value={`${values.work_experience.length} role${
              values.work_experience.length === 1 ? "" : "s"
            }`}
          />
          <ReviewRow
            label="Resume"
            value={values.resume_filename ?? "Not uploaded"}
          />
        </dl>
      </div>
    </div>
  );
}

function ReviewRow({
  label,
  value,
  full,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <dt className="text-[11px] uppercase tracking-[0.08em] text-subtle font-jetbrains">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-heading font-raleway">
        {value || <span className="text-subtle">—</span>}
      </dd>
    </div>
  );
}

// ---------------------------------------------------------------------
// Shared little UI bits
// ---------------------------------------------------------------------

function Field({
  label,
  hint,
  children,
}: {
  label: React.ReactNode;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs uppercase tracking-[0.08em] text-body font-jetbrains">
        {label}
      </label>
      {hint && <p className="mb-2 text-xs text-subtle font-raleway">{hint}</p>}
      {children}
    </div>
  );
}

function ErrorText({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="mt-1 text-xs text-red-500 font-raleway">{error}</p>;
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-[0_0_30px_rgba(74,222,128,0.3)] disabled:opacity-40 font-raleway"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
        </>
      ) : (
        <>
          Submit Stage 1 <ArrowRight className="h-4 w-4" />
        </>
      )}
    </button>
  );
}

// Make unused-var suppression explicit for `useTransition` import in future stages.
void useTransition;
void useEffect;
