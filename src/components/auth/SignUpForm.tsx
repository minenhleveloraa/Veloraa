"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Eye, EyeOff, Loader2, CheckCircle2, Users, Building2 } from "lucide-react";
import { signUpWithEmail, type AuthState } from "@/app/actions/auth";
import type { UserRole } from "@/lib/types/db";
import PasswordStrength, {
  getPasswordRules,
  getPasswordScore,
} from "./PasswordStrength";

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="group relative inline-flex w-full items-center justify-center rounded-lg bg-btn-bg px-6 py-3 text-sm font-semibold text-btn-fg transition-all hover:opacity-90 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 font-raleway"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creating account…
        </>
      ) : (
        "Create account"
      )}
    </button>
  );
}

export default function SignUpForm({ role }: { role: UserRole }) {
  const [state, action] = useActionState<AuthState | undefined, FormData>(
    signUpWithEmail,
    undefined
  );
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const rules = getPasswordRules(password);
  const allRulesMet = getPasswordScore(rules) === 4;

  // Post-submit confirmation email screen.
  if (state?.needsEmailConfirmation) {
    return (
      <div className="rounded-none border-0 bg-transparent p-0 text-center sm:rounded-2xl sm:border sm:border-edge sm:bg-surface sm:p-8">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-heading font-raleway">
          Check your inbox
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-body font-raleway">
          {state.message}
        </p>

        <Link
          href="/sign-in"
          className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-btn-bg px-6 py-3 text-sm font-semibold text-btn-fg transition-all hover:opacity-90 hover:shadow-lg font-raleway"
        >
          Already verified? Sign in now
        </Link>

        <p className="mt-5 text-xs text-subtle font-jetbrains">
          Didn&apos;t get it? Check spam, or wait 60 seconds and try again.
        </p>
      </div>
    );
  }

  const roleIcon =
    role === "talent" ? (
      <Users className="h-3.5 w-3.5" />
    ) : (
      <Building2 className="h-3.5 w-3.5" />
    );
  const otherRole: UserRole = role === "talent" ? "company" : "talent";
  const otherRoleLabel = otherRole === "talent" ? "Talent" : "Company";

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="role" value={role} />

      {/* Role indicator (read-only, derived from URL) */}
      <div className="flex items-center justify-between gap-3 rounded-lg border border-edge bg-page-alt px-4 py-2.5">
        <span className="inline-flex items-center gap-2 text-xs text-body font-raleway">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-pill-bg text-accent">
            {roleIcon}
          </span>
          <span>
            Joining as{" "}
            <span className="font-semibold text-heading">
              {role === "talent" ? "Talent" : "Company"}
            </span>
          </span>
        </span>
        <Link
          href={`/sign-up?role=${otherRole}`}
          className="text-[11px] uppercase tracking-[0.08em] text-accent transition-opacity hover:opacity-70 font-jetbrains"
        >
          Switch to {otherRoleLabel}
        </Link>
      </div>

      {/* Full name */}
      <div>
        <label
          htmlFor="full_name"
          className="mb-1.5 block text-xs uppercase tracking-[0.08em] text-body font-jetbrains"
        >
          Full name
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          autoComplete="name"
          required
          className="w-full rounded-lg border border-edge bg-surface px-4 py-2.5 text-base text-heading placeholder:text-subtle transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:text-sm font-raleway"
          placeholder="Ada Lovelace"
        />
        {state?.fieldErrors?.full_name?.[0] && (
          <p className="mt-1 text-xs text-red-500 font-raleway">
            {state.fieldErrors.full_name[0]}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-xs uppercase tracking-[0.08em] text-body font-jetbrains"
        >
          {role === "company" ? "Work email" : "Email"}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          className="w-full rounded-lg border border-edge bg-surface px-4 py-2.5 text-base text-heading placeholder:text-subtle transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:text-sm font-raleway"
          placeholder={
            role === "company" ? "you@yourcompany.com" : "you@example.com"
          }
        />
        {role === "company" && (
          <p className="mt-1 text-[11px] text-subtle font-raleway">
            Use your company email — personal addresses aren&apos;t accepted.
          </p>
        )}
        {state?.fieldErrors?.email?.[0] && (
          <p className="mt-1 text-xs text-red-500 font-raleway">
            {state.fieldErrors.email[0]}
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-xs uppercase tracking-[0.08em] text-body font-jetbrains"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-edge bg-surface px-4 py-2.5 pr-11 text-base text-heading placeholder:text-subtle transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:text-sm font-raleway"
            placeholder="At least 8 characters"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-body transition-colors hover:text-heading"
            tabIndex={-1}
            aria-label={showPw ? "Hide password" : "Show password"}
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <PasswordStrength value={password} />
        {state?.fieldErrors?.password?.[0] && (
          <p className="mt-1 text-xs text-red-500 font-raleway">
            {state.fieldErrors.password[0]}
          </p>
        )}
      </div>

      {/* Top-level error */}
      {state?.ok === false && !state.fieldErrors && state.message && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-500 font-raleway">
          {state.message}
        </div>
      )}

      <SubmitButton disabled={password.length > 0 && !allRulesMet} />

      <p className="text-center text-xs leading-relaxed text-subtle font-raleway">
        By creating an account, you agree to our Terms and Privacy Policy.
      </p>
    </form>
  );
}
