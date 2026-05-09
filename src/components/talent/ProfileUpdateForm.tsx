"use client";

import { useActionState, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { FileText, Loader2, Plus, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { resubmitProfileUpdate, type ProfileUpdateState } from "@/app/actions/talent-profile";
import type { TalentApplication, WorkExperience } from "@/lib/types/db";
import { uploadToBucket } from "@/lib/supabase/upload";

// Re-use simple components from onboarding if needed or inline them here.
// To keep it self-contained, we'll inline the necessary UI elements.

interface FormValues {
  avatar_url: string | null;
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

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return "Unknown error";
}

export default function ProfileUpdateForm({
  userId,
  initial,
}: {
  userId: string;
  initial: TalentApplication;
}) {
  const supabase = useMemo(() => createClient(), []);

  const [values, setValues] = useState<FormValues>(() => ({
    avatar_url: initial.avatar_url ?? null,
    headline: initial.headline ?? "",
    location: initial.location ?? "",
    years_experience: initial.years_experience != null ? String(initial.years_experience) : "",
    bio: initial.bio ?? "",
    linkedin_url: initial.linkedin_url ?? "",
    github_url: initial.github_url ?? "",
    portfolio_url: initial.portfolio_url ?? "",
    skills: initial.skills ?? [],
    work_experience: initial.work_experience && initial.work_experience.length > 0 ? initial.work_experience : [emptyRole()],
    resume_path: initial.resume_path ?? null,
    resume_filename: initial.resume_filename ?? null,
  }));

  const setField = useCallback(<K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
  }, []);

  const [state, formAction] = useActionState<ProfileUpdateState | undefined, FormData>(
    resubmitProfileUpdate,
    undefined
  );

  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Avatar upload logic
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image is too large. Max 2MB.");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;

      await uploadToBucket({
        bucket: "avatars",
        path,
        file,
        upsert: false,
      });

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      setField("avatar_url", publicUrl);
    } catch (err) {
      alert(`Avatar upload failed: ${getErrorMessage(err)}`);
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = "";
    }
  };

  // Resume upload logic
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Max 5MB.");
      return;
    }

    setIsUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;

      await uploadToBucket({
        bucket: "resumes",
        path,
        file,
        upsert: false,
      });

      setField("resume_path", path);
      setField("resume_filename", file.name);
    } catch (err) {
      alert(`Upload failed: ${getErrorMessage(err)}`);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  // Skill logic
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
  const removeSkill = (s: string) => setField("skills", values.skills.filter((x) => x !== s));

  // Role logic
  const updateRole = (id: string, patch: Partial<WorkExperience>) =>
    setField("work_experience", values.work_experience.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  const removeRole = (id: string) => setField("work_experience", values.work_experience.filter((w) => w.id !== id));
  const addRole = () => setField("work_experience", [...values.work_experience, emptyRole()]);

  const errors = state?.fieldErrors;

  return (
    <form action={formAction} className="space-y-10">
      <input type="hidden" name="avatar_url" value={values.avatar_url ?? ""} />
      <input type="hidden" name="headline" value={values.headline} />
      <input type="hidden" name="location" value={values.location} />
      <input type="hidden" name="years_experience" value={values.years_experience} />
      <input type="hidden" name="bio" value={values.bio} />
      <input type="hidden" name="linkedin_url" value={values.linkedin_url} />
      <input type="hidden" name="github_url" value={values.github_url} />
      <input type="hidden" name="portfolio_url" value={values.portfolio_url} />
      <input type="hidden" name="skills" value={JSON.stringify(values.skills)} />
      <input type="hidden" name="work_experience" value={JSON.stringify(values.work_experience)} />
      <input type="hidden" name="resume_path" value={values.resume_path ?? ""} />
      <input type="hidden" name="resume_filename" value={values.resume_filename ?? ""} />

      {/* Basics */}
      <section className="space-y-6 rounded-2xl border border-edge bg-surface p-6">
        <h2 className="text-sm uppercase tracking-[0.08em] text-body font-jetbrains">Basic Info</h2>
        
        <Field label="Avatar">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-page-alt border border-edge flex items-center justify-center">
              {values.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={values.avatar_url} alt="Avatar preview" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-subtle font-jetbrains">None</span>
              )}
            </div>
            <label className="cursor-pointer rounded-lg border border-edge bg-page-alt px-4 py-2 text-xs font-semibold text-heading transition-hover hover:border-accent font-raleway flex items-center gap-2">
              {isUploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upload Image"}
              <input type="file" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
            </label>
            {values.avatar_url && (
              <button type="button" onClick={() => setField("avatar_url", null)} className="text-xs text-red-500 hover:underline font-raleway">Remove</button>
            )}
          </div>
          <ErrorText error={errors?.avatar_url?.[0]} />
        </Field>

        <Field label="Headline">
          <input type="text" value={values.headline} onChange={(e) => setField("headline", e.target.value)} className="w-full rounded-lg border border-edge bg-page-alt px-4 py-2 text-sm text-heading font-raleway focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
          <ErrorText error={errors?.headline?.[0]} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Location">
            <input type="text" value={values.location} onChange={(e) => setField("location", e.target.value)} className="w-full rounded-lg border border-edge bg-page-alt px-4 py-2 text-sm text-heading font-raleway focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
            <ErrorText error={errors?.location?.[0]} />
          </Field>
          <Field label="Years of Experience">
            <input type="number" value={values.years_experience} onChange={(e) => setField("years_experience", e.target.value)} className="w-full rounded-lg border border-edge bg-page-alt px-4 py-2 text-sm text-heading font-raleway focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
            <ErrorText error={errors?.years_experience?.[0]} />
          </Field>
        </div>
        <Field label="Bio">
          <textarea value={values.bio} onChange={(e) => setField("bio", e.target.value)} rows={4} className="w-full rounded-lg border border-edge bg-page-alt px-4 py-2 text-sm text-heading font-raleway focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
          <ErrorText error={errors?.bio?.[0]} />
        </Field>
      </section>

      {/* Links */}
      <section className="space-y-6 rounded-2xl border border-edge bg-surface p-6">
        <h2 className="text-sm uppercase tracking-[0.08em] text-body font-jetbrains">Links</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Portfolio *">
            <input type="url" value={values.portfolio_url} onChange={(e) => setField("portfolio_url", e.target.value)} className="w-full rounded-lg border border-edge bg-page-alt px-4 py-2 text-sm text-heading font-raleway focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
            <ErrorText error={errors?.portfolio_url?.[0]} />
          </Field>
          <Field label="LinkedIn">
            <input type="url" value={values.linkedin_url} onChange={(e) => setField("linkedin_url", e.target.value)} className="w-full rounded-lg border border-edge bg-page-alt px-4 py-2 text-sm text-heading font-raleway focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
          </Field>
          <Field label="GitHub">
            <input type="url" value={values.github_url} onChange={(e) => setField("github_url", e.target.value)} className="w-full rounded-lg border border-edge bg-page-alt px-4 py-2 text-sm text-heading font-raleway focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
          </Field>
        </div>
      </section>

      {/* Skills & Experience */}
      <section className="space-y-8 rounded-2xl border border-edge bg-surface p-6">
        <h2 className="text-sm uppercase tracking-[0.08em] text-body font-jetbrains">Skills & Experience</h2>
        
        <Field label="Skills">
          <div className="flex flex-wrap gap-2 rounded-lg border border-edge bg-page-alt p-3 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent">
            {values.skills.map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5 rounded-full bg-pill-bg px-3 py-1 text-xs font-medium text-pill-text font-raleway">
                {s}
                <button type="button" onClick={() => removeSkill(s)} className="hover:opacity-70"><X className="h-3 w-3" /></button>
              </span>
            ))}
            <input type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addSkill(); } else if (e.key === "Backspace" && !skillInput && values.skills.length) removeSkill(values.skills[values.skills.length - 1]); }} placeholder="Add a skill..." className="flex-1 bg-transparent text-sm text-heading outline-none font-raleway" />
          </div>
          <ErrorText error={errors?.skills?.[0]} />
        </Field>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-heading font-raleway">Work Roles</label>
            <button type="button" onClick={addRole} className="text-xs text-accent font-semibold flex items-center gap-1 hover:underline"><Plus className="h-3 w-3" /> Add Role</button>
          </div>
          {values.work_experience.map((role) => (
            <div key={role.id} className="rounded-xl border border-edge bg-page-alt p-4 space-y-3 relative">
              {values.work_experience.length > 1 && (
                <button type="button" onClick={() => removeRole(role.id)} className="absolute top-4 right-4 text-subtle hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
              )}
              <div className="grid gap-3 sm:grid-cols-2 pr-8">
                <input type="text" value={role.company} onChange={(e) => updateRole(role.id, { company: e.target.value })} placeholder="Company" className="w-full rounded-md border border-edge bg-surface px-3 py-2 text-sm text-heading outline-none focus:border-accent font-raleway" />
                <input type="text" value={role.title} onChange={(e) => updateRole(role.id, { title: e.target.value })} placeholder="Title" className="w-full rounded-md border border-edge bg-surface px-3 py-2 text-sm text-heading outline-none focus:border-accent font-raleway" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] text-subtle">Start</label>
                  <input type="month" value={role.start} onChange={(e) => updateRole(role.id, { start: e.target.value })} className="w-full rounded-md border border-edge bg-surface px-3 py-2 text-sm text-heading outline-none focus:border-accent font-raleway" />
                </div>
                <div>
                  <label className="text-[10px] text-subtle">End</label>
                  <input type="month" value={role.end ?? ""} disabled={role.current} onChange={(e) => updateRole(role.id, { end: e.target.value })} className="w-full rounded-md border border-edge bg-surface px-3 py-2 text-sm text-heading outline-none focus:border-accent disabled:opacity-50 font-raleway" />
                  <label className="mt-1 flex items-center gap-2 text-[11px] text-body"><input type="checkbox" checked={role.current} onChange={(e) => updateRole(role.id, { current: e.target.checked, end: e.target.checked ? null : "" })} className="rounded" /> Current role</label>
                </div>
              </div>
              <textarea value={role.description} onChange={(e) => updateRole(role.id, { description: e.target.value })} placeholder="Description" rows={2} className="w-full rounded-md border border-edge bg-surface px-3 py-2 text-sm text-heading outline-none focus:border-accent font-raleway" />
            </div>
          ))}
          <ErrorText error={errors?.work_experience?.[0]} />
        </div>
      </section>

      {/* Resume */}
      <section className="space-y-4 rounded-2xl border border-edge bg-surface p-6">
        <h2 className="text-sm uppercase tracking-[0.08em] text-body font-jetbrains">Resume</h2>
        <div className="flex items-center gap-4">
          {values.resume_filename ? (
            <div className="flex flex-1 items-center gap-3 rounded-lg border border-edge bg-page-alt px-4 py-3">
              <FileText className="h-5 w-5 text-accent" />
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-heading font-raleway">{values.resume_filename}</p></div>
              <button type="button" onClick={() => { setField("resume_path", null); setField("resume_filename", null); }} className="text-subtle hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
            </div>
          ) : (
            <div className="flex-1">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-edge bg-page-alt px-4 py-6 text-sm font-medium text-heading hover:bg-surface transition-colors font-raleway">
                {isUploading ? <Loader2 className="h-5 w-5 animate-spin text-accent" /> : <Plus className="h-5 w-5 text-accent" />}
                {isUploading ? "Uploading..." : "Upload PDF"}
                <input type="file" accept="application/pdf" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
              </label>
            </div>
          )}
        </div>
      </section>

      {state?.ok === false && <p className="text-red-500 text-sm font-raleway">{state.message}</p>}

      <div className="flex items-center gap-4 pt-4 border-t border-edge">
        <Link href="/talent" className="px-5 py-2.5 text-sm font-medium text-body hover:text-heading transition-colors font-raleway rounded-lg">Cancel</Link>
        <button type="submit" className="px-6 py-2.5 rounded-lg bg-accent text-sm font-semibold text-white shadow-md hover:bg-accent/90 transition-all font-raleway">Resubmit for Review</button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] uppercase tracking-[0.08em] text-body font-jetbrains">{label}</label>
      {children}
    </div>
  );
}

function ErrorText({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="mt-1.5 text-[11px] text-red-500 font-raleway">{error}</p>;
}
