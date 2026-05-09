import Link from "next/link";
import { redirect } from "next/navigation";
import { Briefcase, ShieldCheck, LogOut, MessageSquare, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail, syncAdminMembership } from "@/lib/admin";
import { signOut } from "@/app/actions/auth";
import { unreadCountForAdmin } from "@/lib/messaging/queries";
import RealtimeProvider from "@/components/realtime/RealtimeProvider";

export const metadata = {
  title: "Admin — Veloraa",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // -----------------------------------------------------------------
  // Layer 1 — must be signed in.
  // Layer 2 — email must be on the ADMIN_EMAILS allowlist.
  // (Layer 3 lives in every admin server action — re-verify there.)
  // -----------------------------------------------------------------
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin");
  if (!isAdminEmail(user.email)) redirect("/");

  // Ensure this admin's uid is in `public.admin_users` so the DB-side
  // `is_admin()` function used by messaging RLS returns true for them.
  await syncAdminMembership(user.id);

  const unread = await unreadCountForAdmin(user.id);

  return (
    <div className="relative flex min-h-screen flex-col bg-page transition-colors duration-300">
      <header className="sticky top-0 z-30 border-b border-edge bg-page/90 backdrop-blur supports-backdrop-filter:bg-page/70">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex items-center gap-2 text-sm font-bold tracking-tight text-heading font-raleway"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-white">
                <ShieldCheck className="h-4 w-4" />
              </span>
              Veloraa
              <span className="hidden rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-accent font-jetbrains sm:inline">
                Admin
              </span>
            </Link>
          </div>

          <nav className="hidden items-center gap-6 text-xs uppercase tracking-[0.08em] text-body font-jetbrains sm:flex">
            <Link
              href="/admin"
              className="transition-colors hover:text-heading"
            >
              Dashboard
            </Link>
            <Link
              href="/admin?status=approved"
              className="transition-colors hover:text-heading"
            >
              Approved
            </Link>
            <Link
              href="/admin?status=rejected"
              className="transition-colors hover:text-heading"
            >
              Rejected
            </Link>
            <Link
              href="/admin?type=jobs"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-heading"
            >
              <Briefcase className="h-3.5 w-3.5" />
              Jobs
            </Link>
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-heading"
            >
              <Users className="h-3.5 w-3.5" />
              Users
            </Link>
            <Link
              href="/admin/messages"
              className="relative inline-flex items-center gap-1.5 transition-colors hover:text-heading"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Messages
              {unread > 0 && (
                <span
                  aria-label={`${unread} unread messages`}
                  className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white font-jetbrains"
                >
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden text-[11px] text-subtle font-jetbrains sm:inline">
              {user.email}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg border border-ghost-border bg-surface px-3 py-1.5 text-xs font-semibold text-heading transition-opacity hover:opacity-80 font-raleway"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <RealtimeProvider userId={user.id} initialMessagesUnread={unread} kind="admin">
          {children}
        </RealtimeProvider>
      </main>
    </div>
  );
}
