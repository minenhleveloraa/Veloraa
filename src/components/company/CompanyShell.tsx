"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Briefcase,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Moon,
  MoreHorizontal,
  Settings,
  Sparkles,
  Sun,
  User,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReviewStatus } from "@/lib/types/db";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useRealtime } from "@/components/realtime/RealtimeProvider";
import { signOut } from "@/app/actions/auth";

// ---------------------------------------------------------------------------
// Nav definition
// ---------------------------------------------------------------------------

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Whether the route requires the company to be approved. */
  gated: boolean;
};

const TOP_NAV: readonly NavItem[] = [
  { href: "/company/dashboard", label: "Overview", icon: LayoutDashboard, gated: false },
  { href: "/company/jobs", label: "Jobs", icon: Briefcase, gated: true },
  { href: "/company/candidates", label: "Candidates", icon: Users, gated: true },
  { href: "/company/messages", label: "Messages", icon: MessageSquare, gated: true },
  { href: "/company/subscription", label: "Subscription", icon: CreditCard, gated: true },
  { href: "/company/settings", label: "Settings", icon: Settings, gated: false },
] as const;

// Four real destinations + a "More" sheet trigger.
const BOTTOM_TABS: readonly NavItem[] = [
  { href: "/company/dashboard", label: "Home", icon: LayoutDashboard, gated: false },
  { href: "/company/jobs", label: "Jobs", icon: Briefcase, gated: true },
  { href: "/company/candidates", label: "Talent", icon: Users, gated: true },
  { href: "/company/messages", label: "Messages", icon: MessageSquare, gated: true },
] as const;

function isActive(current: string | null, href: string): boolean {
  if (!current) return false;
  if (href === "/company/dashboard") return current === "/company/dashboard";
  return current === href || current.startsWith(`${href}/`);
}

// ---------------------------------------------------------------------------
// Shell
// ---------------------------------------------------------------------------

