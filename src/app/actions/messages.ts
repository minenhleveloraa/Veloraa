"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdmin, isAdminEmail } from "@/lib/admin";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MessagingResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export interface SendMessageInput {
  threadId: string;
  body: string;
}

export interface SentMessage {
  id: string;
  thread_id: string;
  sender_user_id: string | null;
  sender_is_admin: boolean;
  body: string;
  system: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------

const SendSchema = z.object({
  threadId: z.string().uuid(),
  body: z
    .string()
    .trim()
    .min(1, "Message can't be empty.")
    .max(10_000, "Message is too long."),
});

const UuidSchema = z.string().uuid();

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function requireViewer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  return user;
}

interface ThreadRow {
  id: string;
  kind: "admin_support" | "company_candidate";
  user_id: string | null;
  company_user_id: string | null;
  talent_user_id: string | null;
  last_sender_is_admin: boolean;
}

async function loadThread(threadId: string): Promise<ThreadRow | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("message_threads")
    .select(
      "id, kind, user_id, company_user_id, talent_user_id, last_sender_is_admin"
    )
    .eq("id", threadId)
    .maybeSingle();
  return (data as ThreadRow | null) ?? null;
}

function viewerCanParticipate(
  row: ThreadRow,
  viewer: { id: string; email?: string | null }
): { allowed: true; actorIsAdmin: boolean } | { allowed: false } {
  const isAdmin = isAdminEmail(viewer.email);
  if (row.kind === "admin_support") {
    if (isAdmin) return { allowed: true, actorIsAdmin: true };
    if (row.user_id === viewer.id) return { allowed: true, actorIsAdmin: false };
    return { allowed: false };
  }
  // company_candidate
  if (
    row.company_user_id === viewer.id ||
    row.talent_user_id === viewer.id
  ) {
    return { allowed: true, actorIsAdmin: false };
  }
  return { allowed: false };
}

function preview(body: string): string {
  const trimmed = body.trim().replace(/\s+/g, " ");
  return trimmed.length > 160 ? trimmed.slice(0, 157) + "…" : trimmed;
}

// ---------------------------------------------------------------------------
// Public actions
// ---------------------------------------------------------------------------

/**
 * Send a message into a thread. Works for both regular participants (talent
 * or company) and admins. Returns the inserted message row so the UI can
 * reconcile its optimistic entry.
 */
export async function sendMessage(
  input: SendMessageInput
): Promise<MessagingResult<SentMessage>> {
  const parsed = SendSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const viewer = await requireViewer();
  const thread = await loadThread(parsed.data.threadId);
  if (!thread) return { ok: false, error: "Thread not found." };

  const check = viewerCanParticipate(thread, viewer);
  if (!check.allowed) return { ok: false, error: "Forbidden." };

  const admin = createAdminClient();
  const body = parsed.data.body.trim();
  const now = new Date().toISOString();

  const { data: inserted, error: insertErr } = await admin
    .from("messages")
    .insert({
      thread_id: thread.id,
      sender_user_id: viewer.id,
      sender_is_admin: check.actorIsAdmin,
      body,
      system: false,
      created_at: now,
    })
    .select("*")
    .single();

  if (insertErr || !inserted) {
    return { ok: false, error: insertErr?.message ?? "Failed to send." };
  }

  await admin
    .from("message_threads")
    .update({
      last_message_at: now,
      last_message_preview: preview(body),
      last_sender_user_id: viewer.id,
      last_sender_is_admin: check.actorIsAdmin,
    })
    .eq("id", thread.id);

  // The sender has obviously read everything up to their own message.
  await admin
    .from("thread_reads")
    .upsert(
      {
        thread_id: thread.id,
        user_id: viewer.id,
        last_read_at: now,
      },
      { onConflict: "thread_id,user_id" }
    );

  // Revalidate badge surfaces so the counterparty's next SSR includes
  // the new unread count. Client realtime handles the in-tab update.
  if (check.actorIsAdmin) {
    revalidatePath("/company/messages");
    revalidatePath("/company", "layout");
    revalidatePath("/talent/messages");
    revalidatePath("/talent", "layout");
  } else {
    revalidatePath("/admin/messages");
    revalidatePath("/admin", "layout");
    revalidatePath("/company", "layout");
    revalidatePath("/talent", "layout");
  }

  return {
    ok: true,
    data: inserted as SentMessage,
  };
}

/**
 * Upsert a `thread_reads` row so the caller's future unread counts for this
 * thread reset to 0. Callers typically invoke this when a user opens a
 * conversation in the UI.
 */
