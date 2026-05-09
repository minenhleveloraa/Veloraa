"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Sun,
  Moon,
  User,
  LogOut,
  ChevronDown,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { signOut } from "@/app/actions/auth";

/* ─── Nav link config ─── */
const navLinks = [
  { label: "For Talent", href: "/for-talent" },
  { label: "For Companies", href: "/for-companies" },
  { label: "Pricing", href: "/pricing" },
  { label: "About Us", href: "/about" },
];

/* ─── Animation constants ─── */
const SPRING = { type: "spring", stiffness: 400, damping: 30 } as const;
const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ─── Desktop nav link with active glow ─── */
function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative px-3 py-1.5 text-[13px] font-medium tracking-wide transition-colors duration-200 font-raleway",
        active
          ? "text-bright-green"
          : "text-warm-white/70 hover:text-warm-white"
      )}
    >
      {label}
      {/* Hover underline */}
      <span
        className={cn(
          "absolute -bottom-0.5 left-3 right-3 h-px origin-left transition-transform duration-300 ease-out",
          active
            ? "scale-x-100 bg-bright-green"
            : "scale-x-0 bg-bright-green/60 group-hover:scale-x-100"
        )}
      />
      {/* Active glow dot */}
      {active && (
        <motion.span
          layoutId="nav-active"
          className="absolute -bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-bright-green"
          style={{ boxShadow: "0 0 8px 2px rgba(74,222,128,0.5)" }}
          transition={SPRING}
        />
      )}
    </Link>
  );
}

/* ─── User avatar component ─── */
function UserAvatar({
  src,
  name,
  size = 32,
}: {
  src?: string | null;
  name: string;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className="relative overflow-hidden rounded-full border border-bright-green/30"
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          width={size}
          height={size}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-bright-green/10 text-[10px] font-bold text-bright-green font-raleway">
          {initials}
        </div>
      )}
      {/* Glow ring */}
      <div className="absolute inset-0 rounded-full ring-1 ring-bright-green/20" />
    </div>
  );
}

/* ─── Mobile menu variants ─── */
const mobileOverlayVariants = {
  closed: { opacity: 0 },
  open: {
    opacity: 1,
    transition: { duration: 0.3, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, ease: EASE_OUT, delay: 0.1 },
  },
};

const mobileContentVariants = {
  closed: { opacity: 0, y: 30 },
  open: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: EASE_OUT, staggerChildren: 0.06, delayChildren: 0.15 },
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: { duration: 0.2, ease: EASE_OUT },
  },
};

const mobileLinkVariants = {
  closed: { opacity: 0, x: -20 },
  open: { opacity: 1, x: 0, transition: { duration: 0.35, ease: EASE_OUT } },
};

/* ─── Dropdown variants ─── */
const dropdownVariants = {
  hidden: { opacity: 0, y: -4, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.15, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    y: -4,
    scale: 0.95,
    transition: { duration: 0.1 },
  },
};

/* ═══════════════════════════════════════════════════
   Nav — Liquid glass floating navbar
   ═══════════════════════════════════════════════════ */