export default function CompanyShell({
  children,
  companyName,
  planName,
  reviewStatus,
  userEmail,
  userName,
  logoUrl = null,
  messagesUnread = 0,
}: {
  children: React.ReactNode;
  companyName: string | null;
  planName: string;
  reviewStatus: ReviewStatus;
  userEmail: string | null;
  userName: string | null;
  logoUrl?: string | null;
  messagesUnread?: number;
}) {
  const pathname = usePathname();
  const approved = reviewStatus === "approved";
  const [moreState, setMoreState] = useState({ open: false, pathname });
  const moreOpen = moreState.open && moreState.pathname === pathname;
  const isMessages = !!pathname?.startsWith("/company/messages");
  const rt = useRealtime();

  // Prefer the live count from RealtimeProvider; fall back to the SSR prop.
  const liveUnread = rt.messagesUnread ?? messagesUnread;

  const unreadByHref: Record<string, number> = {
    "/company/messages": liveUnread,
  };

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-page">
      <CompanyTopNav
        companyName={companyName}
        planName={planName}
        reviewStatus={reviewStatus}
        userEmail={userEmail}
        userName={userName}
        logoUrl={logoUrl}
        approved={approved}
        pathname={pathname}
        unreadByHref={unreadByHref}
      />

      {/* The messaging surface owns the full viewport under the chrome by
          positioning itself with `fixed`, so skip the default main padding
          on those routes. */}
      <main className={cn(isMessages ? "" : "pt-20 pb-28 lg:pb-10")}>
        {children}
      </main>

      <CompanyBottomTabs
        pathname={pathname}
        approved={approved}
        onOpenMore={() => setMoreState({ open: true, pathname })}
        unreadByHref={unreadByHref}
      />

      <MoreSheet
        open={moreOpen}
        onClose={() =>
          setMoreState((state) => ({ ...state, open: false }))
        }
        approved={approved}
        userEmail={userEmail}
        userName={userName}
        companyName={companyName}
        planName={planName}
        logoUrl={logoUrl}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Top nav
// ---------------------------------------------------------------------------

function CompanyTopNav({
  companyName,
  planName,
  reviewStatus,
  userEmail,
  userName,
  logoUrl,
  approved,
  pathname,
  unreadByHref,
}: {
  companyName: string | null;
  planName: string;
  reviewStatus: ReviewStatus;
  userEmail: string | null;
  userName: string | null;
  logoUrl: string | null;
  approved: boolean;
  pathname: string | null;
  unreadByHref: Record<string, number>;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed left-0 right-0 top-0 z-40 transition-all duration-300",
        scrolled
          ? "border-b border-edge bg-page/85 shadow-[0_6px_30px_-20px_rgba(0,0,0,0.4)] backdrop-blur-xl"
          : "border-b border-transparent bg-page/60 backdrop-blur-xl"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/company/dashboard"
          className="group flex shrink-0 items-center gap-2"
          aria-label="Veloraa company dashboard"
        >
          <span className="text-lg font-bold tracking-tight text-heading transition-colors group-hover:text-accent font-raleway sm:text-xl">
            Veloraa
          </span>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          <span className="ml-2 hidden rounded-full border border-edge bg-surface px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-subtle md:inline-block font-jetbrains">
            Company
          </span>
        </Link>

        {/* Desktop nav — hidden under lg */}
        <nav className="mx-auto hidden items-center gap-1 lg:flex">
          {TOP_NAV.map((item) => (
            <DesktopNavLink
              key={item.href}
              item={item}
              active={isActive(pathname, item.href)}
              locked={!approved && item.gated}
              unread={unreadByHref[item.href] ?? 0}
            />
          ))}
        </nav>

        {/* Right rail */}
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <ReviewStatusPill status={reviewStatus} />
          <ThemeToggle />
          <AvatarMenu
            userEmail={userEmail}
            userName={userName}
            companyName={companyName}
            planName={planName}
            logoUrl={logoUrl}
            approved={approved}
          />
        </div>
      </div>
    </header>
  );
}

function DesktopNavLink({
  item,
  active,
  locked,
  unread,
}: {
  item: NavItem;
  active: boolean;
  locked: boolean;
  unread: number;
}) {
  const Icon = item.icon;
  const target = locked ? "/company/dashboard" : item.href;

  return (
    <Link
      href={target}
      aria-disabled={locked || undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors font-raleway",
        active
          ? "text-accent"
          : "text-body hover:text-heading",
        locked && "opacity-55"
      )}
    >
      {/* Active background — shared element animates between links */}
      {active && (
        <motion.span
          layoutId="company-top-active"
          className="absolute inset-0 -z-10 rounded-full border border-accent/30 bg-accent/10 shadow-[0_0_0_1px_rgba(74,222,128,0.15),0_10px_30px_-18px_rgba(74,222,128,0.6)]"
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        />
      )}
      {/* Hover wash */}
      {!active && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-surface opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
      )}
      <span className="relative">
        <Icon
          className={cn(
            "h-4 w-4 transition-transform duration-300",
            "group-hover:-translate-y-[1px] group-hover:scale-110",
            active && "text-accent"
          )}
        />
        {unread > 0 && (
          <span
            aria-label={`${unread} unread`}
            className="absolute -right-1 -top-1 flex h-2 w-2 items-center justify-center rounded-full bg-accent shadow-[0_0_6px_rgba(74,222,128,0.7)]"
          >
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
          </span>
        )}
      </span>
      <span className="relative">
        {item.label}
        {/* Futuristic underline shimmer */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute -bottom-1 left-0 h-[2px] w-full origin-left rounded-full bg-gradient-to-r from-transparent via-accent to-transparent transition-transform duration-400 ease-out",
            active
              ? "scale-x-100 opacity-80"
              : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-70"
          )}
        />
      </span>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Review-status pill
// ---------------------------------------------------------------------------

