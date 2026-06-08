"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createNotification } from "@/lib/notifications/create";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type {
  CompanyApplication,
  CompanyJob,
  JobApplication,
  JobApplicationStatus,
  Profile,
  TalentApplication,
} from "@/lib/types/db";

export type JobApplicationResult<T = void> =
  | { ok: true; message: string; data: T }
  | { ok: false; message: string };

export interface ApplyToJobData {
  applicationId: string;
  status: JobApplicationStatus;
  alreadyApplied: boolean;
}

export interface JobApplicationDecisionData {
  status: "accepted" | "declined";
  threadId?: string;
}

const ApplyToJobSchema = z.object({
  jobId: z.string().uuid(),
  introNote: z
    .string()
    .trim()
    .min(20, "Write a short intro so the company has context.")
    .max(1400, "Keep the intro under 1,400 characters."),
});

const DecideApplicationSchema = z.object({
  applicationId: z.string().uuid(),
  status: z.enum(["accepted", "declined"]),
  note: z.string().trim().max(1000).optional(),
});

async function requireViewer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return user;
}

function compactPreview(value: string): string {
  const text = value.trim().replace(/\s+/g, " ");
  return text.length > 160 ? `${text.slice(0, 157)}...` : text;
}

function isLiveTalent(app: TalentApplication | null): boolean {
  return app?.review_status === "approved" && app.interview_status === "passed";
}

function statusLabel(status: JobApplicationStatus): string {
  switch (status) {
    case "accepted":
      return "shortlisted";
    case "declined":
      return "declined";
    case "withdrawn":
      return "withdrawn";
    default:
      return "pending review";
  }
}

function revalidateApplicationSurfaces(
  jobId?: string,
  options: { messages?: boolean } = {}
) {
  revalidatePath("/talent/jobs");
  if (jobId) revalidatePath(`/talent/jobs/${jobId}`);
  revalidatePath("/talent", "layout");

  revalidatePath("/company/jobs");
  if (jobId) revalidatePath(`/company/jobs/${jobId}`);
  revalidatePath("/company", "layout");

  if (options.messages) {
    revalidatePath("/talent/messages");
    revalidatePath("/company/messages");
  }
}

export async function applyToJob(
  input: z.infer<typeof ApplyToJobSchema>
): Promise<JobApplicationResult<ApplyToJobData>> {
  const parsed = ApplyToJobSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Invalid application.",
    };
  }

  const viewer = await requireViewer();
  if (!viewer) return { ok: false, message: "You must be signed in." };

  const admin = createAdminClient();

  const [{ data: profileRow }, { data: talentAppRow }, { data: jobRow }] =
    await Promise.all([
      admin
        .from("profiles")
        .select("id, role")
        .eq("id", viewer.id)
        .maybeSingle(),
      admin
        .from("talent_applications")
        .select("*")
        .eq("user_id", viewer.id)
        .maybeSingle(),
      admin
        .from("company_jobs")
        .select("*")
        .eq("id", parsed.data.jobId)
        .maybeSingle(),
    ]);

  const profile = profileRow as Pick<Profile, "id" | "role"> | null;
  const talentApp = talentAppRow as TalentApplication | null;
  const job = jobRow as CompanyJob | null;

  if (profile?.role !== "talent") {
    return { ok: false, message: "Only talent can apply to roles." };
  }
  if (!isLiveTalent(talentApp)) {
    return {
      ok: false,
      message: "Your profile needs to be live before applying to roles.",
    };
  }
  if (!job || job.status !== "published") {
    return { ok: false, message: "This role is no longer accepting interest." };
  }

  const { data: existingApplication } = await admin
    .from("job_applications")
    .select("id, status")
    .eq("job_id", job.id)
    .eq("talent_user_id", viewer.id)
    .maybeSingle();

  if (existingApplication?.id) {
    const status = existingApplication.status as JobApplicationStatus;
    return {
      ok: true,
      message:
        status === "pending"
          ? "You have already sent interest for this role."
          : `Your interest is ${statusLabel(status)}.`,
      data: {
        applicationId: existingApplication.id as string,
        status,
        alreadyApplied: true,
      },
    };
  }

  const { data: applicationRow, error: applicationError } = await admin
    .from("job_applications")
    .insert({
      job_id: job.id,
      company_user_id: job.company_id,
      talent_user_id: viewer.id,
      intro_note: parsed.data.introNote,
      status: "pending",
      thread_id: null,
    })
    .select("*")
    .single();

  if (applicationError || !applicationRow) {
    if (applicationError?.code === "23505") {
      const { data: duplicate } = await admin
        .from("job_applications")
        .select("id, status")
        .eq("job_id", job.id)
        .eq("talent_user_id", viewer.id)
        .maybeSingle();
      if (duplicate?.id) {
        const status = duplicate.status as JobApplicationStatus;
        return {
          ok: true,
          message: "You have already sent interest for this role.",
          data: {
            applicationId: duplicate.id as string,
            status,
            alreadyApplied: true,
          },
        };
      }
    }
    return {
      ok: false,
      message: applicationError?.message ?? "Could not save your interest.",
    };
  }

  const application = applicationRow as JobApplication;
  revalidateApplicationSurfaces(job.id);

  return {
    ok: true,
    message:
      "Interest sent. The company will review it from this job before opening a conversation.",
    data: {
      applicationId: application.id,
      status: "pending",
      alreadyApplied: false,
    },
  };
}