export default function Nav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { theme, toggle, mounted: themeMounted } = useTheme();
  const { user, profile, loading: authLoading } = useAuth();
  const [signingOut, startSignOut] = useTransition();

  const isAuthed = !!user;
  const displayName = profile?.full_name ?? user?.email?.split("@")[0] ?? "You";
  const firstName = displayName.split(" ")[0];
  const avatarUrl = profile?.avatar_url;
  const userRole = profile?.role;

  /* Scroll listener */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Lock body scroll when mobile menu open */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  /* Close user dropdown on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = () =>
    startSignOut(async () => {
      setUserMenuOpen(false);
      await signOut();
      window.location.href = "/";
    });

  /* Dashboard link based on role */
  const dashboardHref =
    userRole === "company"
      ? "/company/dashboard"
      : userRole === "talent"
        ? "/talent/dashboard"
        : "/profile";

  return (
    <>
      {/* ─── Floating header bar ─── */}
      <header className="fixed top-0 z-50 w-full px-3 pt-3 sm:px-5 sm:pt-4">
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
          className={cn(
            "relative mx-auto flex h-14 max-w-6xl items-center justify-between rounded-2xl px-4 transition-all duration-500 lg:px-6",
            "bg-dark-green",
            scrolled
              ? "shadow-[0_8px_32px_rgba(0,0,0,0.25)]"
              : "shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
          )}
        >
          {/* Top-edge accent line */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-bright-green/30 to-transparent" />

          {/* ─── Logo ─── */}
          <Link href="/" className="group relative flex items-center gap-2.5">
            <span className="relative text-lg font-bold tracking-tight text-warm-white font-raleway">
              Veloraa
              {/* Subtle glow behind logo text */}
              <span className="absolute -inset-1 -z-10 rounded-lg bg-bright-green/[0.06] opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100" />
            </span>
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bright-green opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-bright-green" />
            </span>
          </Link>

          {/* ─── Desktop nav links (center) ─── */}
          <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                label={link.label}
                active={pathname === link.href}
              />
            ))}
          </div>

          {/* ─── Desktop right section ─── */}
          <div className="hidden items-center gap-2.5 lg:flex">
            {/* Theme toggle */}
            <button
              onClick={toggle}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200",
                "border border-white/[0.08] bg-white/[0.04]",
                "text-warm-white/60 hover:border-bright-green/20 hover:bg-bright-green/[0.06] hover:text-warm-white"
              )}
              aria-label={
                themeMounted
                  ? `Switch to ${theme === "light" ? "dark" : "light"} mode`
                  : "Toggle theme"
              }
              suppressHydrationWarning
            >
              {themeMounted ? (
                <AnimatePresence mode="wait">
                  {theme === "light" ? (
                    <motion.span
                      key="moon"
                      initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                      animate={{ opacity: 1, rotate: 0, scale: 1 }}
                      exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Moon className="h-3.5 w-3.5" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="sun"
                      initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
                      animate={{ opacity: 1, rotate: 0, scale: 1 }}
                      exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Sun className="h-3.5 w-3.5" />
                    </motion.span>
                  )}
                </AnimatePresence>
              ) : (
                <span className="block h-3.5 w-3.5" aria-hidden />
              )}
            </button>

            {/* Divider */}
            <div className="h-5 w-px bg-white/[0.08]" />

            {authLoading ? (
              /* Skeleton while loading auth */
              <div className="flex items-center gap-2">
                <div className="h-8 w-16 animate-pulse rounded-xl bg-white/[0.06]" />
                <div className="h-8 w-20 animate-pulse rounded-xl bg-white/[0.06]" />
              </div>
            ) : isAuthed ? (
              /* ─── Authenticated: avatar + dropdown ─── */
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl py-1 pl-1 pr-2.5 transition-all duration-200",
                    "border border-white/[0.08] bg-white/[0.04]",
                    "hover:border-bright-green/20 hover:bg-bright-green/[0.06]",
                    userMenuOpen && "border-bright-green/25 bg-bright-green/[0.08]"
                  )}
                >
                  <UserAvatar src={avatarUrl} name={displayName} size={28} />
                  <span className="max-w-[100px] truncate text-[13px] font-medium text-warm-white/90 font-raleway">
                    {firstName}
                  </span>
                  <motion.span
                    animate={{ rotate: userMenuOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-3 w-3 text-warm-white/40" />
                  </motion.span>
                </button>

                {/* Dropdown */}
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className={cn(
                        "absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl",
                        "border border-white/[0.08]",
                        "bg-dark-green/80 backdrop-blur-2xl backdrop-saturate-150",
                        "shadow-[0_16px_48px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]"
                      )}
                      style={{ WebkitBackdropFilter: "blur(40px) saturate(1.5)" }}
                    >
                      {/* Top glow line */}
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-bright-green/25 to-transparent" />

                      {/* User info */}
                      <div className="border-b border-white/[0.06] px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar src={avatarUrl} name={displayName} size={36} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-warm-white font-raleway">
                              {displayName}
                            </p>
                            <p className="truncate text-[11px] text-warm-white/40 font-raleway">
                              {user?.email}
                            </p>
                          </div>
                        </div>
                        {userRole && (
                          <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-bright-green/10 px-2 py-0.5">
                            <Sparkles className="h-2.5 w-2.5 text-bright-green" />
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-bright-green font-jetbrains">
                              {userRole}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Menu items */}
                      <div className="p-1.5">
                        <Link
                          href={dashboardHref}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-warm-white/80 transition-colors hover:bg-bright-green/[0.08] hover:text-warm-white font-raleway"
                        >
                          <User className="h-3.5 w-3.5 text-warm-white/40" />
                          Dashboard
                        </Link>
                        <button
                          onClick={handleSignOut}
                          disabled={signingOut}
                          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-warm-white/80 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50 font-raleway"
                        >
                          <LogOut className="h-3.5 w-3.5 text-warm-white/40" />
                          {signingOut ? "Signing out…" : "Sign out"}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* ─── Not authenticated: Sign in + Get Started ─── */
              <>
                <Link
                  href="/sign-in"
                  className={cn(
                    "rounded-xl px-3.5 py-1.5 text-[13px] font-medium transition-all duration-200 font-raleway",
                    "text-warm-white/70 hover:text-warm-white"
                  )}
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className={cn(
                    "group relative inline-flex items-center gap-1.5 overflow-hidden rounded-xl px-4 py-1.5 text-[13px] font-semibold transition-all duration-300 font-raleway",
                    "bg-bright-green text-dark-green",
                    "hover:shadow-[0_0_20px_rgba(74,222,128,0.3)]"
                  )}
                >
                  {/* Shimmer sweep on hover */}
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                  <span className="relative">Get started</span>
                  <ArrowRight className="relative h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </>
            )}
          </div>

          {/* ─── Mobile right section ─── */}
          <div className="flex items-center gap-1.5 lg:hidden">
            {/* Theme toggle */}
            <button
              onClick={toggle}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-warm-white/60 transition-colors hover:text-warm-white"
              aria-label={
                themeMounted
                  ? `Switch to ${theme === "light" ? "dark" : "light"} mode`
                  : "Toggle theme"
              }
              suppressHydrationWarning
            >
              {themeMounted ? (
                theme === "light" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )
              ) : (
                <span className="block h-4 w-4" aria-hidden />
              )}
            </button>

            {/* Hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="relative z-50 flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-white/[0.06]"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              <AnimatePresence mode="wait">
                {mobileOpen ? (
                  <motion.span
                    key="close"
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="h-5 w-5 text-warm-white" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="menu"
                    initial={{ opacity: 0, rotate: 90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: -90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="h-5 w-5 text-warm-white" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>

          {/* Bottom-edge line */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px rounded-b-2xl bg-gradient-to-r from-transparent via-bright-green/10 to-transparent" />
        </motion.nav>
      </header>

      {/* ─── Mobile full-screen overlay ─── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 lg:hidden"
            variants={mobileOverlayVariants}
            initial="closed"
            animate="open"
            exit="exit"
          >
            {/* Backdrop glass */}
            <div
              className="absolute inset-0 bg-dark-surface/90 backdrop-blur-2xl"
              style={{ WebkitBackdropFilter: "blur(40px)" }}
            />

            {/* Floating orbs for depth */}
            <div className="pointer-events-none absolute -left-32 top-1/4 h-64 w-64 rounded-full bg-bright-green/[0.04] blur-3xl" />
            <div className="pointer-events-none absolute -right-32 bottom-1/4 h-64 w-64 rounded-full bg-bright-green/[0.03] blur-3xl" />

            {/* Content */}
            <motion.div
              className="relative flex h-full flex-col items-center justify-center px-6"
              variants={mobileContentVariants}
              initial="closed"
              animate="open"
              exit="exit"
            >
              {/* User greeting at top */}
              {isAuthed && (
                <motion.div variants={mobileLinkVariants} className="mb-10 flex flex-col items-center gap-3">
                  <UserAvatar src={avatarUrl} name={displayName} size={56} />
                  <div className="text-center">
                    <p className="text-lg font-semibold text-warm-white font-raleway">
                      {displayName}
                    </p>
                    <p className="text-xs text-warm-white/40 font-raleway">
                      {user?.email}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Nav links */}
              <nav className="flex flex-col items-center gap-1">
                {navLinks.map((link) => (
                  <motion.div key={link.href} variants={mobileLinkVariants}>
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "block rounded-xl px-6 py-3 text-center text-xl font-semibold transition-colors font-raleway",
                        pathname === link.href
                          ? "text-bright-green"
                          : "text-warm-white/70 hover:text-warm-white"
                      )}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Bottom CTAs */}
              <motion.div
                variants={mobileLinkVariants}
                className="mt-10 flex w-full max-w-xs flex-col items-center gap-3"
              >
                {isAuthed ? (
                  <>
                    <Link
                      href={dashboardHref}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-base font-semibold transition-all font-raleway",
                        "bg-bright-green text-dark-green",
                        "shadow-[0_0_20px_rgba(74,222,128,0.2)]"
                      )}
                    >
                      <Sparkles className="h-4 w-4" />
                      Go to Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        handleSignOut();
                      }}
                      disabled={signingOut}
                      className={cn(
                        "flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-base font-medium transition-all font-raleway",
                        "border border-white/[0.1] bg-white/[0.04] text-warm-white/70",
                        "hover:border-red-500/30 hover:text-red-400"
                      )}
                    >
                      <LogOut className="h-4 w-4" />
                      {signingOut ? "Signing out…" : "Sign out"}
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/sign-up"
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-base font-semibold transition-all font-raleway",
                        "bg-bright-green text-dark-green",
                        "shadow-[0_0_20px_rgba(74,222,128,0.2)]"
                      )}
                    >
                      Get started
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/sign-in"
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex w-full items-center justify-center rounded-2xl py-3.5 text-base font-medium transition-all font-raleway",
                        "border border-white/[0.1] bg-white/[0.04] text-warm-white/70",
                        "hover:border-bright-green/30 hover:text-warm-white"
                      )}
                    >
                      Sign in
                    </Link>
                  </>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
