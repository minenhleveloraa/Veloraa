import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types/db";

/**
 * OAuth / magic-link callback.
 * Exchanges the `?code=...` query param for a Supabase session cookie.
 * If a `role` query param is present (e.g. from sign-up), we persist it onto
 * the profile row when it's still null (first-time social signup).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const role = searchParams.get("role") as UserRole | null;
  const next = searchParams.get("next") ?? "/profile";

  if (!code) {
    return NextResponse.redirect(`${origin}/sign-in?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      `${origin}/sign-in?error=${encodeURIComponent(error.message)}`
    );
  }

  // Attach the requested role to the profile if we're still missing one.
  if (role === "talent" || role === "company") {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ role })
        .eq("id", user.id)
        .is("role", null);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
