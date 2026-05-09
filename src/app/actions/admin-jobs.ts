"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { jobApprovedEmail, jobRejectedEmail } from "@/lib/email/templates";

export type AdminJobActionState =
  | { ok: true; message?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[] | undefined> };

// Helper: look up company email + name for a given company_id (user_id)
async function getCompanyContact(companyId: string) {
  const admin = createAdminClient();
  const [profileRes, appRes] = await Promise.all([
    admin.from("profiles").select("email").eq("id", companyId).maybeSingle(),
    admin
      .from("company_applications")
      .select("legal_name")
      .eq("user_id", companyId)
      .maybeSingle(),
  ]);
  return {
    email: (profileRes.data as { email: string | null } | null)?.email ?? null,
    companyName:
      (appRes.data as { legal_name: string | null } | null)?.legal_name ??
      "Your company",
  };
}

// ---------------------------------------------------------------------
// Approve & publish a job posting
// ---------------------------------------------------------------------

const ApproveJobSchema = z.object({
  job_id: z.string().uuid(),
});

export async function approveJob(
  _prev: AdminJobActionState | undefined,
  formData: FormData
): Promise<AdminJobActionState> {
  const reviewer = await assertAdmin();

  const parsed = ApproveJobSchema.safeParse({
    job_id: formData.get("job_id"),
  });
  if (!parsed.success) {
    return { ok: false, message: "Invalid payload." };
  }

  const admin = createAdminClient();

  // Verify the job exists and is pending_review
  const { data: job } = await admin
    .from("company_jobs")
    .select("id, company_id, title, status")
    .eq("id", parsed.data.job_id)
    .maybeSingle();

  if (!job) {
    return { ok: false, message: "Job posting not found." };
  }
  if (job.status !== "pending_review") {
    return { ok: false, message: `Job is already ${job.status}.` };
  }

  const { error: updErr } = await admin
    .from("company_jobs")
    .update({
      status: "published",
      reviewed_by: reviewer.id,
      reviewed_at: new Date().toISOString(),
      review_reason: null,
    })
    .eq("id", parsed.data.job_id);

  if (updErr) {
    return { ok: false, message: updErr.message };
  }

  // Send email notification (best-effort)
  try {
    const contact = await getCompanyContact(job.company_id);
    if (contact.email) {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
      const email = jobApprovedEmail({
        companyName: contact.companyName,
        jobTitle: job.title,
        ctaHref: `${baseUrl}/company/jobs`,
      });
      await sendEmail({ to: contact.email, ...email });
    }
  } catch (e) {
    console.error("[admin-jobs] Failed to send approval email:", e);
  }

  revalidatePath("/admin");
  revalidatePath("/company/jobs");
  revalidatePath("/", "layout");
  return { ok: true, message: "Job approved and published." };
}

// ---------------------------------------------------------------------
// Reject a job posting
// ---------------------------------------------------------------------

const RejectJobSchema = z.object({
  job_id: z.string().uuid(),
  reason: z
    .string()
    .trim()
    .min(10, "Provide at least 10 characters of feedback.")
    .max(2000, "Keep it under 2000 characters."),
});

export async function rejectJob(
  _prev: AdminJobActionState | undefined,
  formData: FormData
): Promise<AdminJobActionState> {
  const reviewer = await assertAdmin();

  const parsed = RejectJobSchema.safeParse({
    job_id: formData.get("job_id"),
    reason: formData.get("reason"),
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

  const admin = createAdminClient();

  // Verify the job exists and is pending_review
  const { data: job } = await admin
    .from("company_jobs")
    .select("id, company_id, title, status")
    .eq("id", parsed.data.job_id)
    .maybeSingle();

  if (!job) {
    return { ok: false, message: "Job posting not found." };
  }
  if (job.status !== "pending_review") {
    return { ok: false, message: `Job is already ${job.status}.` };
  }

  const { error: updErr } = await admin
    .from("company_jobs")
    .update({
      status: "rejected",
      review_reason: parsed.data.reason,
      reviewed_by: reviewer.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.job_id);

  if (updErr) {
    return { ok: false, message: updErr.message };
  }

  // Send email notification (best-effort)
  try {
    const contact = await getCompanyContact(job.company_id);
    if (contact.email) {
      const email = jobRejectedEmail({
        companyName: contact.companyName,
        jobTitle: job.title,
        reason: parsed.data.reason,
      });
      await sendEmail({ to: contact.email, ...email });
    }
  } catch (e) {
    console.error("[admin-jobs] Failed to send rejection email:", e);
  }

  revalidatePath("/admin");
  revalidatePath("/company/jobs");
  revalidatePath("/", "layout");
  return { ok: true, message: "Job rejected." };
}
