"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types/db";
import { checkWorkEmail } from "@/lib/work-email";

// ---------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------

const SignUpSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters.").trim(),
  email: z.string().email("Please enter a valid email."),
  password: z
    .string()
    .min(8, "At least 8 characters.")
    .regex(/[a-zA-Z]/, "Add at least one letter.")
    .regex(/[0-9]/, "Add at least one number.")
    .regex(/[^a-zA-Z0-9]/, "Add at least one special character."),
  role: z.enum(["talent", "company"]),
});

const SignInSchema = z.object({
  email: z.string().email("Please enter a valid email."),
  password: z.string().min(1, "Password is required."),
});

// ---------------------------------------------------------------------
// Action return state
// ---------------------------------------------------------------------

export type AuthState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  // If the signup needs email confirmation we surface this to the UI.
  needsEmailConfirmation?: boolean;
};

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

async function getOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  return `${proto}://${host}`;
}

// ---------------------------------------------------------------------
// Email sign-up
// ---------------------------------------------------------------------

export async function signUpWithEmail(
  _prev: AuthState | undefined,
  formData: FormData
): Promise<AuthState> {
  const parsed = SignUpSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      message: "Please fix the highlighted fields.",
    };
  }

  // Companies must use a work email (personal providers blocked, unless
  // overridden by COMPANY_EXTRA_ALLOWED_DOMAINS during development).
  if (parsed.data.role === "company") {
    const check = checkWorkEmail(parsed.data.email);
    if (!check.ok) {
      return {
        ok: false,
        message: check.message ?? "Please use your company email.",
        fieldErrors: { email: [check.message ?? "Company email required."] },
      };
    }
  }

  const supabase = await createClient();
  const origin = await getOrigin();

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm`,
      data: {
        full_name: parsed.data.full_name,
        role: parsed.data.role,
      },
    },
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  // When "Confirm email" is enabled in Supabase, the session is null and the
  // user must click the email link. Otherwise we already have a session.
  if (!data.session) {
    return {
      ok: true,
      needsEmailConfirmation: true,
      message:
        "Check your email to confirm your account — we sent you a verification link.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/profile");
}

// ---------------------------------------------------------------------
// Email sign-in
// ---------------------------------------------------------------------

export async function signInWithEmail(
  _prev: AuthState | undefined,
  formData: FormData
): Promise<AuthState> {
  const parsed = SignInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      message: "Please fix the highlighted fields.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/profile");
}

// ---------------------------------------------------------------------
// OAuth sign-in (Google / GitHub) — placeholders. Enable the providers
// in your Supabase dashboard, then these work out of the box.
// ---------------------------------------------------------------------

export async function signInWithOAuth(
  provider: "google" | "github",
  role?: UserRole
): Promise<AuthState> {
  const supabase = await createClient();
  const origin = await getOrigin();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${origin}/auth/callback${
        role ? `?role=${role}` : ""
      }`,
    },
  });

  if (error) return { ok: false, message: error.message };
  if (data.url) redirect(data.url);
  return { ok: true };
}

// ---------------------------------------------------------------------
// Sign out
// ---------------------------------------------------------------------

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}
