"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import {
  interviewInviteEmail,
  interviewAcceptedEmail,
  interviewDeclinedEmail,
} from "@/lib/email/templates";

export type InvitationActionResult =
  | { ok: true; message?: string; threadId?: string }
  | { ok: false; message: string };

// ---------------------------------------------------------------------
// Send interview invitation (company → talent)
// ---------------------------------------------------------------------

const SendInviteSchema = z.object({
  job_id: z.string().uuid(),
  talent_user_id: z.string().uuid(),
  proposed_dates: z
    .array(z.string().datetime())
    .min(1, "Select at least one date.")
    .max(3, "Maximum 3 date proposals."),
  message: z.string().trim().max(2000).optional(),
});

export async function sendInterviewInvite(
  input: z.infer<typeof SendInviteSchema>
): Promise<InvitationActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const parsed = SendInviteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const admin = createAdminClient();

  // Verify company owns the job and it's published
  const { data: job } = await admin
    .from("company_jobs")
    .select("id, company_id, title, status")
    .eq("id", parsed.data.job_id)
    .maybeSingle();

  if (!job || job.company_id !== user.id) {
    return { ok: false, message: "Job not found or access denied." };
  }
  if (job.status !== "published") {
    return { ok: false, message: "Job must be published to send invites." };
  }

  // Check for existing invitation
  const { data: existing } = await admin
    .from("interview_invitations")
    .select("id, status")
    .eq("job_id", parsed.data.job_id)
    .eq("talent_user_id", parsed.data.talent_user_id)
    .maybeSingle();

  if (existing) {
    return { ok: false, message: `An invitation already exists (${existing.status}).` };
  }

  // Create or reuse a company_candidate messaging thread
  const { data: existingThread } = await admin
    .from("message_threads")
    .select("id")
    .eq("kind", "company_candidate")
    .eq("company_user_id", user.id)
    .eq("talent_user_id", parsed.data.talent_user_id)
    .maybeSingle();

  let threadId = existingThread?.id as string | undefined;

  if (!threadId) {
    const { data: newThread, error: threadErr } = await admin
      .from("message_threads")
      .insert({
        kind: "company_candidate",
        company_user_id: user.id,
        talent_user_id: parsed.data.talent_user_id,
        last_message_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (threadErr || !newThread) {
      return { ok: false, message: "Failed to create messaging thread." };
    }
    threadId = newThread.id as string;
  }

  // Insert the invitation
  const { error: invErr } = await admin
    .from("interview_invitations")
    .insert({
      job_id: parsed.data.job_id,
      company_user_id: user.id,
      talent_user_id: parsed.data.talent_user_id,
      proposed_dates: parsed.data.proposed_dates,
      message: parsed.data.message || null,
      status: "pending",
      thread_id: threadId,
    });

  if (invErr) {
    return { ok: false, message: invErr.message };
  }

  // Insert a system message with structured interview card data
  const now = new Date().toISOString();
  const cardBody = JSON.stringify({
    type: "interview_invite",
    job_title: job.title,
    proposed_dates: parsed.data.proposed_dates,
    message: parsed.data.message || null,
  });

  await admin.from("messages").insert({
    thread_id: threadId,
    sender_user_id: user.id,
    sender_is_admin: false,
    body: cardBody,
    system: true,
    created_at: now,
  });

  await admin
    .from("message_threads")
    .update({
      last_message_at: now,
      last_message_preview: `📅 Interview invitation for ${job.title}`,
      last_sender_user_id: user.id,
      last_sender_is_admin: false,
    })
    .eq("id", threadId);

  // Send email to talent (best-effort)
  try {
    const { data: talentProfile } = await admin
      .from("profiles")
      .select("email, full_name")
      .eq("id", parsed.data.talent_user_id)
      .maybeSingle();
    const { data: companyApp } = await admin
      .from("company_applications")
      .select("legal_name")
      .eq("user_id", user.id)
      .maybeSingle();

    const email = (talentProfile as { email: string | null } | null)?.email;
    if (email) {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
      const tpl = interviewInviteEmail({
        talentName: (talentProfile as { full_name: string | null })?.full_name ?? "there",
        companyName: (companyApp as { legal_name: string | null })?.legal_name ?? "A company",
        jobTitle: job.title,
        ctaHref: `${baseUrl}/talent/invites`,
      });
      await sendEmail({ to: email, ...tpl });
    }
  } catch (e) {
    console.error("[interview] Failed to send invite email:", e);
  }

  revalidatePath("/company/jobs");
  revalidatePath("/talent/invites");
  revalidatePath("/company/messages");
  revalidatePath("/talent/messages");

  return { ok: true, message: "Interview invitation sent!", threadId };
}

// ---------------------------------------------------------------------
// Accept invitation (talent)
// ---------------------------------------------------------------------

const AcceptSchema = z.object({
  invitation_id: z.string().uuid(),
  selected_date: z.string().datetime(),
});

export async function acceptInvitation(
  input: z.infer<typeof AcceptSchema>
): Promise<InvitationActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const parsed = AcceptSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const admin = createAdminClient();

  const { data: inv } = await admin
    .from("interview_invitations")
    .select("*")
    .eq("id", parsed.data.invitation_id)
    .maybeSingle();

  if (!inv || inv.talent_user_id !== user.id) {
    return { ok: false, message: "Invitation not found." };
  }
  if (inv.status !== "pending") {
    return { ok: false, message: `Invitation is already ${inv.status}.` };
  }

  const { error } = await admin
    .from("interview_invitations")
    .update({
      status: "accepted",
      accepted_date: parsed.data.selected_date,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.invitation_id);

  if (error) return { ok: false, message: error.message };

  // System message in thread
  if (inv.thread_id) {
    const now = new Date().toISOString();
    const date = new Date(parsed.data.selected_date);
    const dateStr = date.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Fetch job title
    const { data: job } = await admin
      .from("company_jobs")
      .select("title")
      .eq("id", inv.job_id)
      .maybeSingle();

    const cardBody = JSON.stringify({
      type: "interview_accepted",
      job_title: (job as { title: string } | null)?.title ?? "the role",
      accepted_date: parsed.data.selected_date,
    });

    await admin.from("messages").insert({
      thread_id: inv.thread_id,
      sender_user_id: user.id,
      sender_is_admin: false,
      body: cardBody,
      system: true,
      created_at: now,
    });

    await admin
      .from("message_threads")
      .update({
        last_message_at: now,
        last_message_preview: `✅ Interview confirmed for ${dateStr}`,
        last_sender_user_id: user.id,
        last_sender_is_admin: false,
      })
      .eq("id", inv.thread_id);

    // Email to company
    try {
      const { data: companyProfile } = await admin
        .from("profiles")
        .select("email")
        .eq("id", inv.company_user_id)
        .maybeSingle();
      const { data: talentProfile } = await admin
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      const { data: companyApp } = await admin
        .from("company_applications")
        .select("legal_name")
        .eq("user_id", inv.company_user_id)
        .maybeSingle();

      const companyEmail = (companyProfile as { email: string | null } | null)?.email;
      if (companyEmail) {
        const tpl = interviewAcceptedEmail({
          companyName: (companyApp as { legal_name: string | null })?.legal_name ?? "your company",
          talentName: (talentProfile as { full_name: string | null })?.full_name ?? "A candidate",
          jobTitle: (job as { title: string } | null)?.title ?? "the role",
          date: dateStr,
        });
        await sendEmail({ to: companyEmail, ...tpl });
      }
    } catch (e) {
      console.error("[interview] Failed to send accepted email:", e);
    }
  }

  revalidatePath("/talent/invites");
  revalidatePath("/company/jobs");
  revalidatePath("/company/messages");
  revalidatePath("/talent/messages");

  return { ok: true, message: "Interview confirmed!" };
}

// ---------------------------------------------------------------------
// Decline invitation (talent)
// ---------------------------------------------------------------------

const DeclineSchema = z.object({
  invitation_id: z.string().uuid(),
  reason: z.string().trim().max(500).optional(),
});

export async function declineInvitation(
  input: z.infer<typeof DeclineSchema>
): Promise<InvitationActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const parsed = DeclineSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const admin = createAdminClient();

  const { data: inv } = await admin
    .from("interview_invitations")
    .select("*")
    .eq("id", parsed.data.invitation_id)
    .maybeSingle();

  if (!inv || inv.talent_user_id !== user.id) {
    return { ok: false, message: "Invitation not found." };
  }
  if (inv.status !== "pending") {
    return { ok: false, message: `Invitation is already ${inv.status}.` };
  }

  const { error } = await admin
    .from("interview_invitations")
    .update({
      status: "declined",
      decline_reason: parsed.data.reason || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.invitation_id);

  if (error) return { ok: false, message: error.message };

  // System message in thread
  if (inv.thread_id) {
    const now = new Date().toISOString();

    const { data: job } = await admin
      .from("company_jobs")
      .select("title")
      .eq("id", inv.job_id)
      .maybeSingle();

    const cardBody = JSON.stringify({
      type: "interview_declined",
      job_title: (job as { title: string } | null)?.title ?? "the role",
      reason: parsed.data.reason || null,
    });

    await admin.from("messages").insert({
      thread_id: inv.thread_id,
      sender_user_id: user.id,
      sender_is_admin: false,
      body: cardBody,
      system: true,
      created_at: now,
    });

    await admin
      .from("message_threads")
      .update({
        last_message_at: now,
        last_message_preview: "Interview invitation declined",
        last_sender_user_id: user.id,
        last_sender_is_admin: false,
      })
      .eq("id", inv.thread_id);

    // Email to company
    try {
      const { data: companyProfile } = await admin
        .from("profiles")
        .select("email")
        .eq("id", inv.company_user_id)
        .maybeSingle();
      const { data: talentProfile } = await admin
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      const { data: companyApp } = await admin
        .from("company_applications")
        .select("legal_name")
        .eq("user_id", inv.company_user_id)
        .maybeSingle();

      const companyEmail = (companyProfile as { email: string | null } | null)?.email;
      if (companyEmail) {
        const tpl = interviewDeclinedEmail({
          companyName: (companyApp as { legal_name: string | null })?.legal_name ?? "your company",
          talentName: (talentProfile as { full_name: string | null })?.full_name ?? "A candidate",
          jobTitle: (job as { title: string } | null)?.title ?? "the role",
        });
        await sendEmail({ to: companyEmail, ...tpl });
      }
    } catch (e) {
      console.error("[interview] Failed to send declined email:", e);
    }
  }

  revalidatePath("/talent/invites");
  revalidatePath("/company/jobs");
  revalidatePath("/company/messages");
  revalidatePath("/talent/messages");

  return { ok: true, message: "Interview declined." };
}
