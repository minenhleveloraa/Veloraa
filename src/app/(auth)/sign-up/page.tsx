import Link from "next/link";
import type { Metadata } from "next";
import { Users, Building2, ArrowRight } from "lucide-react";
import SignUpForm from "@/components/auth/SignUpForm";
import OAuthButtons from "@/components/auth/OAuthButtons";
import type { UserRole } from "@/lib/types/db";

export const metadata: Metadata = {
  title: "Create account — Veloraa",
  description: "Join Veloraa as talent or as a company.",
};

function parseRole(raw: string | string[] | undefined): UserRole | null {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return v === "talent" || v === "company" ? v : null;
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string | string[] }>;
}) {
  const { role: roleParam } = await searchParams;
  const role = parseRole(roleParam);

  // ------------------------------------------------------------
  // No role in URL → show a picker. Cleaner than asking twice.
  // ------------------------------------------------------------
  if (!role) {
    return (
      <div className="w-full max-w-xl">
        <div className="mb-8 text-center sm:mb-10">
          <span className="mb-3 inline-block text-xs uppercase tracking-[0.08em] text-accent font-jetbrains">
            Create your account
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-heading sm:text-4xl font-raleway">
            Welcome to <span className="text-accent">Veloraa</span>
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-body font-libre italic">
            First things first — which side of the marketplace are you on?
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <RoleCard
            href="/sign-up?role=talent"
            icon={<Users className="h-5 w-5" />}
            eyebrow="I'm a"
            title="Talent"
            description="Apply once. Get matched with pre-vetted roles you'd actually want."
          />
          <RoleCard
            href="/sign-up?role=company"
            icon={<Building2 className="h-5 w-5" />}
            eyebrow="I'm a"
            title="Company"
            description="Hire faster from a network of vetted engineers and designers."
          />
        </div>

        <p className="mt-8 text-center text-sm text-body font-raleway">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-semibold text-accent transition-opacity hover:opacity-80"
          >
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  // ------------------------------------------------------------
  // Role locked in from URL → render the full form.
  // ------------------------------------------------------------
  return (
    <div className="w-full max-w-md">
      <div className="mb-6 text-center sm:mb-8">
        <span className="mb-3 inline-block text-xs uppercase tracking-[0.08em] text-accent font-jetbrains">
          Create your account
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-heading sm:text-4xl font-raleway">
          Welcome to <span className="text-accent">Veloraa</span>
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-body font-libre italic">
          {role === "talent"
            ? "One application, endless opportunities."
            : "Build your team from a pre-vetted network."}
        </p>
      </div>

      <div className="rounded-none border-0 bg-transparent p-0 shadow-none sm:rounded-2xl sm:border sm:border-edge sm:bg-surface sm:p-8 sm:shadow-lg sm:shadow-glow-soft">
        <SignUpForm role={role} />

        {/*
          OAuth is deliberately talent-only. Companies sign up with work
          email + password so we can enforce domain policy and keep the
          onboarding form authoritative over profile data.
        */}
        {role === "talent" && (
          <>
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-edge" />
              <span className="text-[11px] uppercase tracking-[0.08em] text-subtle font-jetbrains">
                or continue with
              </span>
              <div className="h-px flex-1 bg-edge" />
            </div>
            <OAuthButtons role={role} />
          </>
        )}
      </div>

      <p className="mt-6 text-center text-sm text-body font-raleway">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="font-semibold text-accent transition-opacity hover:opacity-80"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

function RoleCard({
  href,
  icon,
  eyebrow,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-edge bg-surface p-6 transition-all hover:border-accent hover:shadow-lg hover:shadow-glow-soft"
    >
      <div>
        <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-pill-bg text-accent">
          {icon}
        </div>
        <p className="text-[11px] uppercase tracking-[0.08em] text-subtle font-jetbrains">
          {eyebrow}
        </p>
        <h3 className="mt-1 text-2xl font-bold text-heading font-raleway">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-body font-raleway">
          {description}
        </p>
      </div>
      <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent font-raleway">
        Continue
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
