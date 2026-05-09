"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { assertAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import {
  approvalEmail,
  rejectionEmail,
  companyApprovalEmail,
  companyRejectionEmail,
  technicalPassEmail,
  technicalFailEmail,
  interviewPassEmail,
  interviewFailEmail,
} from "@/lib/email/templates";
import { seedAdminSupportThread } from "@/app/actions/messages";
import { createNotification } from "@/lib/notifications/create";
import type { TalentApplication } from "@/lib/types/db";

export type AdminActionState =
  | { ok: true; message?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[] | undefined> };

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

type ProfileStageUpdate = {
  onboarding_stage: number;
  avatar_url?: string | null;
};

type TalentRejectionUpdate = Partial<ApprovedTalentSnapshot> & {
  review_status: "rejected";
  review_reason: string;
  review_decision_at: string;
  reviewed_by: string;
  reapply_after: string;
};

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

async function getOrigin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

async function getApplicantEmail(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  // auth.admin.getUserById returns the user from the auth schema.
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error) {
    console.error("[admin] Couldn't look up applicant email:", error);
    return null;
  }
  return data.user?.email ?? null;
}

async function getApplicantFirstName(userId: string): Promise<string> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();
  const full = (data?.full_name ?? "").trim();
  return full ? full.split(" ")[0] : "";
}

// ---------------------------------------------------------------------
// Approve
// ---------------------------------------------------------------------

const ApproveSchema = z.object({
  user_id: z.string().uuid(),
});