export async function updateJobApplicationStatus(
  input: z.infer<typeof DecideApplicationSchema>
): Promise<JobApplicationResult<JobApplicationDecisionData>> {
  const parsed = DecideApplicationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Invalid decision.",
    };
  }

  const viewer = await requireViewer();
  if (!viewer) return { ok: false, message: "You must be signed in." };

  const admin = createAdminClient();
  const [{ data: profileRow }, { data: applicationRow }] = await Promise.all([
    admin.from("profiles").select("role").eq("id", viewer.id).maybeSingle(),
    admin
      .from("job_applications")
      .select("*")
      .eq("id", parsed.data.applicationId)
      .maybeSingle(),
  ]);

  const profile = profileRow as Pick<Profile, "role"> | null;
  const application = applicationRow as JobApplication | null;

  if (profile?.role !== "company") {
    return { ok: false, message: "Only companies can update applications." };
  }
  if (!application || application.company_user_id !== viewer.id) {
    return { ok: false, message: "Application not found." };
  }

  if (
    application.status === parsed.data.status &&
    (parsed.data.status === "declined" || application.thread_id)
  ) {
    return {
      ok: true,
      message:
        parsed.data.status === "accepted"
          ? "Candidate already shortlisted."
          : "Application already declined.",
      data: {
        status: parsed.data.status,
        threadId: application.thread_id ?? undefined,
      },
    };
  }

  const [{ data: jobRow }, { data: companyAppRow }, { data: talentProfileRow }, { data: talentAppRow }] =
    await Promise.all([
      admin
        .from("company_jobs")
        .select("id, title, company_id")
        .eq("id", application.job_id)
        .maybeSingle(),
      admin
        .from("company_applications")
        .select("legal_name")
        .eq("user_id", viewer.id)
        .maybeSingle(),
      admin
        .from("profiles")
        .select("id, full_name, email")
        .eq("id", application.talent_user_id)
        .maybeSingle(),
      admin
        .from("talent_applications")
        .select("headline, location, skills")
        .eq("user_id", application.talent_user_id)
        .maybeSingle(),
    ]);

  const job = jobRow as Pick<CompanyJob, "id" | "title" | "company_id"> | null;
  if (!job || job.company_id !== viewer.id) {
    return { ok: false, message: "Job not found." };
  }

  const companyApp = companyAppRow as Pick<CompanyApplication, "legal_name"> | null;
  const talentProfile = talentProfileRow as Pick<
    Profile,
    "id" | "full_name" | "email"
  > | null;
  const talentApp = talentAppRow as
    | Pick<TalentApplication, "headline" | "location" | "skills">
    | null;
  const jobTitle = job.title || "the role";
  const companyName = companyApp?.legal_name?.trim() || "The hiring team";
  const talentName =
    talentProfile?.full_name?.trim() ||
    talentProfile?.email?.trim() ||
    "this candidate";
  const decidedAt = new Date().toISOString();

  if (parsed.data.status === "declined") {
    const { error: updateError } = await admin
      .from("job_applications")
      .update({
        status: "declined",
        status_note: parsed.data.note || null,
        decided_at: decidedAt,
        updated_at: decidedAt,
      })
      .eq("id", application.id);

    if (updateError) {
      return { ok: false, message: updateError.message };
    }

    await createNotification({
      userId: application.talent_user_id,
      kind: "review_decision",
      title: `Update on ${jobTitle}`,
      body: parsed.data.note
        ? `${companyName} is not moving forward right now: ${parsed.data.note}`
        : `${companyName} is not moving forward with this role right now.`,
      refTable: "job_applications",
      refId: application.id,
    });

    revalidateApplicationSurfaces(application.job_id);

    return {
      ok: true,
      message: "Application declined. The talent was notified.",
      data: { status: "declined" },
    };
  }

  let threadId = application.thread_id ?? undefined;
  const { data: existingThread } = await admin
    .from("message_threads")
    .select("id")
    .eq("kind", "company_candidate")
    .eq("company_user_id", viewer.id)
    .eq("talent_user_id", application.talent_user_id)
    .maybeSingle();

  threadId = threadId ?? (existingThread?.id as string | undefined);

  if (!threadId) {
    const { data: newThread, error: threadError } = await admin
      .from("message_threads")
      .insert({
        kind: "company_candidate",
        company_user_id: viewer.id,
        talent_user_id: application.talent_user_id,
        subject: `${jobTitle} shortlist`,
        last_message_at: decidedAt,
      })
      .select("id")
      .single();

    if (threadError || !newThread) {
      return {
        ok: false,
        message: threadError?.message ?? "Could not open a conversation.",
      };
    }
    threadId = newThread.id as string;
  }

  const { error: updateError } = await admin
    .from("job_applications")
    .update({
      status: "accepted",
      status_note: parsed.data.note || null,
      decided_at: decidedAt,
      thread_id: threadId,
      updated_at: decidedAt,
    })
    .eq("id", application.id);

  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  const messageAt = new Date(new Date(decidedAt).getTime() + 500).toISOString();
  const humanBody =
    parsed.data.note ||
    `Thanks for your interest in ${jobTitle}. We shortlisted your profile and opened this conversation so we can talk through next steps.`;
  const cardBody = JSON.stringify({
    type: "job_application_accepted",
    application_id: application.id,
    job_id: application.job_id,
    job_title: jobTitle,
    company_name: companyName,
    talent_user_id: application.talent_user_id,
    talent_name: talentName,
    headline: talentApp?.headline ?? null,
    location: talentApp?.location ?? null,
    skills: talentApp?.skills?.slice(0, 8) ?? [],
    intro_note: application.intro_note,
    status: "accepted",
    profile_href: `/company/talent/${application.talent_user_id}`,
    note: parsed.data.note || null,
  });

  const { error: messageError } = await admin.from("messages").insert([
    {
      thread_id: threadId,
      sender_user_id: viewer.id,
      sender_is_admin: false,
      body: cardBody,
      system: true,
      created_at: decidedAt,
    },
    {
      thread_id: threadId,
      sender_user_id: viewer.id,
      sender_is_admin: false,
      body: humanBody,
      system: false,
      created_at: messageAt,
    },
  ]);

  if (messageError) {
    return {
      ok: false,
      message: messageError.message || "Shortlisted, but message failed.",
    };
  }

  await admin
    .from("message_threads")
    .update({
      last_message_at: messageAt,
      last_message_preview: compactPreview(
        `${companyName} shortlisted ${talentName} for ${jobTitle}`
      ),
      last_sender_user_id: viewer.id,
      last_sender_is_admin: false,
    })
    .eq("id", threadId);

  await createNotification({
    userId: application.talent_user_id,
    kind: "review_decision",
    title: `Shortlisted for ${jobTitle}`,
    body: `${companyName} shortlisted your interest and opened a conversation in messages.`,
    refTable: "job_applications",
    refId: application.id,
  });

  revalidateApplicationSurfaces(application.job_id, { messages: true });

  return {
    ok: true,
    message: "Candidate shortlisted. A message thread is now open.",
    data: { status: "accepted", threadId },
  };
}
