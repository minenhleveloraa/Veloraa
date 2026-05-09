"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowRight, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Link columns data ─── */
const companyLinks = [
  { label: "About Us", href: "/about" },
  { label: "Pricing", href: "/pricing" },
  { label: "For Companies", href: "/for-companies", external: false },
  { label: "For Talent", href: "/for-talent", external: false },
  { label: "How It Works", href: "/how-it-works" },
];

const socialLinks = [
  { label: "Twitter/X", href: "https://x.com/veloraa", external: true },
  { label: "LinkedIn", href: "https://linkedin.com/company/veloraa", external: true },
  { label: "Instagram", href: "https://instagram.com/veloraa", external: true },
];

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
];

/* ─── Footer link with arrow ─── */
function FooterLink({
  href,
  label,
  external = false,
}: {
  href: string;
  label: string;
  external?: boolean;
}) {
  const Component = external ? "a" : Link;
  const externalProps = external
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <Component
      href={href}
      {...externalProps}
      className="group flex items-center gap-1.5 text-sm text-gray-500 dark:text-muted-beige/70 transition-colors duration-200 hover:text-mid-green dark:hover:text-bright-green font-raleway"
    >
      {label}
      {external && (
        <ArrowUpRight className="h-3.5 w-3.5 text-gray-400 dark:text-muted-beige/40 transition-all duration-200 group-hover:text-mid-green dark:group-hover:text-bright-green group-hover:-translate-y-px group-hover:translate-x-px" />
      )}
    </Component>
  );
}

/* ═══════════════════════════════════════════════════
   Footer — Marketing pages only
   ═══════════════════════════════════════════════════ */
