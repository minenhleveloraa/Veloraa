"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Minus, Zap, Building2, Rocket, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BILLING_PLANS,
  COMPARISON_ROWS,
  type PlanDefinition,
  type Currency,
} from "@/lib/billing/plans";

// Currency is determined silently by the v_currency cookie set in proxy.ts
// from x-vercel-ip-country. ZA → ZAR (PayFast), everyone else → USD (Paddle).
// No user-facing toggle exists; this is intentional per SUBSCRIPTION_PLAN §3.

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

const sectionVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE_OUT },
  },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE_OUT },
  },
};

const PLAN_ICONS: Record<string, React.ReactNode> = {
  free: <Zap className="h-5 w-5" />,
  growth: <Building2 className="h-5 w-5" />,
  scale: <Rocket className="h-5 w-5" />,
};

const faqs = [
  {
    q: "How does the AI matching work?",
    a: "Our AI analyzes your job requirements, team culture signals, and technical needs against our vetted talent pool. It scores candidates on 40+ dimensions including skill depth, experience relevance, and cultural fit — surfacing only the strongest matches.",
  },
  {
    q: "What does 'vetted' mean exactly?",
    a: "Every candidate on Veloraa passes a multi-stage process: automated resume scoring, a technical assessment tailored to their domain, a live interview with a senior engineer, and reference checks. Only the top 1% make it through.",
  },
  {
    q: "Are there any per-hire or placement fees?",
    a: "No. Veloraa is subscription-only. There are no per-hire fees, no placement fees, and no per-post charges beyond the free tier. Your subscription is the only cost.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. All plans are billed monthly or annually with no lock-in. You can cancel at any time and retain access through the end of your billing period.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept the major cards, Apple/Google Pay, and PayPal worldwide via Paddle. South African subscribers pay in ZAR via PayFast (card, EFT, instant EFT). Your currency and provider are picked automatically based on your location — no toggle needed.",
  },
  {
    q: "What roles can I hire for?",
    a: "Veloraa specializes in technical roles: software engineers, DevOps, data scientists, ML engineers, product managers, designers, and engineering leaders. If it\u2019s technical, we cover it.",
  },
];

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function BillingToggle({
  isAnnual,
  onToggle,
}: {
  isAnnual: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-4">
      <span
        className={cn(
          "text-sm font-medium transition-colors font-raleway",
          !isAnnual ? "text-heading" : "text-subtle"
        )}
      >
        Monthly
      </span>
      <button
        onClick={onToggle}
        className="relative h-7 w-[52px] rounded-full border border-edge bg-edge transition-colors"
        aria-label="Toggle billing period"
      >
        <motion.div
          className="absolute top-0.5 h-5 w-5 rounded-full bg-btn-bg"
          animate={{ left: isAnnual ? 26 : 3 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>
      <span
        className={cn(
          "text-sm font-medium transition-colors font-raleway",
          isAnnual ? "text-heading" : "text-subtle"
        )}
      >
        Annual
      </span>
      {isAnnual && (
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-full bg-accent/10 px-3 py-0.5 text-xs font-semibold text-accent font-jetbrains"
        >
          2 MONTHS FREE
        </motion.span>
      )}
    </div>
  );
}

function PricingCard({
  plan,
  isAnnual,
  currency,
}: {
  plan: PlanDefinition;
  isAnnual: boolean;
  currency: Currency;
}) {
  const pricing = currency === "ZAR" ? plan.zar : plan.usd;
  const isFree = plan.id === "free";
  const isFeatured = plan.id === "growth";
  const isScale = plan.id === "scale";
  const symbol = currency === "ZAR" ? "R" : "$";

  const displayPrice = isFree
    ? 0
    : isAnnual
    ? pricing.monthlyEquivalent
    : pricing.monthly;

  const annualTotal = pricing.annual;

  const ctaHref = isFree ? "/signup?type=employer" : "/signup?type=employer";
  const ctaText = isFree
    ? "Get Started Free"
    : `Get ${plan.name}`;

  return (
    <motion.div
      variants={cardVariants}
      className={cn(
        "relative flex flex-col rounded-2xl p-px",
        isFeatured
          ? "bg-linear-to-b from-accent/30 via-accent/10 to-transparent"
          : "bg-edge"
      )}
    >
      {plan.badge && (
        <div className="absolute -top-3.5 left-1/2 z-10 -translate-x-1/2">
          <span
            className={cn(
              "whitespace-nowrap rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wider font-jetbrains",
              isFeatured
                ? "bg-btn-bg text-btn-fg"
                : "bg-accent/10 text-accent border border-accent/20"
            )}
          >
            {plan.badge}
          </span>
        </div>
      )}

      <div
        className={cn(
          "flex h-full flex-col rounded-2xl p-7 transition-colors duration-300 sm:p-8",
          isFeatured ? "bg-surface" : "bg-surface/80"
        )}
      >
        {/* Header */}
        <div className="mb-5">
          <div className="mb-3 flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                isFeatured
                  ? "bg-accent/15 text-accent"
                  : "bg-accent/8 text-icon-dim"
              )}
            >
              {PLAN_ICONS[plan.id]}
            </div>
            <h3 className="text-xl font-semibold text-heading font-raleway">
              {plan.name}
            </h3>
          </div>
          <p className="text-sm leading-relaxed text-body font-raleway">
            {plan.description}
          </p>
        </div>

        {/* Price */}
        <div className="mb-7">
          <div className="flex items-baseline gap-1">
            <span
              className={cn(
                "font-bold text-heading font-sans",
                symbol === "R" ? "text-3xl" : "text-4xl"
              )}
            >
              {symbol}
            </span>
            <motion.span
              key={`${displayPrice}-${currency}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-5xl font-bold text-heading font-sans tracking-tight"
            >
              {isFree ? "0" : displayPrice.toLocaleString()}
            </motion.span>
            <span className="ml-1 text-sm text-subtle font-raleway">
              {isFree ? "forever" : "/ mo"}
            </span>
          </div>
          <p className="mt-1.5 h-5 text-xs text-subtle font-sans font-medium">
            {isFree
              ? "No credit card required"
              : isAnnual
              ? `Billed annually (${symbol}${annualTotal.toLocaleString()}/yr)`
              : "\u00A0"}
          </p>
        </div>

        {/* CTA */}
        <Link
          href={ctaHref}
          className={cn(
            "mb-7 flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-all font-raleway",
            isFeatured
              ? "bg-btn-bg text-btn-fg hover:opacity-90 hover:shadow-lg"
              : isScale
              ? "bg-accent text-white hover:opacity-90 hover:shadow-[0_0_24px_rgba(74,222,128,0.25)]"
              : "border border-ghost-border text-ghost-text hover:opacity-80"
          )}
        >
          {ctaText}
          {!isFree && <ArrowRight className="h-3.5 w-3.5" />}
        </Link>

        {/* Features */}
        <div className="flex-1">
          <p className="mb-4 text-xs uppercase tracking-[0.08em] text-subtle font-jetbrains">
            {isFree ? "What\u2019s included" : `Everything ${isFeatured ? "you need" : "in Growth, plus"}`}
          </p>
          <ul className="space-y-2.5">
            {plan.features.map((f, i) => (
              <li key={i} className="flex items-start gap-2.5">
                {f.included ? (
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-v-check" />
                ) : (
                  <Minus className="mt-0.5 h-4 w-4 shrink-0 text-subtle/50" />
                )}
                <span
                  className={cn(
                    "text-sm font-raleway",
                    f.included ? "text-heading/80" : "text-subtle/60"
                  )}
                >
                  {f.text}
                  {f.included && f.detail && (
                    <span className="ml-1 text-xs text-subtle">
                      ({f.detail})
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

function ComparisonTable({ currency, isAnnual }: { currency: Currency; isAnnual: boolean }) {
  const symbol = currency === "ZAR" ? "R" : "$";
  const [free, growth, scale] = BILLING_PLANS;
  const gp = currency === "ZAR" ? growth.zar : growth.usd;
  const sp = currency === "ZAR" ? scale.zar : scale.usd;

  const priceRow = {
    label: isAnnual ? "Annual price" : "Monthly price",
    free: `${symbol}0`,
    growth: isAnnual
      ? `${symbol}${gp.annual.toLocaleString()}/yr`
      : `${symbol}${gp.monthly.toLocaleString()}/mo`,
    scale: isAnnual
      ? `${symbol}${sp.annual.toLocaleString()}/yr`
      : `${symbol}${sp.monthly.toLocaleString()}/mo`,
  };

  const rows = [...COMPARISON_ROWS, priceRow];

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-edge">
            <th className="py-4 pr-4 text-left text-xs uppercase tracking-[0.08em] text-subtle font-jetbrains">
              Feature
            </th>
            {[free, growth, scale].map((p) => (
              <th
                key={p.id}
                className={cn(
                  "px-4 py-4 text-center text-xs uppercase tracking-[0.08em] font-jetbrains",
                  p.id === "growth" ? "text-accent" : "text-subtle"
                )}
              >
                {p.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.label}
              className={cn(
                "border-b border-edge/50",
                i % 2 === 0 ? "bg-transparent" : "bg-page-alt/30"
              )}
            >
              <td className="py-3.5 pr-4 text-sm text-heading font-raleway">
                {row.label}
              </td>
              {[row.free, row.growth, row.scale].map((val, j) => (
                <td
                  key={j}
                  className="px-4 py-3.5 text-center text-sm font-raleway"
                >
                  {val === "\u2713" ? (
                    <Check className="mx-auto h-4 w-4 text-v-check" />
                  ) : val === "\u2014" || val === "—" ? (
                    <Minus className="mx-auto h-4 w-4 text-subtle/40" />
                  ) : (
                    <span
                      className={cn(
                        j === 0 ? "text-subtle" : "text-heading/80",
                        (val.includes("$") || val.includes("R")) && "font-sans font-semibold"
                      )}
                    >
                      {val}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-edge py-5">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="pr-4 text-base font-medium text-heading font-raleway">
          {q}
        </span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-edge text-accent"
        >
          <span className="text-lg leading-none">+</span>
        </motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3, ease: EASE_OUT }}
        className="overflow-hidden"
      >
        <p className="pt-3 text-sm leading-relaxed text-body font-libre">
          {a}
        </p>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function Pricing({ defaultCurrency = "USD" }: { defaultCurrency?: Currency }) {
  const [isAnnual, setIsAnnual] = useState(false);
  // Currency is locked to the cookie value — no user-facing toggle.
  const currency = defaultCurrency;
  const prefersReduced = useReducedMotion();

  const motionSection = prefersReduced
    ? {}
    : {
        variants: sectionVariants,
        initial: "hidden" as const,
        whileInView: "visible" as const,
        viewport: { once: true, margin: "-80px" },
      };

  return (
    <div className="bg-page transition-colors duration-300">
      {/* Hero header */}
      <section className="relative overflow-hidden pb-4 pt-32 sm:pt-40">
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2">
          <div className="h-[400px] w-[600px] rounded-full bg-glow-soft blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-8">
          <motion.div {...motionSection}>
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-pill-border bg-pill-bg px-4 py-1.5 text-xs uppercase tracking-[0.08em] text-pill-text font-jetbrains">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
              Simple, Transparent Pricing
            </span>

            <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-heading sm:text-5xl lg:text-[56px] font-raleway">
              Invest in the <span className="text-accent">Right Talent</span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-body font-libre italic">
              No hidden fees. No per-hire charges. Subscription-only pricing
              that scales with your hiring ambition.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4">
              <BillingToggle
                isAnnual={isAnnual}
                onToggle={() => setIsAnnual(!isAnnual)}
              />
              <p className="text-[11px] text-subtle/70 font-jetbrains">
                Prices shown in {currency === "ZAR" ? "ZAR (South Africa)" : "USD (international)"}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="relative overflow-hidden px-6 pb-24 pt-12 lg:px-8">
        <motion.div
          className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3 md:items-start"
          {...(prefersReduced
            ? {}
            : {
                variants: staggerContainer,
                initial: "hidden" as const,
                whileInView: "visible" as const,
                viewport: { once: true, margin: "-60px" },
              })}
        >
          {BILLING_PLANS.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              isAnnual={isAnnual}
              currency={currency}
            />
          ))}
        </motion.div>

        <p className="mx-auto mt-10 max-w-xl text-center text-sm text-subtle font-raleway">
          All paid plans renew automatically. Cancel anytime — you keep access
          until the end of your billing period.
        </p>
      </section>

      {/* Comparison table */}
      <section className="border-t border-edge bg-page-alt/50 px-6 py-20 transition-colors duration-300 lg:px-8">
        <motion.div className="mx-auto max-w-5xl" {...motionSection}>
          <div className="mb-10 text-center">
            <span className="mb-3 inline-block text-xs uppercase tracking-[0.08em] text-accent font-jetbrains">
              Compare Plans
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-heading sm:text-4xl font-raleway">
              Feature Breakdown
            </h2>
          </div>
          <div className="rounded-2xl border border-edge bg-surface p-4 sm:p-6">
            <ComparisonTable currency={currency} isAnnual={isAnnual} />
          </div>
        </motion.div>
      </section>

      {/* FAQ */}
      <section className="border-t border-edge bg-page-alt px-6 py-24 transition-colors duration-300 lg:px-8">
        <motion.div className="mx-auto max-w-3xl" {...motionSection}>
          <div className="mb-12 text-center">
            <span className="mb-3 inline-block text-xs uppercase tracking-[0.08em] text-accent font-jetbrains">
              FAQ
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-heading sm:text-4xl font-raleway">
              Common Questions
            </h2>
          </div>
          <div>
            {faqs.map((faq, i) => (
              <FAQItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </motion.div>
      </section>

      {/* Final CTA — always dark for contrast */}
      <section className="relative overflow-hidden bg-dark-green px-6 py-24 lg:px-8">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[300px] w-[500px] rounded-full bg-bright-green/5 blur-[100px]" />
        </div>
        <motion.div
          className="relative mx-auto max-w-2xl text-center"
          {...motionSection}
        >
          <h2 className="text-3xl font-bold tracking-tight text-beige sm:text-4xl font-raleway">
            Ready to hire the{" "}
            <span className="text-bright-green">top 1%</span>?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-beige/60 font-libre italic">
            Join hundreds of companies already building world-class teams
            through Veloraa.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup?type=employer"
              className="inline-flex items-center justify-center rounded-lg bg-bright-green px-8 py-3.5 text-sm font-semibold text-dark-surface transition-all hover:shadow-[0_0_30px_rgba(74,222,128,0.3)] font-raleway"
            >
              Start Hiring Today
            </Link>
            <Link
              href="/signup?type=talent"
              className="inline-flex items-center justify-center rounded-lg border border-beige/20 px-8 py-3.5 text-sm font-semibold text-beige transition-all hover:border-beige/40 font-raleway"
            >
              Apply as Talent
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
