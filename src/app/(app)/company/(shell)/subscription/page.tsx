import {
  ArrowUpRight,
  Check,
  CreditCard,
  Download,
  Receipt,
  Sparkles,
  Zap,
  Building2,
  Rocket,
  CalendarDays,
  Shield,
} from "lucide-react";
import { requireApprovedCompany } from "@/lib/company/guard";
import { createClient } from "@/lib/supabase/server";
import { BILLING_PLANS, type PlanId, type Currency } from "@/lib/billing/plans";
import { SubscriptionActions } from "@/components/billing/SubscriptionActions";
import LiveSubscriptionStatus from "@/components/realtime/LiveSubscriptionStatus";

const PLAN_ICONS: Record<string, React.ReactNode> = {
  free: <Zap className="h-5 w-5" />,
  growth: <Building2 className="h-5 w-5" />,
  scale: <Rocket className="h-5 w-5" />,
};

export default async function CompanySubscriptionPage() {
  const { application } = await requireApprovedCompany();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: employer } = await supabase
    .from("company_applications")
    .select(
      "subscription_plan, subscription_status, subscription_interval, payment_provider, payment_currency, current_period_start, current_period_end, has_used_free_post, paddle_customer_id, payfast_token"
    )
    .eq("user_id", user!.id)
    .single();

  const currentPlanId = (employer?.subscription_plan ?? application?.selected_plan ?? "free") as PlanId;
  const currentPlan = BILLING_PLANS.find((p) => p.id === currentPlanId)!;
  const status = (employer?.subscription_status ?? "free") as string;
  const interval = (employer?.subscription_interval ?? "monthly") as "monthly" | "annual";
  const provider = (employer?.payment_provider ?? "paddle") as "paddle" | "payfast";
  const currency = (employer?.payment_currency ?? "USD") as Currency;
  const periodEnd = employer?.current_period_end;
  const symbol = currency === "ZAR" ? "R" : "$";

  const pricing = currency === "ZAR" ? currentPlan.zar : currentPlan.usd;
  const displayPrice =
    currentPlanId === "free"
      ? "0"
      : interval === "annual"
      ? pricing.monthlyEquivalent.toLocaleString()
      : pricing.monthly.toLocaleString();

  const statusLabel: Record<string, { text: string; color: string }> = {
    free: { text: "Free", color: "bg-subtle/10 text-subtle" },
    active: { text: "Active", color: "bg-accent/10 text-accent" },
    paused: { text: "Paused", color: "bg-amber-500/10 text-amber-600" },
    cancelled: { text: "Cancelled", color: "bg-red-500/10 text-red-500" },
    past_due: { text: "Past Due", color: "bg-red-500/10 text-red-500" },
  };
  const badge = statusLabel[status] ?? statusLabel.free;

  return (
    <LiveSubscriptionStatus>
    <div className="mx-auto max-w-5xl px-4 pb-24 sm:px-6 lg:px-10">
      {/* Header */}
      <div>
        <span className="mb-2 inline-block text-[11px] uppercase tracking-[0.08em] text-accent font-jetbrains">
          Subscription
        </span>
        <h1 className="text-3xl font-bold text-heading font-raleway">
          Plan &amp; Billing
        </h1>
        <p className="mt-2 max-w-xl text-sm text-body font-raleway">
          Manage your subscription, view usage, and download invoices.
        </p>
      </div>

      {/* Current plan summary */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-edge bg-surface">
        <div className="flex flex-col gap-4 border-b border-edge p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.1em] text-subtle font-jetbrains">
              Current plan
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  {PLAN_ICONS[currentPlanId]}
                </div>
                <p className="text-2xl font-bold text-heading font-raleway">
                  {currentPlan.name}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-[0.1em] font-jetbrains ${badge.color}`}
              >
                {badge.text}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-body font-raleway">
              {currentPlanId !== "free" && (
                <>
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="h-3 w-3 text-subtle" />
                    {symbol}{displayPrice}/mo
                    {interval === "annual" && (
                      <span className="text-subtle">(billed annually)</span>
                    )}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Shield className="h-3 w-3 text-subtle" />
                    {provider === "paddle" ? "Paddle" : "PayFast"} ({currency})
                  </span>
                </>
              )}
              {periodEnd && (
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-3 w-3 text-subtle" />
                  {status === "cancelled" ? "Access until" : "Renews"}{" "}
                  {new Date(periodEnd).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            {currentPlanId === "free" ? (
              <a
                href="#plans"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-xs font-semibold text-white transition-all hover:opacity-90 hover:shadow-[0_0_24px_rgba(74,222,128,0.35)] font-raleway"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Upgrade plan
              </a>
            ) : (
              <SubscriptionActions
                provider={provider}
                hasPaddleCustomer={!!employer?.paddle_customer_id}
              />
            )}
          </div>
        </div>

        {/* Usage meters */}
        <div className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6">
          <UsageMeter
            label="Active job posts"
            used={0}
            cap={currentPlanId === "free" ? 1 : null}
          />
          <UsageMeter
            label="Talent watchlist"
            used={0}
            cap={
              currentPlanId === "free"
                ? 0
                : currentPlanId === "growth"
                ? 50
                : null
            }
            lockedReason={currentPlanId === "free" ? "Growth and up" : null}
          />
          <UsageMeter
            label="Team seats"
            used={1}
            cap={currentPlanId === "scale" ? 5 : 1}
          />
        </div>
      </section>

      {/* Plan comparison */}
      <section id="plans" className="mt-10">
        <h2 className="mb-4 text-[11px] uppercase tracking-[0.08em] text-subtle font-jetbrains">
          Available plans
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BILLING_PLANS.map((p) => {
            const active = p.id === currentPlanId;
            const planPricing = currency === "ZAR" ? p.zar : p.usd;
            const isFree = p.id === "free";
            return (
              <div
                key={p.id}
                className={`relative flex flex-col rounded-2xl border p-5 ${
                  active
                    ? "border-[3px] border-accent bg-surface shadow-lg shadow-accent/5"
                    : "border border-edge bg-surface"
                }`}
              >
                {p.badge && !active && (
                  <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-accent font-jetbrains">
                    <Sparkles className="h-3 w-3" />
                    {p.badge}
                  </span>
                )}
                {active && (
                  <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-white font-jetbrains">
                    Current
                  </span>
                )}
                <div className="mb-1 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/8 text-icon-dim">
                    {PLAN_ICONS[p.id]}
                  </div>
                  <p className="text-xl font-bold text-heading font-raleway">
                    {p.name}
                  </p>
                </div>
                <p className="text-xs text-body font-raleway">
                  {p.description}
                </p>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-heading font-raleway">
                    {isFree
                      ? `${symbol}0`
                      : `${symbol}${planPricing.monthly.toLocaleString()}`}
                  </span>
                  <span className="ml-1 text-xs text-subtle font-jetbrains">
                    {isFree ? "forever" : "/ mo"}
                  </span>
                  {!isFree && (
                    <p className="mt-0.5 text-[10px] text-subtle font-raleway">
                      or {symbol}
                      {planPricing.annual.toLocaleString()}/yr (save {symbol}
                      {planPricing.savings.toLocaleString()})
                    </p>
                  )}
                </div>
                <ul className="mt-4 flex-1 space-y-1.5 text-xs text-body font-raleway">
                  {p.features
                    .filter((f) => f.included)
                    .slice(0, 6)
                    .map((f) => (
                      <li key={f.text} className="flex items-start gap-1.5">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                        {f.text}
                        {f.detail && (
                          <span className="text-subtle">({f.detail})</span>
                        )}
                      </li>
                    ))}
                </ul>
                {active ? (
                  <div className="mt-5 inline-flex items-center justify-center rounded-lg bg-pill-bg py-2 text-xs font-semibold text-accent font-raleway">
                    Current plan
                  </div>
                ) : isFree ? null : (
                  <UpgradeButton
                    planId={p.id as "growth" | "scale"}
                    provider={provider}
                  />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Payment method + Invoices */}
      <section className="mt-10 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-edge bg-surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-heading font-raleway">
              Payment method
            </h3>
          </div>
          <div className="rounded-xl border border-dashed border-edge bg-page-alt p-4 text-center">
            {status === "active" ? (
              <>
                <p className="text-sm font-semibold text-heading font-raleway">
                  Managed by {provider === "paddle" ? "Paddle" : "PayFast"}
                </p>
                <p className="mt-1 text-xs text-body font-raleway">
                  Your payment method is managed through{" "}
                  {provider === "paddle" ? "Paddle" : "PayFast"}. Use the
                  manage subscription button above to update it.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-heading font-raleway">
                  No active subscription
                </p>
                <p className="mt-1 text-xs text-body font-raleway">
                  Upgrade to a paid plan to add a payment method.
                  {provider === "payfast"
                    ? " We support credit card, EFT, and instant EFT via PayFast."
                    : " We support credit card, PayPal, and Apple Pay via Paddle."}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-edge bg-surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-heading font-raleway">
              Invoices
            </h3>
          </div>
          <div className="rounded-xl border border-dashed border-edge bg-page-alt p-4 text-center">
            <p className="text-sm font-semibold text-heading font-raleway">
              No invoices yet
            </p>
            <p className="mt-1 text-xs text-body font-raleway">
              Receipts will appear here after your first charge. Downloadable
              as PDF.
            </p>
            <button
              type="button"
              disabled
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-edge bg-surface px-4 py-2 text-[11px] font-semibold text-heading transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60 font-raleway"
            >
              <Download className="h-3 w-3" />
              Download all
            </button>
          </div>
        </div>
      </section>

      {/* Contact sales */}
      <section className="mt-10 flex flex-col items-start justify-between gap-3 rounded-2xl border border-edge bg-surface p-5 sm:flex-row sm:items-center sm:p-6">
        <div>
          <p className="text-sm font-semibold text-heading font-raleway">
            Hiring 10+ people this year?
          </p>
          <p className="mt-1 text-xs text-body font-raleway">
            Talk to sales about enterprise pricing, custom SLAs and a
            dedicated talent partner.
          </p>
        </div>
        <a
          href="mailto:sales@veloraa.co"
          className="inline-flex items-center gap-1.5 rounded-lg border border-ghost-border bg-surface px-5 py-2.5 text-xs font-semibold text-heading transition-opacity hover:opacity-80 font-raleway"
        >
          Contact sales
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </section>
    </div>
    </LiveSubscriptionStatus>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function UpgradeButton({
  planId,
  provider,
}: {
  planId: "growth" | "scale";
  provider: "paddle" | "payfast";
}) {
  return (
    <a
      href={`/company/subscription?upgrade=${planId}&provider=${provider}`}
      className="mt-5 inline-flex items-center justify-center rounded-lg bg-accent py-2 text-xs font-semibold text-white transition-all hover:opacity-90 font-raleway"
    >
      Switch to {planId.charAt(0).toUpperCase() + planId.slice(1)}
    </a>
  );
}

function UsageMeter({
  label,
  used,
  cap,
  lockedReason,
}: {
  label: string;
  used: number;
  cap: number | null;
  lockedReason?: string | null;
}) {
  const pct =
    cap == null
      ? 0
      : Math.min(100, Math.max(0, (used / Math.max(cap, 1)) * 100));

  return (
    <div className="rounded-xl border border-edge bg-page-alt p-4">
      <p className="text-[10px] uppercase tracking-[0.1em] text-subtle font-jetbrains">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-heading font-raleway">
        {used}
        <span className="ml-1 text-xs font-normal text-subtle">
          / {cap == null ? "Unlimited" : cap}
        </span>
      </p>
      {cap != null && cap > 0 ? (
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-edge">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      ) : (
        <p className="mt-2 text-[10px] text-subtle font-jetbrains">
          {lockedReason ?? "—"}
        </p>
      )}
    </div>
  );
}
