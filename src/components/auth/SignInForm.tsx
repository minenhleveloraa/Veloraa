"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { signInWithEmail, type AuthState } from "@/app/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center rounded-lg bg-btn-bg px-6 py-3 text-sm font-semibold text-btn-fg transition-all hover:opacity-90 hover:shadow-lg disabled:opacity-60 font-raleway"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing in…
        </>
      ) : (
        "Sign in"
      )}
    </button>
  );
}

export default function SignInForm() {
  const [state, action] = useActionState<AuthState | undefined, FormData>(
    signInWithEmail,
    undefined
  );
  const [showPw, setShowPw] = useState(false);

  return (
    <form action={action} className="space-y-5">
      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-xs uppercase tracking-[0.08em] text-body font-jetbrains"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-lg border border-edge bg-surface px-4 py-2.5 text-base text-heading placeholder:text-subtle transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:text-sm font-raleway"
          placeholder="you@example.com"
        />
        {state?.fieldErrors?.email?.[0] && (
          <p className="mt-1 text-xs text-red-500 font-raleway">
            {state.fieldErrors.email[0]}
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label
            htmlFor="password"
            className="block text-xs uppercase tracking-[0.08em] text-body font-jetbrains"
          >
            Password
          </label>
        </div>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPw ? "text" : "password"}
            autoComplete="current-password"
            required
            className="w-full rounded-lg border border-edge bg-surface px-4 py-2.5 pr-11 text-base text-heading placeholder:text-subtle transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:text-sm font-raleway"
            placeholder="••••••••"
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
        {state?.fieldErrors?.password?.[0] && (
          <p className="mt-1 text-xs text-red-500 font-raleway">
            {state.fieldErrors.password[0]}
          </p>
        )}
      </div>

      {state?.ok === false && !state.fieldErrors && state.message && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-500 font-raleway">
          {state.message}
        </div>
      )}

      <SubmitButton />
    </form>
  );
}
