"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TalentApplication, WorkExperience } from "@/lib/types/db";

type ApprovedTalentSnapshot = Pick<
  TalentApplication,
  | "avatar_url"
  | "headline"
  | "location"
  | "years_experience"
  | "bio"
  | "linkedin_url"
  | "github_url"
  | "portfolio_url"
  | "skills"
  | "work_experience"
  | "resume_path"
  | "resume_filename"
>;

// ---------------------------------------------------------------------
// Schema (reused logic from onboarding)
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

const ProfileUpdateSchema = z.object({
  avatar_url: urlOrEmpty,
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

export type ProfileUpdateState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

// ---------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------

export async function hideProfileForEdit() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: app } = await supabase.from("talent_applications").select("*").eq("user_id", user.id).single();
  if (!app) throw new Error("Profile not found");

  if (app.review_status !== "approved") {
    throw new Error("Only approved live profiles can be hidden for editing.");
  }

  // Snapshot current state for admin diff
  const previousState: ApprovedTalentSnapshot = {
    avatar_url: app.avatar_url,
    headline: app.headline,
    location: app.location,
    years_experience: app.years_experience,
    bio: app.bio,
    linkedin_url: app.linkedin_url,
    github_url: app.github_url,
    portfolio_url: app.portfolio_url,
    skills: app.skills,
    work_experience: app.work_experience,
    resume_path: app.resume_path,
    resume_filename: app.resume_filename,
  };

  const { error } = await supabase.from("talent_applications").update({
    review_status: "hidden",
    previous_approved_state: previousState
  }).eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/talent/profile");
}

export async function resubmitProfileUpdate(_prev: ProfileUpdateState | undefined, formData: FormData): Promise<ProfileUpdateState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not authenticated." };

  let skills: string[] = [];
  let workExperience: WorkExperience[] = [];
  try {
    skills = JSON.parse(String(formData.get("skills") ?? "[]"));
    workExperience = JSON.parse(String(formData.get("work_experience") ?? "[]"));
  } catch {
    return { ok: false, message: "Invalid form payload." };
  }

  const parsed = ProfileUpdateSchema.safeParse({
    avatar_url: formData.get("avatar_url"),
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
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[] | undefined>,
      message: "Please fix the highlighted fields.",
    };
  }

  const resume_path = (formData.get("resume_path") as string) || null;
  const resume_filename = (formData.get("resume_filename") as string) || null;

  if (!resume_path) {
    return { ok: false, message: "Please upload your resume before submitting." };
  }

  // Update profile and set status to pending_update
  const { error } = await supabase.from("talent_applications").update({
    avatar_url: parsed.data.avatar_url,
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
    review_status: "pending_update"
  }).eq("user_id", user.id);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/talent/profile");
  return { ok: true };
}

export async function revertProfileToPrevious() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: app } = await supabase.from("talent_applications").select("previous_approved_state").eq("user_id", user.id).single();
  if (!app || !app.previous_approved_state) {
    throw new Error("No previous state to revert to.");
  }

  const prevState = app.previous_approved_state as ApprovedTalentSnapshot;

  const { error } = await supabase.from("talent_applications").update({
    avatar_url: prevState.avatar_url,
    headline: prevState.headline,
    location: prevState.location,
    years_experience: prevState.years_experience,
    bio: prevState.bio,
    linkedin_url: prevState.linkedin_url,
    github_url: prevState.github_url,
    portfolio_url: prevState.portfolio_url,
    skills: prevState.skills,
    work_experience: prevState.work_experience,
    resume_path: prevState.resume_path,
    resume_filename: prevState.resume_filename,
    previous_approved_state: null,
    review_status: "hidden" // Keep it hidden but reverted
  }).eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/talent/profile");
}

export async function makeProfileLive() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Only allow making live if there are no pending changes that need review
  const { data: app } = await supabase.from("talent_applications").select("review_status, previous_approved_state").eq("user_id", user.id).single();
  
  if (!app) throw new Error("Profile not found");
  if (app.review_status !== "hidden" && app.review_status !== "rejected") {
    throw new Error("Profile must be hidden or rejected to make live.");
  }

  // Clear previous state just in case, and set back to approved
  const { error } = await supabase.from("talent_applications").update({
    review_status: "approved",
    previous_approved_state: null
  }).eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/talent/profile");
}
