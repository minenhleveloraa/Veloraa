"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BellDot,
  Briefcase,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Moon,
  MoreHorizontal,
  Send,
  Settings,
  Sun,
  User,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useRealtime } from "@/components/realtime/RealtimeProvider";
import { signOut } from "@/app/actions/auth";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const TOP_NAV: readonly NavItem[] = [
  { href: "/talent/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/talent/jobs", label: "Jobs", icon: Briefcase },
  { href: "/talent/invites", label: "Invites", icon: Send },
  { href: "/talent/messages", label: "Messages", icon: MessageSquare },
  { href: "/talent/settings", label: "Settings", icon: Settings },
] as const;

const BOTTOM_TABS: readonly NavItem[] = [
  { href: "/talent/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/talent/jobs", label: "Jobs", icon: Briefcase },
  { href: "/talent/messages", label: "Messages", icon: MessageSquare },
  { href: "/talent/notifications", label: "Alerts", icon: BellDot },
] as const;

function isActive(current: string | null, href: string): boolean {
  if (!current) return false;
  if (href === "/talent/dashboard") {
    return (
      current === "/talent/dashboard" || current === "/talent" || current === "/talent/"
    );
  }
  return current === href || current.startsWith(`${href}/`);
}

export default function TalentShell({
  children,
  isLive,
  userEmail,
  userName,
  messagesUnread = 0,
}: {
  children: React.ReactNode;
  isLive: boolean;
  userEmail: string | null;
  userName: string | null;
  messagesUnread?: number;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const isMessages = !!pathname?.startsWith("/talent/messages");
  const rt = useRealtime();

  // Prefer the live count from RealtimeProvider; fall back to the SSR prop.
  const liveUnread = rt.messagesUnread ?? messagesUnread;

  const unreadByHref: Record<string, number> = {
    "/talent/messages": liveUnread,
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-page">
      <ShellBackdrop />

      <TalentTopNav
        isLive={isLive}
        userEmail={userEmail}
        userName={userName}
        pathname={pathname}
        unreadByHref={unreadByHref}
      />

      <main className={cn("relative z-10", isMessages ? "" : "pt-20 pb-28 lg:pb-10")}>
        {children}
      </main>

      <TalentBottomTabs
        pathname={pathname}
        onOpenMore={() => setMoreOpen(true)}
        unreadByHref={unreadByHref}
      />

      <TalentMoreSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        isLive={isLive}
        userEmail={userEmail}
        userName={userName}
      />
    </div>
  );
}

function ShellBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-56 bg-linear-to-b from-accent/8 via-accent/3 to-transparent" />
      <div className="absolute -right-24 top-20 h-72 w-72 rounded-full bg-accent/10 blur-3xl dark:bg-accent/12" />
      <div className="absolute -left-20 top-[30rem] h-64 w-64 rounded-full bg-heading/5 blur-3xl dark:bg-accent/6" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-surface/60 to-transparent" />
    </div>
  );
}