export default function Footer() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    // TODO: Hook up to newsletter API
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setEmail("");
  };

  return (
    <footer className="relative overflow-hidden bg-white dark:bg-dark-surface">
      {/* ─── Decorative green blobs / shapes ─── */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {/* Top-left soft green circle */}
        <div
          className="absolute -left-24 -top-20 h-72 w-72 rounded-full opacity-[0.07] dark:opacity-[0.15]"
          style={{
            background:
              "radial-gradient(circle, #4ADE80 0%, #16A34A 50%, transparent 70%)",
          }}
        />
        {/* Top-right elongated green shape */}
        <div
          className="absolute -right-16 top-8 h-56 w-96 rotate-12 rounded-[60px] opacity-[0.05] dark:opacity-[0.12]"
          style={{
            background:
              "linear-gradient(135deg, #16A34A 0%, #4ADE80 60%, transparent 100%)",
          }}
        />
        {/* Bottom-center soft blob */}
        <div
          className="absolute bottom-0 left-1/2 h-64 w-[500px] -translate-x-1/2 translate-y-1/3 rounded-full opacity-[0.04] dark:opacity-[0.10]"
          style={{
            background:
              "radial-gradient(ellipse, #4ADE80 0%, #16A34A 40%, transparent 70%)",
          }}
        />
        {/* Small floating dot — top center */}
        <div className="absolute left-[45%] top-12 h-3 w-3 rounded-full bg-bright-green/20" />
        {/* Small floating dot — right */}
        <div className="absolute right-[12%] top-[40%] h-2 w-2 rounded-full bg-mid-green/15" />
        {/* Thin decorative line across the top */}
        <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-mid-green/20 to-transparent" />
      </div>

      {/* ─── Main footer content ─── */}
      <div className="relative mx-auto max-w-7xl px-6 pb-10 pt-16 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_0.8fr_1.5fr] lg:gap-12">
          {/* Column 1: Logo + tagline */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-dark-green dark:text-warm-white font-raleway">
                Veloraa
              </span>
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mid-green opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-mid-green" />
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-gray-500 dark:text-muted-beige/70 font-raleway">
              The premium talent marketplace connecting the world&apos;s top 1%
              of vetted engineers, designers, and product leaders with
              companies worthy of their craft.
            </p>

            {/* Small decorative green accent bar */}
            <div className="mt-5 flex items-center gap-1.5">
              <div className="h-1 w-6 rounded-full bg-mid-green/40" />
              <div className="h-1 w-3 rounded-full bg-bright-green/30" />
              <div className="h-1 w-1.5 rounded-full bg-bright-green/20" />
            </div>
          </div>

          {/* Column 2: Company links */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-mid-green dark:text-bright-green font-raleway">
              Company
            </h4>
            <ul className="flex flex-col gap-3">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <FooterLink
                    href={link.href}
                    label={link.label}
                    external={link.external}
                  />
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Socials */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-mid-green dark:text-bright-green font-raleway">
              Socials
            </h4>
            <ul className="flex flex-col gap-3">
              {socialLinks.map((link) => (
                <li key={link.href}>
                  <FooterLink
                    href={link.href}
                    label={link.label}
                    external={link.external}
                  />
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-mid-green dark:text-bright-green font-raleway">
              Newsletter
            </h4>
            <p className="mb-4 text-sm text-gray-500 dark:text-muted-beige/70 font-raleway">
              Receive product updates, hiring tips, and early access to new features.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="relative">
              <div className="flex items-center overflow-hidden rounded-full border border-gray-200 dark:border-bright-green/15 bg-gray-50/60 dark:bg-white/[0.04] shadow-sm transition-all duration-300 focus-within:border-mid-green/40 dark:focus-within:border-bright-green/30 focus-within:shadow-[0_0_0_3px_rgba(22,163,74,0.08)] dark:focus-within:shadow-[0_0_0_3px_rgba(74,222,128,0.08)] focus-within:bg-white dark:focus-within:bg-white/[0.06]">
                <Mail className="ml-4 h-4 w-4 shrink-0 text-mid-green/50" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email..."
                  className="flex-1 bg-transparent px-3 py-3 text-sm text-dark-green dark:text-warm-white placeholder:text-gray-400 dark:placeholder:text-muted-beige/40 focus:outline-none font-raleway"
                  required
                />
                <button
                  type="submit"
                  className={cn(
                    "mr-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-300",
                    submitted
                      ? "bg-mid-green text-white shadow-md shadow-mid-green/25"
                      : "bg-gradient-to-br from-mid-green to-emerald-600 text-white hover:shadow-lg hover:shadow-mid-green/20 hover:scale-105 active:scale-95"
                  )}
                  aria-label="Subscribe"
                >
                  {submitted ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ─── Bottom bar ─── */}
      <div className="relative border-t border-gray-100 dark:border-bright-green/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-5 sm:flex-row lg:px-8">
          {/* Left: copyright */}
          <p className="text-xs text-gray-400 dark:text-muted-beige/50 font-raleway">
            © {new Date().getFullYear()} Veloraa · All rights reserved
          </p>

          {/* Center: legal links */}
          <div className="flex items-center gap-4">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-gray-400 dark:text-muted-beige/50 transition-colors duration-200 hover:text-mid-green dark:hover:text-bright-green font-raleway"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right: social icons */}
          <div className="flex items-center gap-3">
            {/* Twitter/X */}
            <a
              href="https://x.com/veloraa"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 dark:text-muted-beige/50 transition-all duration-200 hover:bg-mid-green/10 hover:text-mid-green dark:hover:text-bright-green"
              aria-label="Twitter"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            {/* LinkedIn */}
            <a
              href="https://linkedin.com/company/veloraa"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 dark:text-muted-beige/50 transition-all duration-200 hover:bg-mid-green/10 hover:text-mid-green dark:hover:text-bright-green"
              aria-label="LinkedIn"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
            {/* Instagram */}
            <a
              href="https://instagram.com/veloraa"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 dark:text-muted-beige/50 transition-all duration-200 hover:bg-mid-green/10 hover:text-mid-green dark:hover:text-bright-green"
              aria-label="Instagram"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
