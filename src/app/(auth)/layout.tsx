import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // If user is already signed in, bounce to /profile.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/profile");

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-page transition-colors duration-300">
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2">
        <div className="h-[500px] w-[700px] rounded-full bg-glow-soft blur-[140px]" />
      </div>

      <header className="relative z-10 border-b border-edge">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-heading font-raleway">
              Veloraa
            </span>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
          </Link>
          <Link
            href="/"
            className="text-xs uppercase tracking-[0.08em] text-body transition-colors hover:text-heading font-jetbrains"
          >
            ← Back to site
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-start justify-center px-4 py-6 sm:items-center sm:px-6 sm:py-12 lg:px-8">
        {children}
      </main>
    </div>
  );
}
