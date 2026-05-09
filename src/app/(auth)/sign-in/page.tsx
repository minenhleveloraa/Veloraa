import Link from "next/link";
import type { Metadata } from "next";
import SignInForm from "@/components/auth/SignInForm";
import OAuthButtons from "@/components/auth/OAuthButtons";

export const metadata: Metadata = {
  title: "Sign in — Veloraa",
  description: "Sign in to Veloraa.",
};

export default function SignInPage() {
  return (
    <div className="w-full max-w-md">
      <div className="mb-6 text-center sm:mb-8">
        <span className="mb-3 inline-block text-xs uppercase tracking-[0.08em] text-accent font-jetbrains">
          Welcome back
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-heading sm:text-4xl font-raleway">
          Sign in to <span className="text-accent">Veloraa</span>
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-body font-libre italic">
          Pick up right where you left off.
        </p>
      </div>

      <div className="rounded-none border-0 bg-transparent p-0 shadow-none sm:rounded-2xl sm:border sm:border-edge sm:bg-surface sm:p-8 sm:shadow-lg sm:shadow-glow-soft">
        <SignInForm />

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-edge" />
          <span className="text-[11px] uppercase tracking-[0.08em] text-subtle font-jetbrains">
            or continue with
          </span>
          <div className="h-px flex-1 bg-edge" />
        </div>

        <OAuthButtons />
      </div>

      <p className="mt-6 text-center text-sm text-body font-raleway">
        Don&apos;t have an account?{" "}
        <Link
          href="/sign-up"
          className="font-semibold text-accent transition-opacity hover:opacity-80"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