function TalentTopNav({
  isLive,
  userEmail,
  userName,
  pathname,
  unreadByHref,
}: {
  isLive: boolean;
  userEmail: string | null;
  userName: string | null;
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
        <Link
          href="/talent/dashboard"
          className="group flex shrink-0 items-center gap-2"
          aria-label="Veloraa talent home"
        >
          <span className="text-lg font-bold tracking-tight text-heading transition-colors group-hover:text-accent font-raleway sm:text-xl">
            Veloraa
          </span>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
         
        </Link>

        <nav className="mx-auto hidden items-center gap-1 lg:flex">
          {TOP_NAV.map((item) => (
            <DesktopNavLink
              key={item.href}
              item={item}
              active={isActive(pathname, item.href)}
              unread={unreadByHref[item.href] ?? 0}
            />
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <StatusLine isLive={isLive} />
          <ThemeToggle />
          <AvatarMenu userEmail={userEmail} userName={userName} />
        </div>
      </div>
    </header>
  );
}

function StatusLine({ isLive }: { isLive: boolean }) {
  return (
    <div className="hidden items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-subtle font-jetbrains sm:flex">
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          isLive
            ? "bg-accent shadow-[0_0_10px_rgba(74,222,128,0.7)]"
            : "bg-amber-500"
        )}
      />
      <span>{isLive ? "Live in pool" : "Application active"}</span>
    </div>
  );
}

function DesktopNavLink({
  item,
  active,
  unread,
}: {
  item: NavItem;
  active: boolean;
  unread: number;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors font-raleway",
        active
          ? "text-accent"
          : "text-body hover:text-heading"
      )}
    >
      {/* Active background — shared element animates between links */}
      {active && (
        <motion.span
          layoutId="talent-top-active"
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
            "h-4 w-4 transition-transform duration-300 ease-out",
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

function AvatarMenu({
  userEmail,
  userName,
}: {
  userEmail: string | null;
  userName: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const initial = (userName?.trim()?.[0] ?? userEmail?.trim()?.[0] ?? "?")
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
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "group inline-flex items-center gap-2 rounded-full border border-edge bg-surface px-1 py-1 pr-2 transition-all",
          "hover:border-accent/40 hover:shadow-[0_0_18px_-4px_rgba(74,222,128,0.45)]",
          open && "border-accent/40"
        )}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent font-raleway">
          {initial}
        </span>
        <span className="hidden max-w-[120px] truncate text-xs font-semibold text-heading font-raleway sm:inline-block">
          {userName ?? "Account"}
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
            <div className="border-b border-edge p-4">
              <p className="truncate text-sm font-semibold text-heading font-raleway">
                {userName ?? "Talent"}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-subtle font-jetbrains">
                {userEmail ?? "-"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-1.5 p-1.5">
              <MenuItem
                href="/talent/profile"
                icon={User}
                label="Profile"
                onSelect={() => setOpen(false)}
              />
              <MenuItem
                href="/talent/jobs"
                icon={Briefcase}
                label="Jobs"
                onSelect={() => setOpen(false)}
              />
              <MenuItem
                href="/talent/messages"
                icon={MessageSquare}
                label="Messages"
                onSelect={() => setOpen(false)}
              />
              <MenuItem
                href="/talent/settings"
                icon={Settings}
                label="Settings"
                onSelect={() => setOpen(false)}
              />
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
                {pending ? "Signing out..." : "Sign out"}
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
  onSelect,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  onSelect?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      role="menuitem"
      className="group flex items-center gap-2.5 rounded-lg border border-transparent px-3 py-2 text-sm text-body transition-colors hover:border-edge hover:bg-page-alt hover:text-heading font-raleway"
    >
      <Icon className="h-4 w-4 transition-transform group-hover:scale-110 group-hover:text-accent" />
      {label}
    </Link>
  );
}

function TalentBottomTabs({
  pathname,
  onOpenMore,
  unreadByHref,
}: {
  pathname: string | null;
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
            unread={unreadByHref[item.href] ?? 0}
          />
        ))}
        <BottomTabButton label="More" icon={MoreHorizontal} onClick={onOpenMore} />
      </div>
    </nav>
  );
}

function BottomTabLink({
  item,
  active,
  unread,
}: {
  item: NavItem;
  active: boolean;
  unread: number;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
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
            layoutId="talent-bottom-glow"
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

function TalentMoreSheet({
  open,
  onClose,
  isLive,
  userEmail,
  userName,
}: {
  open: boolean;
  onClose: () => void;
  isLive: boolean;
  userEmail: string | null;
  userName: string | null;
}) {
  const { theme, toggle, mounted } = useTheme();
  const [pending, startTransition] = useTransition();
  const dark = mounted && theme === "dark";
  const initial = (userName?.trim()?.[0] ?? userEmail?.trim()?.[0] ?? "?")
    .toUpperCase();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
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
            aria-label="More options"
          >
            <div className="flex justify-center pt-3">
              <span className="h-1 w-10 rounded-full bg-edge" />
            </div>

            <div className="flex items-start gap-3 px-5 pb-4 pt-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-base font-bold text-accent font-raleway">
                {initial}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-heading font-raleway">
                  {userName ?? "Talent"}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-subtle font-jetbrains">
                  {userEmail ?? "-"}
                </p>
                <div className="mt-1.5 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-subtle font-jetbrains">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      isLive ? "bg-accent" : "bg-amber-500"
                    )}
                  />
                  <span>{isLive ? "Live in pool" : "Application active"}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-edge bg-page-alt text-body transition-colors hover:border-accent/40 hover:text-accent"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 px-5">
              <SheetTile
                href="/talent/profile"
                icon={User}
                label="Profile"
                sub="Edit your talent profile"
                onSelect={onClose}
              />
              <SheetTile
                href="/talent/invites"
                icon={Send}
                label="Invites"
                sub="Intros and requests"
                onSelect={onClose}
              />
              <SheetTile
                href="/talent/messages"
                icon={MessageSquare}
                label="Messages"
                sub="Veloraa and companies"
                onSelect={onClose}
              />
              <SheetTile
                href="/talent/settings"
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
                    <p className="text-[11px] text-subtle font-jetbrains">Tap to switch</p>
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
                {pending ? "Signing out..." : "Sign out"}
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
      className="group flex flex-col gap-1 rounded-xl border border-edge bg-page-alt p-4 transition-all hover:border-accent/40 hover:shadow-[0_0_24px_-10px_rgba(74,222,128,0.45)]"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-accent transition-transform group-hover:scale-105">
        <Icon className="h-4 w-4" />
      </span>
      <p className="text-sm font-semibold text-heading font-raleway">{label}</p>
      <p className="text-[11px] text-subtle font-jetbrains">{sub}</p>
    </Link>
  );
}