export async function approveTalent(
  _prev: AdminActionState | undefined,
  formData: FormData
): Promise<AdminActionState> {
  const reviewer = await assertAdmin();

  const parsed = ApproveSchema.safeParse({
    user_id: formData.get("user_id"),
  });
  if (!parsed.success) {
    return { ok: false, message: "Invalid payload." };
  }

  const admin = createAdminClient();

  // 1) Record the decision on the application.
  const { error: updErr } = await admin
    .from("talent_applications")
    .update({
      review_status: "approved",
      review_reason: null,
      review_decision_at: new Date().toISOString(),
      reviewed_by: reviewer.id,
      reapply_after: null,
      previous_approved_state: null,
    })
    .eq("user_id", parsed.data.user_id);
  if (updErr) {
    return { ok: false, message: updErr.message };
  }

  // 1.5) If there is an avatar_url in the application, sync it to the profile
  const { data: currentApp } = await admin.from("talent_applications").select("avatar_url").eq("user_id", parsed.data.user_id).single();

  // 2) Bump the user's onboarding stage → 3 (technical assessment). Also sync avatar_url if present.
  const profileUpdate: ProfileStageUpdate = { onboarding_stage: 3 };
  if (currentApp?.avatar_url) {
    profileUpdate.avatar_url = currentApp.avatar_url;
  }

  await admin
    .from("profiles")
    .update(profileUpdate)
    .eq("id", parsed.data.user_id);

  // 3) Email the applicant (best-effort — don't fail the request if email
  //    skips due to missing provider config).
  const [email, firstName, origin] = await Promise.all([
    getApplicantEmail(parsed.data.user_id),
    getApplicantFirstName(parsed.data.user_id),
    getOrigin(),
  ]);

  if (email) {
    const tmpl = approvalEmail({
      firstName,
      ctaHref: `${origin}/talent/dashboard`,
    });
    await sendEmail({ to: email, ...tmpl });
  }

  await createNotification({
    userId: parsed.data.user_id,
    kind: "review_decision",
    title: "Your application has been approved",
    body: "Congratulations! Your talent profile has been approved. You can now proceed to the next stage.",
    refTable: "talent_applications",
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/talent/${parsed.data.user_id}`);
  revalidatePath("/", "layout");
  return { ok: true, message: "Applicant approved." };
}

// ---------------------------------------------------------------------
// Reject
// ---------------------------------------------------------------------

const RejectSchema = z.object({
  user_id: z.string().uuid(),
  reason: z
    .string()
    .trim()
    .min(20, "Give the applicant at least 20 characters of context.")
    .max(2000, "Keep it under 2000 characters."),
  reapply_after: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format."),
});

export async function rejectTalent(
  _prev: AdminActionState | undefined,
  formData: FormData
): Promise<AdminActionState> {
  const reviewer = await assertAdmin();

  const parsed = RejectSchema.safeParse({
    user_id: formData.get("user_id"),
    reason: formData.get("reason"),
    reapply_after: formData.get("reapply_after"),
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

  const { data: currentApp } = await admin
    .from("talent_applications")
    .select("previous_approved_state")
    .eq("user_id", parsed.data.user_id)
    .single();

  const prevState =
    currentApp?.previous_approved_state as ApprovedTalentSnapshot | null;

  const updatePayload: TalentRejectionUpdate = {
    review_status: "rejected",
    review_reason: parsed.data.reason,
    review_decision_at: new Date().toISOString(),
    reviewed_by: reviewer.id,
    reapply_after: parsed.data.reapply_after,
  };

  if (prevState) {
    // Revert fields back to the approved state, but leave previous_approved_state 
    // populated so the UI knows this was an update rejection and can allow them
    // to just "Make Live" again.
    updatePayload.avatar_url = prevState.avatar_url;
    updatePayload.headline = prevState.headline;
    updatePayload.location = prevState.location;
    updatePayload.years_experience = prevState.years_experience;
    updatePayload.bio = prevState.bio;
    updatePayload.linkedin_url = prevState.linkedin_url;
    updatePayload.github_url = prevState.github_url;
    updatePayload.portfolio_url = prevState.portfolio_url;
    updatePayload.skills = prevState.skills;
    updatePayload.work_experience = prevState.work_experience;
    updatePayload.resume_path = prevState.resume_path;
    updatePayload.resume_filename = prevState.resume_filename;
  }

  // 1) Record the rejection.
  const { error: updErr } = await admin
    .from("talent_applications")
    .update(updatePayload)
    .eq("user_id", parsed.data.user_id);
  if (updErr) {
    return { ok: false, message: updErr.message };
  }

  // Keep onboarding_stage at 2 — rejected applicants stay "in review
  // history" but get a distinct UI based on review_status.

  // 2) Email the applicant.
  const [email, firstName] = await Promise.all([
    getApplicantEmail(parsed.data.user_id),
    getApplicantFirstName(parsed.data.user_id),
  ]);
  if (email) {
    const tmpl = rejectionEmail({
      firstName,
      reason: parsed.data.reason,
      reapplyAfter: parsed.data.reapply_after,
    });
    await sendEmail({ to: email, ...tmpl });
  }

  await createNotification({
    userId: parsed.data.user_id,
    kind: "review_decision",
    title: "Your application was not approved",
    body: parsed.data.reason,
    refTable: "talent_applications",
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/talent/${parsed.data.user_id}`);
  revalidatePath("/", "layout");
  return { ok: true, message: "Applicant rejected and notified." };
}

// =====================================================================
// TALENT — technical assessment + senior interview decisions
// =====================================================================
// These run AFTER `review_status = 'approved'`. Both are driven manually
// by admins — the actual assessment and interview happen over email in
// Phase 1. A pass at technical bumps `onboarding_stage` to 4 (interview
// active); a pass at interview bumps to 5 (live in talent pool). A fail
// at either stage sets `review_status = 'rejected'` and requires the
// same reason + reapply_after fields as the human-review rejection.

const StageOnlySchema = z.object({
  user_id: z.string().uuid(),
});

const StageFailSchema = z.object({
  user_id: z.string().uuid(),
  reason: z
    .string()
    .trim()
    .min(20, "Give the applicant at least 20 characters of context.")
    .max(2000, "Keep it under 2000 characters."),
  reapply_after: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format."),
});

async function assertAtStage(
  userId: string,
  expected: {
    review: "approved";
    technical: "pending" | "passed";
    interview?: "pending";
  }
): Promise<AdminActionState | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("talent_applications")
    .select("review_status, technical_status, interview_status")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return { ok: false, message: "Application not found." };
  if (data.review_status !== expected.review) {
    return {
      ok: false,
      message: "Applicant must be approved at human review first.",
    };
  }
  if (data.technical_status !== expected.technical) {
    return {
      ok: false,
      message:
        expected.technical === "pending"
          ? "Technical assessment already has a decision."
          : "Technical assessment must be marked passed first.",
    };
  }
  if (
    expected.interview &&
    data.interview_status !== expected.interview
  ) {
    return { ok: false, message: "Interview already has a decision." };
  }
  return null;
}