function ReviewStatusPill({ status }: { status: ReviewStatus }) {
  if (status === "approved") return null;
  const label = status === "rejected" ? "Closed" : "Review";
  const styles =
    status === "rejected"
      ? "border-amber-500/40 bg-amber-500/10 text-amber-600"
      : "border-amber-500/40 bg-amber-500/10 text-amber-600";
  return (
    <span
      className={cn(
        "hidden rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] font-jetbrains sm:inline-flex",
        styles
      )}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Theme toggle
// ---------------------------------------------------------------------------

function ThemeToggle() {
  const { theme, toggle, mounted } = useTheme();
  const dark = mounted && theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      title={dark ? "Light mode" : "Dark mode"}
      className="group relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-edge bg-surface text-body transition-all hover:border-accent/40 hover:text-accent hover:shadow-[0_0_18px_-4px_rgba(74,222,128,0.45)]"
    >
      <span className="relative h-4 w-4">
        <AnimatePresence initial={false} mode="wait">
          {dark ? (
            <motion.span
              key="moon"
              initial={{ y: 8, opacity: 0, rotate: -90 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              exit={{ y: -8, opacity: 0, rotate: 90 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Moon className="h-4 w-4" />
            </motion.span>
          ) : (
            <motion.span
              key="sun"
              initial={{ y: 8, opacity: 0, rotate: -90 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              exit={{ y: -8, opacity: 0, rotate: 90 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Sun className="h-4 w-4" />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Avatar menu
// ---------------------------------------------------------------------------

function AvatarMenu({
  userEmail,
  userName,
  companyName,
  planName,
  logoUrl,
  approved,
}: {
  userEmail: string | null;
  userName: string | null;
  companyName: string | null;
  planName: string;
  logoUrl: string | null;
  approved: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const initial = (companyName?.trim()?.[0] ?? userName?.trim()?.[0] ?? userEmail?.trim()?.[0] ?? "?")
    .toUpperCase();

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "group inline-flex items-center gap-2 rounded-full border border-edge bg-surface px-1 py-1 pr-2 transition-all",
          "hover:border-accent/40 hover:shadow-[0_0_18px_-4px_rgba(74,222,128,0.45)]",
          open && "border-accent/40"
        )}
      >
        <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-accent/15 text-xs font-bold text-accent font-raleway">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            initial
          )}
        </span>
        <span className="hidden max-w-[120px] truncate text-xs font-semibold text-heading sm:inline-block font-raleway">
          {companyName ?? userName ?? "Account"}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="avatar-menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-72 overflow-hidden rounded-xl border border-edge bg-surface shadow-2xl shadow-black/10 backdrop-blur-xl"
            role="menu"
          >
            {/* Clickable profile preview header — opens /company/profile. */}
            <Link
              href="/company/profile"
              onClick={() => setOpen(false)}
              className="group flex items-center gap-3 border-b border-edge p-4 transition-colors hover:bg-page-alt"
            >
              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-accent/15 text-base font-bold text-accent font-raleway">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  initial
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-heading font-raleway">
                  {companyName ?? "Your company"}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-subtle font-jetbrains">
                  {userEmail ?? "—"}
                </p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="rounded-full border border-accent/30 bg-accent/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-accent font-jetbrains">
                    {planName} plan
                  </span>
                  {!approved && (
                    <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-amber-600 font-jetbrains">
                      Pending
                    </span>
                  )}
                </div>
                <span className="mt-1.5 inline-flex items-center gap-0.5 text-[10px] font-semibold text-accent transition-transform group-hover:translate-x-0.5 font-jetbrains">
                  View profile
                  <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            </Link>

            <div className="p-1.5">
              <MenuItem
                href="/company/profile"
                icon={User}
                label="My profile"
                onSelect={() => setOpen(false)}
              />
              <MenuItem
                href="/company/settings"
                icon={Settings}
                label="Settings"
                onSelect={() => setOpen(false)}
              />
              <MenuItem
                href="/company/subscription"
                icon={CreditCard}
                label="Subscription & billing"
                onSelect={() => setOpen(false)}
              />
              {planName.toLowerCase() === "free" && approved && (
                <MenuItem
                  href="/company/subscription"
                  icon={Sparkles}
                  label="Upgrade to Growth"
                  accent
                  onSelect={() => setOpen(false)}
                />
              )}
            </div>

            <div className="border-t border-edge p-1.5">
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await signOut();
                    window.location.href = "/";
                  })
                }
                className="group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-body transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-60 font-raleway"
              >
                <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                {pending ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItem({
  href,
  icon: Icon,
  label,
  accent = false,
  onSelect,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  accent?: boolean;
  onSelect?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      role="menuitem"
      className={cn(
        "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors font-raleway",
        accent
          ? "text-accent hover:bg-accent/10"
          : "text-body hover:bg-page-alt hover:text-heading"
      )}
    >
      <Icon className="h-4 w-4 transition-transform group-hover:scale-110" />
      {label}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Mobile bottom tabs
// ---------------------------------------------------------------------------

function CompanyBottomTabs({
  pathname,
  approved,
  onOpenMore,
  unreadByHref,
}: {
  pathname: string | null;
  approved: boolean;
  onOpenMore: () => void;
  unreadByHref: Record<string, number>;
}) {
  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-edge bg-page/90 backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-xl items-stretch justify-around px-2 pt-2">
        {BOTTOM_TABS.map((item) => (
          <BottomTabLink
            key={item.href}
            item={item}
            active={isActive(pathname, item.href)}
            locked={!approved && item.gated}
            unread={unreadByHref[item.href] ?? 0}
          />
        ))}
        <BottomTabButton
          label="More"
          icon={MoreHorizontal}
          onClick={onOpenMore}
        />
      </div>
    </nav>
  );
}

function BottomTabLink({
  item,
  active,
  locked,
  unread,
}: {
  item: NavItem;
  active: boolean;
  locked: boolean;
  unread: number;
}) {
  const Icon = item.icon;
  const target = locked ? "/company/dashboard" : item.href;

  return (
    <Link
      href={target}
      aria-disabled={locked || undefined}
      aria-current={active ? "page" : undefined}
      className="relative flex flex-1 flex-col items-center justify-end gap-0.5 py-1.5"
    >
      {/* Top indicator */}
      <span
        className={cn(
          "absolute -top-[1px] h-0.5 w-8 rounded-full transition-all duration-300",
          active ? "bg-accent opacity-100" : "bg-transparent opacity-0"
        )}
        aria-hidden
      />
      <motion.span
        animate={active ? { scale: 1, y: 0 } : { scale: 1, y: 0 }}
        whileTap={{ scale: 0.9 }}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-full transition-all",
          active
            ? "bg-accent/10 text-accent"
            : locked
            ? "text-subtle/70"
            : "text-body"
        )}
      >
        <Icon
          className={cn(
            "h-5 w-5 transition-transform duration-300",
            active && "scale-110"
          )}
        />
        {/* Active glow */}
        {active && (
          <motion.span
            layoutId="company-bottom-glow"
            className="absolute inset-0 -z-10 rounded-full bg-accent/15 shadow-[0_0_20px_-4px_rgba(74,222,128,0.6)]"
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
          />
        )}
        {unread > 0 && (
          <span
            aria-label={`${unread} unread`}
            className={cn(
              "absolute -right-0.5 -top-0.5 flex items-center justify-center rounded-full bg-accent text-[9px] font-bold text-white shadow-[0_0_8px_rgba(74,222,128,0.7)] font-jetbrains",
              unread > 9 ? "h-4 min-w-[1.1rem] px-1" : "h-4 w-4"
            )}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </motion.span>
      <span
        className={cn(
          "text-[10px] font-medium transition-colors font-raleway",
          active
            ? "text-accent"
            : locked
            ? "text-subtle/70"
            : "text-body"
        )}
      >
        {item.label}
      </span>
    </Link>
  );
}

function BottomTabButton({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex flex-1 flex-col items-center justify-end gap-0.5 py-1.5"
    >
      <motion.span
        whileTap={{ scale: 0.9 }}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-body transition-all"
      >
        <Icon className="h-5 w-5" />
      </motion.span>
      <span className="text-[10px] font-medium text-body font-raleway">
        {label}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Mobile "More" sheet
// ---------------------------------------------------------------------------

function MoreSheet({
  open,
  onClose,
  approved,
  userEmail,
  userName,
  companyName,
  planName,
  logoUrl,
}: {
  open: boolean;
  onClose: () => void;
  approved: boolean;
  userEmail: string | null;
  userName: string | null;
  companyName: string | null;
  planName: string;
  logoUrl: string | null;
}) {
  const { theme, toggle, mounted } = useTheme();
  const [pending, startTransition] = useTransition();
  const dark = mounted && theme === "dark";
  const initial = (companyName?.trim()?.[0] ?? userName?.trim()?.[0] ?? userEmail?.trim()?.[0] ?? "?")
    .toUpperCase();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden"
          />
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="fixed bottom-0 left-0 right-0 z-50 overflow-hidden rounded-t-3xl border-t border-edge bg-surface shadow-[0_-20px_60px_-10px_rgba(0,0,0,0.4)] lg:hidden"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
            role="dialog"
            aria-modal="true"
          >
            {/* Grab handle */}
            <div className="flex justify-center pt-3">
              <span className="h-1 w-10 rounded-full bg-edge" />
            </div>

            <div className="flex items-start gap-3 px-5 pb-4 pt-4">
              <Link
                href="/company/profile"
                onClick={onClose}
                className="group flex min-w-0 flex-1 items-start gap-3 rounded-xl -m-1 p-1 transition-colors hover:bg-page-alt"
              >
                <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-accent/15 text-base font-bold text-accent font-raleway">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoUrl}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    initial
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-heading font-raleway">
                    {companyName ?? "Your company"}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-subtle font-jetbrains">
                    {userEmail ?? "—"}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full border border-accent/30 bg-accent/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-accent font-jetbrains">
                      {planName} plan
                    </span>
                    {!approved && (
                      <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-amber-600 font-jetbrains">
                        Pending
                      </span>
                    )}
                  </div>
                  <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-semibold text-accent transition-transform group-hover:translate-x-0.5 font-jetbrains">
                    View profile
                    <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-edge bg-page-alt text-body transition-colors hover:border-accent/40 hover:text-accent"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 px-5">
              <SheetTile
                href="/company/profile"
                icon={User}
                label="Profile"
                sub="View public"
                onSelect={onClose}
              />
              <SheetTile
                href="/company/subscription"
                icon={CreditCard}
                label="Billing"
                sub="Manage plan"
                onSelect={onClose}
              />
              <SheetTile
                href="/company/settings"
                icon={Settings}
                label="Settings"
                sub="Preferences"
                onSelect={onClose}
              />
            </div>

            <div className="px-5 pt-4">
              <button
                type="button"
                onClick={toggle}
                className="flex w-full items-center justify-between rounded-xl border border-edge bg-page-alt px-4 py-3 text-left transition-colors hover:border-accent/40"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-accent">
                    {dark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-heading font-raleway">
                      {dark ? "Dark mode" : "Light mode"}
                    </p>
                    <p className="text-[11px] text-subtle font-jetbrains">
                      Tap to switch theme
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
                    dark ? "bg-accent" : "bg-edge"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                      dark ? "translate-x-[18px]" : "translate-x-0.5"
                    )}
                  />
                </span>
              </button>
            </div>

            <div className="px-5 pb-4 pt-3">
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await signOut();
                    window.location.href = "/";
                  })
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm font-semibold text-red-500 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60 font-raleway"
              >
                <LogOut className="h-4 w-4" />
                {pending ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function SheetTile({
  href,
  icon: Icon,
  label,
  sub,
  onSelect,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  sub: string;
  onSelect?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      className="group flex items-start gap-3 rounded-xl border border-edge bg-page-alt p-3 transition-all hover:border-accent/40 hover:shadow-[0_0_24px_-10px_rgba(74,222,128,0.45)]"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-accent transition-transform group-hover:scale-105">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-heading font-raleway">
          {label}
        </p>
        <p className="truncate text-[11px] text-subtle font-jetbrains">{sub}</p>
      </div>
    </Link>
  );
}
