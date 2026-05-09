"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { WorkExperience } from "@/lib/types/db";

export type Stage1State = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

// ---------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------

const urlOrEmpty = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === "" ? null : v ?? null))
  .refine((v) => v === null || /^https?:\/\/.+/i.test(v), {
    error: "Must start with http:// or https://",
  });

const urlRequired = z
  .string()
  .trim()
  .min(1, "Portfolio URL is required.")
  .regex(/^https?:\/\/.+/i, "Must start with http:// or https://");

const WorkExperienceSchema: z.ZodType<WorkExperience> = z.object({
  id: z.string(),
  company: z.string().min(1, "Required").trim(),
  title: z.string().min(1, "Required").trim(),
  start: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Use YYYY-MM format"),
  end: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Use YYYY-MM format")
    .nullable(),
  current: z.boolean(),
  description: z.string().trim(),
});

const Stage1Schema = z.object({
  headline: z
    .string()
    .min(3, "Headline must be at least 3 characters.")
    .max(120, "Keep it under 120 characters.")
    .trim(),
  location: z.string().min(2, "Please add a location.").trim(),
  years_experience: z.coerce
    .number({ error: "Years of experience is required." })
    .int()
    .min(0, "Cannot be negative.")
    .max(60, "That seems unrealistic."),
  bio: z
    .string()
    .min(50, "Tell us at least 50 characters about yourself.")
    .max(2000, "Keep it under 2000 characters.")
    .trim(),
  linkedin_url: urlOrEmpty,
  github_url: urlOrEmpty,
  portfolio_url: urlRequired,
  skills: z
    .array(z.string().trim().min(1))
    .min(3, "Add at least 3 skills.")
    .max(20, "Cap it at 20 skills — pick what matters most."),
  work_experience: z
    .array(WorkExperienceSchema)
    .min(1, "Add at least one role."),
});

// ---------------------------------------------------------------------
// Submit stage-1
// ---------------------------------------------------------------------

export async function submitStage1(
  _prev: Stage1State | undefined,
  formData: FormData
): Promise<Stage1State> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not authenticated." };

  // Parse JSON blobs from form (skills, work_experience) safely.
  let skills: string[] = [];
  let workExperience: WorkExperience[] = [];
  try {
    skills = JSON.parse(String(formData.get("skills") ?? "[]"));
    workExperience = JSON.parse(
      String(formData.get("work_experience") ?? "[]")
    );
  } catch {
    return { ok: false, message: "Invalid form payload." };
  }

  const parsed = Stage1Schema.safeParse({
    headline: formData.get("headline"),
    location: formData.get("location"),
    years_experience: formData.get("years_experience"),
    bio: formData.get("bio"),
    linkedin_url: formData.get("linkedin_url"),
    github_url: formData.get("github_url"),
    portfolio_url: formData.get("portfolio_url"),
    skills,
    work_experience: workExperience,
  });

  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<
        string,
        string[] | undefined
      >,
      message: "Please fix the highlighted fields.",
    };
  }

  const resume_path = (formData.get("resume_path") as string) || null;
  const resume_filename = (formData.get("resume_filename") as string) || null;

  if (!resume_path) {
    return { ok: false, message: "Please upload your resume before submitting." };
  }

  // Upsert application row.
  const { error: upsertErr } = await supabase.from("talent_applications").upsert(
    {
      user_id: user.id,
      headline: parsed.data.headline,
      location: parsed.data.location,
      years_experience: parsed.data.years_experience,
      bio: parsed.data.bio,
      linkedin_url: parsed.data.linkedin_url,
      github_url: parsed.data.github_url,
      portfolio_url: parsed.data.portfolio_url,
      skills: parsed.data.skills,
      work_experience: parsed.data.work_experience,
      resume_path,
      resume_filename,
      stage_1_submitted_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (upsertErr) {
    return { ok: false, message: upsertErr.message };
  }

  // Bump profile stage.
  const { error: profileErr } = await supabase
    .from("profiles")
    .update({ onboarding_stage: 1 })
    .eq("id", user.id);
  if (profileErr) {
    return { ok: false, message: profileErr.message };
  }

  revalidatePath("/", "layout");
  // Hand off to Stage 2 — the AI analysis kicks off there.
  redirect("/talent/onboarding/stage-2");
}

// ---------------------------------------------------------------------
// Save draft (autosave between steps) — optional but nice UX.
// ---------------------------------------------------------------------

export async function saveStage1Draft(
  data: Partial<{
    headline: string;
    location: string;
    years_experience: number;
    bio: string;
    linkedin_url: string | null;
    github_url: string | null;
    portfolio_url: string | null;
    skills: string[];
    work_experience: WorkExperience[];
    resume_path: string | null;
    resume_filename: string | null;
  }>
): Promise<{ ok: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not authenticated." };

  const { error } = await supabase.from("talent_applications").upsert(
    { user_id: user.id, ...data },
    { onConflict: "user_id" }
  );
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}
