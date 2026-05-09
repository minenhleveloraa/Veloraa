"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type NotificationKind =
  | "review_decision"
  | "invite"
  | "message"
  | "recommendation"
  | "subscription";

/**
 * Insert a notification row for a user. Uses the admin client so it
 * bypasses RLS (the INSERT policy doesn't exist — only SELECT/UPDATE).
 *
 * Best-effort: failures are logged but never bubble up to break the
 * calling server action.
 */
export async function createNotification({
  userId,
  kind,
  title,
  body,
  refTable,
  refId,
}: {
  userId: string;
  kind: NotificationKind;
  title: string;
  body?: string | null;
  refTable?: string | null;
  refId?: string | null;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("notifications").insert({
      user_id: userId,
      kind,
      title,
      body: body ?? null,
      ref_table: refTable ?? null,
      ref_id: refId ?? null,
    });
  } catch (err) {
    console.error("[notifications] Failed to create notification:", err);
  }
}
