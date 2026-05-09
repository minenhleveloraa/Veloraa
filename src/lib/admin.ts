import "server-only";

/**
 * Admin authorization — the single source of truth.
 *
 * Admins are controlled exclusively via the ADMIN_EMAILS environment
 * variable (comma-separated list). Emails are compared case-insensitively
 * and whitespace is trimmed. Nothing lives in the database — this means a
 * compromised user row can never elevate itself to admin.
 *
 * Always call `assertAdmin()` at the top of any admin server action and
 * check `isCurrentUserAdmin()` from server components before rendering
 * admin UI. The middleware provides a coarse first-line check; these
 * helpers are the real gate.
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function parseAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowed = parseAdminEmails();
  return allowed.has(email.trim().toLowerCase());
}

/**
 * Returns the currently signed-in admin user, or null if the viewer is not
 * signed in or not on the allowlist.
 *
 * Also synchronizes the admin's auth.uid() into `public.admin_users` so that
 * the DB-side `public.is_admin()` function (used by messaging RLS) returns
 * true for this user. The sync is idempotent and best-effort.
 */
export async function getCurrentAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;
  if (!isAdminEmail(user.email)) return null;
  await syncAdminMembership(user.id);
  return user;
}

/**
 * Upserts the given user id into `public.admin_users` using the service-role
 * client. Safe to call on every admin page load — it's idempotent. Errors are
 * swallowed so a transient DB hiccup doesn't lock admins out of their UI.
 */
export async function syncAdminMembership(userId: string): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin
      .from("admin_users")
      .upsert({ user_id: userId }, { onConflict: "user_id" });
  } catch (err) {
    console.error("[admin] Failed to sync admin_users membership:", err);
  }
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const admin = await getCurrentAdmin();
  return !!admin;
}

/**
 * Hard-fail guard for server actions. Throws — never returns — unless the
 * caller is confirmed on the admin allowlist. Callers can catch this if
 * they need user-facing messaging.
 */
export async function assertAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    throw new Error("Forbidden: admin access required.");
  }
  return admin;
}