export async function markThreadRead(
  threadId: string
): Promise<MessagingResult> {
  const parsed = UuidSchema.safeParse(threadId);
  if (!parsed.success) return { ok: false, error: "Invalid thread id." };

  const viewer = await requireViewer();
  const thread = await loadThread(parsed.data);
  if (!thread) return { ok: false, error: "Thread not found." };

  const check = viewerCanParticipate(thread, viewer);
  if (!check.allowed) return { ok: false, error: "Forbidden." };

  const admin = createAdminClient();
  await admin
    .from("thread_reads")
    .upsert(
      {
        thread_id: thread.id,
        user_id: viewer.id,
        last_read_at: new Date().toISOString(),
      },
      { onConflict: "thread_id,user_id" }
    );

  if (check.actorIsAdmin) {
    revalidatePath("/admin", "layout");
  } else {
    revalidatePath("/company", "layout");
    revalidatePath("/talent", "layout");
  }
  return { ok: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Admin-initiated actions
// ---------------------------------------------------------------------------

const OpenAdminThreadSchema = z.object({
  userId: z.string().uuid(),
});

/**
 * Admin opens (or finds) an `admin_support` thread with a given talent or
 * company user. Idempotent — re-opening the same user just returns the
 * existing thread. Returns the thread id so the caller can redirect into
 * `/admin/messages?thread=<id>`.
 */
export async function openAdminSupportThread(
  input: z.infer<typeof OpenAdminThreadSchema>
): Promise<MessagingResult<{ threadId: string }>> {
  await assertAdmin();

  const parsed = OpenAdminThreadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid user id." };

  const admin = createAdminClient();

  // Confirm the target user actually exists + is a talent or company.
  const { data: profile } = await admin
    .from("profiles")
    .select("id, role")
    .eq("id", parsed.data.userId)
    .maybeSingle();
  if (!profile) return { ok: false, error: "User not found." };

  const { data: existing } = await admin
    .from("message_threads")
    .select("id")
    .eq("kind", "admin_support")
    .eq("user_id", parsed.data.userId)
    .maybeSingle();
  if (existing?.id) {
    revalidatePath("/admin/messages");
    revalidatePath("/talent", "layout");
    revalidatePath("/company", "layout");
    return { ok: true, data: { threadId: existing.id } };
  }

  const { data: inserted, error } = await admin
    .from("message_threads")
    .insert({
      kind: "admin_support",
      user_id: parsed.data.userId,
      last_message_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { ok: false, error: error?.message ?? "Failed to open thread." };
  }

  revalidatePath("/admin/messages");
  revalidatePath("/talent", "layout");
  revalidatePath("/company", "layout");
  return { ok: true, data: { threadId: inserted.id } };
}

/**
 * Seed the welcome admin_support thread for a freshly-approved user. Called
 * from the approveCompany admin action. Idempotent (won't create a duplicate
 * thread and won't re-seed the welcome message).
 */
export async function seedAdminSupportThread(
  userId: string,
  welcomeBody: string
): Promise<void> {
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("message_threads")
    .select("id")
    .eq("kind", "admin_support")
    .eq("user_id", userId)
    .maybeSingle();

  let threadId = existing?.id as string | undefined;

  if (!threadId) {
    const { data: inserted, error } = await admin
      .from("message_threads")
      .insert({
        kind: "admin_support",
        user_id: userId,
        last_message_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error || !inserted) {
      console.error("[messaging] Failed to create admin_support thread:", error);
      return;
    }
    threadId = inserted.id as string;
  }

  const { count } = await admin
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("thread_id", threadId);

  if ((count ?? 0) > 0) return; // already seeded

  const now = new Date();
  const systemAt = new Date(now.getTime() - 2_000).toISOString();
  const welcomeAt = now.toISOString();

  await admin.from("messages").insert([
    {
      thread_id: threadId,
      sender_user_id: null,
      sender_is_admin: true,
      body: "Conversation started",
      system: true,
      created_at: systemAt,
    },
    {
      thread_id: threadId,
      sender_user_id: null,
      sender_is_admin: true,
      body: welcomeBody,
      system: false,
      created_at: welcomeAt,
    },
  ]);

  await admin
    .from("message_threads")
    .update({
      last_message_at: welcomeAt,
      last_message_preview: welcomeBody.slice(0, 160),
      last_sender_user_id: null,
      last_sender_is_admin: true,
    })
    .eq("id", threadId);
}

// ---------------------------------------------------------------------------
// Company-initiated actions
// ---------------------------------------------------------------------------

const OpenCandidateThreadSchema = z.object({
  talentUserId: z.string().uuid(),
});

/**
 * Company user opens a `company_candidate` thread with a given talent user.
 * Idempotent — returns the existing thread id if one already exists.
 */
export async function openCompanyCandidateThread(
  input: z.infer<typeof OpenCandidateThreadSchema>
): Promise<MessagingResult<{ threadId: string }>> {
  const parsed = OpenCandidateThreadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid talent id." };

  const viewer = await requireViewer();

  const admin = createAdminClient();
  const { data: viewerProfile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", viewer.id)
    .maybeSingle();
  if (viewerProfile?.role !== "company") {
    return { ok: false, error: "Only approved companies can open threads." };
  }

  const { data: existing } = await admin
    .from("message_threads")
    .select("id")
    .eq("kind", "company_candidate")
    .eq("company_user_id", viewer.id)
    .eq("talent_user_id", parsed.data.talentUserId)
    .maybeSingle();
  if (existing?.id) {
    return { ok: true, data: { threadId: existing.id } };
  }

  const { data: inserted, error } = await admin
    .from("message_threads")
    .insert({
      kind: "company_candidate",
      company_user_id: viewer.id,
      talent_user_id: parsed.data.talentUserId,
      last_message_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { ok: false, error: error?.message ?? "Failed to open thread." };
  }

  revalidatePath("/company/messages");
  return { ok: true, data: { threadId: inserted.id } };
}