// ---------------------------------------------------------------------
// Pass / fail technical assessment
// ---------------------------------------------------------------------

export async function passTechnical(
  _prev: AdminActionState | undefined,
  formData: FormData
): Promise<AdminActionState> {
  const reviewer = await assertAdmin();

  const parsed = StageOnlySchema.safeParse({
    user_id: formData.get("user_id"),
  });
  if (!parsed.success) return { ok: false, message: "Invalid payload." };

  const guard = await assertAtStage(parsed.data.user_id, {
    review: "approved",
    technical: "pending",
  });
  if (guard) return guard;

  const admin = createAdminClient();

  const { error: updErr } = await admin
    .from("talent_applications")
    .update({
      technical_status: "passed",
      technical_reason: null,
      technical_decision_at: new Date().toISOString(),
      reviewed_by: reviewer.id,
    })
    .eq("user_id", parsed.data.user_id);
  if (updErr) return { ok: false, message: updErr.message };

  await admin
    .from("profiles")
    .update({ onboarding_stage: 4 })
    .eq("id", parsed.data.user_id);

  const [email, firstName, origin] = await Promise.all([
    getApplicantEmail(parsed.data.user_id),
    getApplicantFirstName(parsed.data.user_id),
    getOrigin(),
  ]);
  if (email) {
    const tmpl = technicalPassEmail({
      firstName,
      ctaHref: `${origin}/talent/dashboard`,
    });
    await sendEmail({ to: email, ...tmpl });
  }

  await createNotification({
    userId: parsed.data.user_id,
    kind: "review_decision",
    title: "You passed the technical assessment",
    body: "Great news — you've cleared the technical stage. Next up is the senior-engineer interview.",
    refTable: "talent_applications",
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/talent/${parsed.data.user_id}`);
  revalidatePath("/", "layout");
  return { ok: true, message: "Technical assessment marked passed." };
}

export async function failTechnical(
  _prev: AdminActionState | undefined,
  formData: FormData
): Promise<AdminActionState> {
  const reviewer = await assertAdmin();

  const parsed = StageFailSchema.safeParse({
    user_id: formData.get("user_id"),
    reason: formData.get("reason"),
    reapply_after: formData.get("reapply_after"),
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

  const guard = await assertAtStage(parsed.data.user_id, {
    review: "approved",
    technical: "pending",
  });
  if (guard) return guard;

  const admin = createAdminClient();

  // A fail at technical closes the application: overall review goes to
  // 'rejected' so the dashboard + company side both see the change.
  const now = new Date().toISOString();
  const { error: updErr } = await admin
    .from("talent_applications")
    .update({
      technical_status: "failed",
      technical_reason: parsed.data.reason,
      technical_decision_at: now,
      review_status: "rejected",
      review_reason: parsed.data.reason,
      review_decision_at: now,
      reviewed_by: reviewer.id,
      reapply_after: parsed.data.reapply_after,
    })
    .eq("user_id", parsed.data.user_id);
  if (updErr) return { ok: false, message: updErr.message };

  const [email, firstName] = await Promise.all([
    getApplicantEmail(parsed.data.user_id),
    getApplicantFirstName(parsed.data.user_id),
  ]);
  if (email) {
    const tmpl = technicalFailEmail({
      firstName,
      reason: parsed.data.reason,
      reapplyAfter: parsed.data.reapply_after,
    });
    await sendEmail({ to: email, ...tmpl });
  }

  await createNotification({
    userId: parsed.data.user_id,
    kind: "review_decision",
    title: "Technical assessment result",
    body: parsed.data.reason,
    refTable: "talent_applications",
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/talent/${parsed.data.user_id}`);
  revalidatePath("/", "layout");
  return {
    ok: true,
    message: "Technical assessment failed — applicant notified.",
  };
}

// ---------------------------------------------------------------------
// Pass / fail senior-engineer interview
// ---------------------------------------------------------------------

export async function passInterview(
  _prev: AdminActionState | undefined,
  formData: FormData
): Promise<AdminActionState> {
  const reviewer = await assertAdmin();

  const parsed = StageOnlySchema.safeParse({
    user_id: formData.get("user_id"),
  });
  if (!parsed.success) return { ok: false, message: "Invalid payload." };

  const guard = await assertAtStage(parsed.data.user_id, {
    review: "approved",
    technical: "passed",
    interview: "pending",
  });
  if (guard) return guard;

  const admin = createAdminClient();

  const { error: updErr } = await admin
    .from("talent_applications")
    .update({
      interview_status: "passed",
      interview_reason: null,
      interview_decision_at: new Date().toISOString(),
      reviewed_by: reviewer.id,
    })
    .eq("user_id", parsed.data.user_id);
  if (updErr) return { ok: false, message: updErr.message };

  // Stage 5 = live in the talent pool.
  await admin
    .from("profiles")
    .update({ onboarding_stage: 5 })
    .eq("id", parsed.data.user_id);

  const [email, firstName, origin] = await Promise.all([
    getApplicantEmail(parsed.data.user_id),
    getApplicantFirstName(parsed.data.user_id),
    getOrigin(),
  ]);
  if (email) {
    const tmpl = interviewPassEmail({
      firstName,
      ctaHref: `${origin}/talent/dashboard`,
    });
    await sendEmail({ to: email, ...tmpl });
  }

  const welcome =
    `Congratulations${firstName ? `, ${firstName}` : ""} — you're now live in the Veloraa talent pool. ` +
    "This thread is your direct line to our team. Ask us anything about your profile, interviews, or the platform, and we'll reply during business hours.";
  await seedAdminSupportThread(parsed.data.user_id, welcome);

  await createNotification({
    userId: parsed.data.user_id,
    kind: "review_decision",
    title: "You're now live in the talent pool!",
    body: "You passed the interview and your profile is now visible to companies. Welcome aboard!",
    refTable: "talent_applications",
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/talent/${parsed.data.user_id}`);
  revalidatePath("/talent", "layout");
  revalidatePath("/", "layout");
  return { ok: true, message: "Interview marked passed — welcome aboard." };
}

export async function failInterview(
  _prev: AdminActionState | undefined,
  formData: FormData
): Promise<AdminActionState> {
  const reviewer = await assertAdmin();

  const parsed = StageFailSchema.safeParse({
    user_id: formData.get("user_id"),
    reason: formData.get("reason"),
    reapply_after: formData.get("reapply_after"),
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

  const guard = await assertAtStage(parsed.data.user_id, {
    review: "approved",
    technical: "passed",
    interview: "pending",
  });
  if (guard) return guard;

  const admin = createAdminClient();

  const now = new Date().toISOString();
  const { error: updErr } = await admin
    .from("talent_applications")
    .update({
      interview_status: "failed",
      interview_reason: parsed.data.reason,
      interview_decision_at: now,
      review_status: "rejected",
      review_reason: parsed.data.reason,
      review_decision_at: now,
      reviewed_by: reviewer.id,
      reapply_after: parsed.data.reapply_after,
    })
    .eq("user_id", parsed.data.user_id);
  if (updErr) return { ok: false, message: updErr.message };

  const [email, firstName] = await Promise.all([
    getApplicantEmail(parsed.data.user_id),
    getApplicantFirstName(parsed.data.user_id),
  ]);
  if (email) {
    const tmpl = interviewFailEmail({
      firstName,
      reason: parsed.data.reason,
      reapplyAfter: parsed.data.reapply_after,
    });
    await sendEmail({ to: email, ...tmpl });
  }

  await createNotification({
    userId: parsed.data.user_id,
    kind: "review_decision",
    title: "Interview result",
    body: parsed.data.reason,
    refTable: "talent_applications",
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/talent/${parsed.data.user_id}`);
  revalidatePath("/", "layout");
  return { ok: true, message: "Interview failed — applicant notified." };
}

// =====================================================================
// COMPANY — approve / reject
// =====================================================================

async function getCompanyName(userId: string): Promise<string> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("company_applications")
    .select("legal_name")
    .eq("user_id", userId)
    .maybeSingle();
  return (data?.legal_name as string | null) ?? "your company";
}

export async function approveCompany(
  _prev: AdminActionState | undefined,
  formData: FormData
): Promise<AdminActionState> {
  const reviewer = await assertAdmin();

  const parsed = ApproveSchema.safeParse({
    user_id: formData.get("user_id"),
  });
  if (!parsed.success) {
    return { ok: false, message: "Invalid payload." };
  }

  const admin = createAdminClient();

  const { error: updErr } = await admin
    .from("company_applications")
    .update({
      review_status: "approved",
      review_reason: null,
      review_decision_at: new Date().toISOString(),
      reviewed_by: reviewer.id,
      reapply_after: null,
    })
    .eq("user_id", parsed.data.user_id);
  if (updErr) return { ok: false, message: updErr.message };

  // Bump stage to 2 — approved, can post jobs.
  await admin
    .from("profiles")
    .update({ onboarding_stage: 2 })
    .eq("id", parsed.data.user_id);

  const [email, companyName, origin] = await Promise.all([
    getApplicantEmail(parsed.data.user_id),
    getCompanyName(parsed.data.user_id),
    getOrigin(),
  ]);
  if (email) {
    const tmpl = companyApprovalEmail({
      companyName,
      ctaHref: `${origin}/company/jobs/new`,
    });
    await sendEmail({ to: email, ...tmpl });
  }

  // Seed the in-app welcome conversation. The company will land on
  // /company/messages and see this thread sitting at the top with an
  // unread badge — their direct line to the Veloraa team.
  const welcome =
    `Welcome to Veloraa${companyName && companyName !== "your company" ? `, ${companyName}` : ""}! ` +
    "Your account is approved and you can start posting jobs whenever you're ready. " +
    "This thread is your direct line to our team — ping us with any hiring, billing, or product questions and we'll reply within business hours.";
  await seedAdminSupportThread(parsed.data.user_id, welcome);

  await createNotification({
    userId: parsed.data.user_id,
    kind: "review_decision",
    title: "Your company has been approved",
    body: "Your company account is approved. You can now start posting jobs and searching for talent.",
    refTable: "company_applications",
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/company/${parsed.data.user_id}`);
  revalidatePath("/", "layout");
  return { ok: true, message: "Company approved." };
}

export async function rejectCompany(
  _prev: AdminActionState | undefined,
  formData: FormData
): Promise<AdminActionState> {
  const reviewer = await assertAdmin();

  const parsed = RejectSchema.safeParse({
    user_id: formData.get("user_id"),
    reason: formData.get("reason"),
    reapply_after: formData.get("reapply_after"),
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

  const { error: updErr } = await admin
    .from("company_applications")
    .update({
      review_status: "rejected",
      review_reason: parsed.data.reason,
      review_decision_at: new Date().toISOString(),
      reviewed_by: reviewer.id,
      reapply_after: parsed.data.reapply_after,
    })
    .eq("user_id", parsed.data.user_id);
  if (updErr) return { ok: false, message: updErr.message };

  const [email, companyName] = await Promise.all([
    getApplicantEmail(parsed.data.user_id),
    getCompanyName(parsed.data.user_id),
  ]);
  if (email) {
    const tmpl = companyRejectionEmail({
      companyName,
      reason: parsed.data.reason,
      reapplyAfter: parsed.data.reapply_after,
    });
    await sendEmail({ to: email, ...tmpl });
  }

  await createNotification({
    userId: parsed.data.user_id,
    kind: "review_decision",
    title: "Your company application was not approved",
    body: parsed.data.reason,
    refTable: "company_applications",
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/company/${parsed.data.user_id}`);
  revalidatePath("/", "layout");
  return { ok: true, message: "Company rejected and notified." };
}
