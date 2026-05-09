"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CompanyApplication } from "@/lib/types/db";

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------

export type JobSubmitState =
  | { ok: true; message: string; jobId: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[] | undefined> };

// ---------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------

const JobSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Job title must be at least 3 characters.")
    .max(120, "Job title must be under 120 characters."),
  role_category: z
    .string()
    .trim()
    .min(1, "Please select a role category."),
  seniority: z
    .string()
    .trim()
    .min(1, "Please select a seniority level."),
  employment_type: z.string().default("full-time"),
  work_arrangement: z.string().default("remote"),
  location: z.string().trim().optional().default(""),
  salary_range: z.string().trim().optional().default(""),
  description: z
    .string()
    .trim()
    .min(120, "Description should be at least 120 characters.")
    .max(10000, "Description must be under 10,000 characters."),
  skills: z
    .array(z.string().trim())
    .min(1, "Add at least one skill.")
    .max(15, "Maximum 15 skills."),
  benefits: z.string().trim().optional().default(""),
});

// ---------------------------------------------------------------------
// Submit job for review
// ---------------------------------------------------------------------

export async function submitJobForReview(
  _prev: JobSubmitState | undefined,
  formData: FormData
): Promise<JobSubmitState> {
  // 1. Authenticate — must be signed in
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "You must be signed in." };
  }

  // 2. Check company is approved
  const { data: appRow } = await supabase
    .from("company_applications")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  const application = appRow as CompanyApplication | null;

  if (!application || application.review_status !== "approved") {
    return { ok: false, message: "Your company must be approved before posting jobs." };
  }

  // 3. Parse skills from FormData (sent as JSON string)
  let skillsArray: string[] = [];
  try {
    const raw = formData.get("skills");
    if (typeof raw === "string") {
      skillsArray = JSON.parse(raw);
    }
  } catch {
    return { ok: false, message: "Invalid skills data." };
  }

  // 4. Validate all fields
  const parsed = JobSchema.safeParse({
    title: formData.get("title"),
    role_category: formData.get("role_category"),
    seniority: formData.get("seniority"),
    employment_type: formData.get("employment_type"),
    work_arrangement: formData.get("work_arrangement"),
    location: formData.get("location"),
    salary_range: formData.get("salary_range"),
    description: formData.get("description"),
    skills: skillsArray,
    benefits: formData.get("benefits"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<
        string,
        string[] | undefined
      >,
    };
  }

  // 5. Quota check
  const plan = application.selected_plan ?? "free";
  const cardCollected = application.card_collected ?? false;
  const isPaidWithCard = plan !== "free" && cardCollected;

  if (!isPaidWithCard) {
    // Free plan or paid-without-card: max 1 job (excluding rejected ones)
    const { count } = await supabase
      .from("company_jobs")
      .select("id", { count: "exact", head: true })
      .eq("company_id", user.id)
      .not("status", "eq", "rejected");

    if ((count ?? 0) >= 1) {
      if (plan === "free") {
        return {
          ok: false,
          message:
            "Free plan allows 1 job posting. Upgrade your plan to post more jobs.",
        };
      } else {
        // Paid plan but no card
        return {
          ok: false,
          message:
            "Please add a payment method on the subscription page before posting additional jobs.",
        };
      }
    }
  }

  // 6. Insert into company_jobs
  const { data: newJob, error: insertErr } = await supabase
    .from("company_jobs")
    .insert({
      company_id: user.id,
      title: parsed.data.title,
      role_category: parsed.data.role_category,
      seniority: parsed.data.seniority,
      employment_type: parsed.data.employment_type,
      work_arrangement: parsed.data.work_arrangement,
      location: parsed.data.location || null,
      salary_range: parsed.data.salary_range || null,
      description: parsed.data.description,
      skills: parsed.data.skills,
      benefits: parsed.data.benefits || null,
      status: "pending_review",
    })
    .select("id")
    .single();

  if (insertErr) {
    console.error("[job-posting] insert error:", insertErr);
    return { ok: false, message: "Failed to submit job posting. Please try again." };
  }

  // 7. Revalidate relevant paths
  revalidatePath("/company/jobs");
  revalidatePath("/admin");

  return {
    ok: true,
    message: "Job submitted for review! We'll notify you once it's approved.",
    jobId: newJob.id,
  };
}
