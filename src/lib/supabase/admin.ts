import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — **server-only**.
 *
 * This bypasses RLS. Only use it in server actions that have already
 * verified the caller is an admin via `assertAdmin()` from `@/lib/admin`.
 * Never import this into any client component.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY — required for admin writes."
    );
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
