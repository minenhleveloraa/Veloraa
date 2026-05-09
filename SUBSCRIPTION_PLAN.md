# Veloraa Subscription System — Full Revamp Plan

> Goal: redesign the **entire** subscription experience end-to-end —
> marketing pricing page, company subscription dashboard, onboarding,
> checkout, webhooks, receipts, and platform-wide feature gating —
> around a clean two-currency model (USD via Paddle for the world,
> ZAR via PayFast for South Africa) with **silent geo-detection** and
> the new lower price points.
>
> User-stated requirements (verbatim, paraphrased):
> 1. **Drop prices** to:
>    - **Tier 1** (Growth): **$49/mo USD** ≈ **R799/mo ZAR**
>    - **Tier 2** (Scale): **$119/mo USD** ≈ **R1,999/mo ZAR**
>    - Annual gets **~2 months free** discount.
>    - Keep **Free** tier.
> 2. **No currency toggle.** Country is detected silently —
>    South Africa = ZAR everywhere from the marketing site through
>    checkout and receipts; everyone else (China, UAE, France, UK, …)
>    = USD via Paddle.
> 3. **Revamp the UI** of the marketing pricing page **and** the
>    in-app `/company/subscription` dashboard.
> 4. **Receipts** — email + downloadable PDF.
> 5. **Plan-aware platform** — gate features (talent search, pipeline,
>    analytics, team seats, …) by active subscription, Spotify/YouTube
>    style. Locked features render with a tasteful upsell overlay
>    instead of disappearing.
>
> This document is the plan only — no code changes yet. Some snippets
> below are illustrative shapes for what the eventual code will look
> like, not finished implementations.

---

## 0. TL;DR

| Layer | Today | After this plan |
| --- | --- | --- |
| **Pricing** | $199 / $399 USD; R3,699 / R7,399 ZAR | **$49 / $119** USD; **R799 / R1,999** ZAR |
| **Currency** | Manual toggle on `/pricing` | Silent geo-detect (already wired in `@c:\Users\minen\OneDrive\Desktop\Veloraa2.0\veloraa\src\proxy.ts:25-36`); ZA → ZAR, all others → USD |
| **Plan source of truth** | Two parallel definitions (`PLANS` in `@c:\Users\minen\OneDrive\Desktop\Veloraa2.0\veloraa\src\lib\company\options.ts:217` and `BILLING_PLANS` in `@c:\Users\minen\OneDrive\Desktop\Veloraa2.0\veloraa\src\lib\billing\plans.ts:38`) | One canonical `BILLING_PLANS` registry; legacy `PLANS` deleted |
| **Effective plan resolver** | Three different rules across `gate.ts`, `candidate-access.ts`, `job-posting.ts` | One `getEffectivePlan(application)` used everywhere |
| **Feature gating** | `canAccess()` exists but is unused outside one file; pages read `selected_plan` directly | Server gates on every protected route + client `<FeatureLock>` overlay component |
| **Receipts** | None | Branded HTML email + signed PDF download |
| **Pricing page** | Static `BillingToggle` + `CurrencyToggle` | Refreshed visual layer, no currency toggle, "Most popular" + "Best value" badges, mobile-first cards |
| **Subscription dashboard** | One linear page, mixes status + plan picker | Two zones: **Current plan** (status, period, manage, invoices) and **Change plan** (compare + checkout). Side panel on desktop, stacked on mobile. |
| **Webhooks** | Paddle + PayFast handlers exist but use wrong column (`company_name` vs `legal_name`) and have no idempotency | Idempotent insert keyed by event id + correct columns |

The good news: **the plumbing is already 70% there.** This plan is mostly
about consolidating, repricing, polishing, and gating.

---

## 1. Audit — what we already have

### 1.1 Files touching billing today

| Path | Role | Verdict |
| --- | --- | --- |
| `@c:\Users\minen\OneDrive\Desktop\Veloraa2.0\veloraa\src\lib\billing\plans.ts` | `BILLING_PLANS`, `formatPrice`, comparison rows. Single canonical pricing. | **Keep + reprice.** |
| `@c:\Users\minen\OneDrive\Desktop\Veloraa2.0\veloraa\src\lib\billing\detectProvider.ts` | `detectPaymentProvider("South Africa" \| "ZA") → "payfast"` else `"paddle"`. | **Keep.** Tighten ISO‑3166 input. |
| `@c:\Users\minen\OneDrive\Desktop\Veloraa2.0\veloraa\src\lib\billing\paddle.ts` | Server-only Paddle node SDK. | **Keep.** |
| `@c:\Users\minen\OneDrive\Desktop\Veloraa2.0\veloraa\src\lib\billing\payfast.ts` | MD5 signature + base URL. | **Keep.** |
| `@c:\Users\minen\OneDrive\Desktop\Veloraa2.0\veloraa\src\lib\billing\payfast-plans.ts` | Plan amount + frequency map. | **Reprice.** |
| `@c:\Users\minen\OneDrive\Desktop\Veloraa2.0\veloraa\src\lib\billing\gate.ts` | `canAccess(feature)`. Currently almost unused. | **Keep + adopt everywhere.** |
| `@c:\Users\minen\OneDrive\Desktop\Veloraa2.0\veloraa\src\lib\company\options.ts:217` | Legacy `PLANS` w/ `$199/$399` strings, used in onboarding wizard. | **Delete.** Replace consumers with `BILLING_PLANS`. |
| `@c:\Users\minen\OneDrive\Desktop\Veloraa2.0\veloraa\src\lib\company\candidate-access.ts` | `getEffectiveCompanyPlanId(application)`. | **Promote to shared `getEffectivePlan` in `@/lib/billing/plans.ts`.** |
| `@c:\Users\minen\OneDrive\Desktop\Veloraa2.0\veloraa\src\components\marketing\Pricing.tsx` | The `/pricing` page. Has manual currency toggle. | **Rewrite.** |
| `@c:\Users\minen\OneDrive\Desktop\Veloraa2.0\veloraa\src\app\(marketing)\pricing\page.tsx` | Reads `v_currency` cookie, passes default to `<Pricing>`. | **Keep, rename.** |
| `@c:\Users\minen\OneDrive\Desktop\Veloraa2.0\veloraa\src\app\(app)\company\(shell)\subscription\page.tsx` | In-app subscription dashboard. | **Rewrite.** |
| `@c:\Users\minen\OneDrive\Desktop\Veloraa2.0\veloraa\src\components\billing\CheckoutButton.tsx` | Provider router (Paddle vs PayFast). | **Keep.** |
| `@c:\Users\minen\OneDrive\Desktop\Veloraa2.0\veloraa\src\components\billing\PaddleCheckout.tsx` | Inline Paddle.js checkout. | **Keep.** |
| `@c:\Users\minen\OneDrive\Desktop\Veloraa2.0\veloraa\src\components\billing\PayFastCheckout.tsx` | Form-post to PayFast. | **Keep.** |
| `@c:\Users\minen\OneDrive\Desktop\Veloraa2.0\veloraa\src\components\billing\SubscriptionActions.tsx` | "Manage subscription" buttons. | **Refactor into the dashboard.** |
| `@c:\Users\minen\OneDrive\Desktop\Veloraa2.0\veloraa\src\app\api\billing\paddle\checkout\route.ts` | Creates Paddle customer + returns priceId. | **Fix `company_name` bug → `legal_name`.** |
| `@c:\Users\minen\OneDrive\Desktop\Veloraa2.0\veloraa\src\app\api\billing\paddle\portal\route.ts` | Opens Paddle customer portal. | **Keep.** |
| `@c:\Users\minen\OneDrive\Desktop\Veloraa2.0\veloraa\src\app\api\billing\payfast\checkout\route.ts` | Builds signed PayFast params. | **Same `company_name` bug; fix.** |
| `@c:\Users\minen\OneDrive\Desktop\Veloraa2.0\veloraa\src\app\api\billing\status\route.ts` | Returns subscription state JSON. | **Keep, expand to include invoice list.** |
| `@c:\Users\minen\OneDrive\Desktop\Veloraa2.0\veloraa\src\app\api\webhooks\paddle\route.ts` | Paddle webhook → DB update + audit. | **Harden** (idempotency, fail safely, fix plan-id mapping). |
| `@c:\Users\minen\OneDrive\Desktop\Veloraa2.0\veloraa\src\app\api\webhooks\payfast\route.ts` | PayFast ITN. | **Harden** (validate IP whitelist, idempotency on `pf_payment_id`). |
| `@c:\Users\minen\OneDrive\Desktop\Veloraa2.0\veloraa\src\proxy.ts` | Sets `v_currency` cookie from `x-vercel-ip-country`. | **Keep, extend** to also set `v_country` so checkout knows the provider before the user types anything. |
| `@c:\Users\minen\OneDrive\Desktop\Veloraa2.0\veloraa\billing_schema.sql` | Billing column migration. | **Extend** (invoice table, idempotency keys). |

### 1.2 Bugs surfaced during the audit (fix in‑flight)

1. `@c:\Users\minen\OneDrive\Desktop\Veloraa2.0\veloraa\src\app\api\billing\paddle\checkout\route.ts:28` and the PayFast equivalent select `company_name`, but the column is `legal_name`. Today the customer object lands at Paddle with `name: undefined`.
2. `@c:\Users\minen\OneDrive\Desktop\Veloraa2.0\veloraa\src\app\actions\job-posting.ts:116` reads `application.selected_plan` (the *desired* plan from onboarding) instead of `subscription_plan` (the *paid* plan). A user can pick "Scale" in onboarding and post unlimited jobs without paying.
3. `mapPaddlePlanName` in `@c:\Users\minen\OneDrive\Desktop\Veloraa2.0\veloraa\src\app\api\webhooks\paddle\route.ts:134` returns "scale" for **anything that's not growth** — including `undefined` price ids.
4. Webhook handlers do not de-dupe: a Paddle retry for the same `transaction.completed` will update the row twice and write duplicate `billing_events`.
5. `has_used_free_post` is in the schema but never set anywhere → the free-tier 1-job limit is enforced via `count(*)` instead.
6. Paddle webhook does not write `payment_currency`, only `subscription_plan` etc. Currency drifts from `selected_plan`'s implicit currency to whatever the webhook last wrote.

We fix all six during the rebuild. None block the new pricing or UI.

### 1.3 What's already solid

- **Geo cookie** in `@c:\Users\minen\OneDrive\Desktop\Veloraa2.0\veloraa\src\proxy.ts:25-36` — Vercel's `x-vercel-ip-country` is reliable and free. We just need to also persist the **country** (not just currency) so the checkout API can pick a provider.
- **RLS on `billing_events`** — admins read, no direct insert. Fine.
- **Resend wrapper** in `@c:\Users\minen\OneDrive\Desktop\Veloraa2.0\veloraa\src\lib\email\send.ts` — no-API-key fallback already logs; we just add new templates.
- **Provider routing component** (`<CheckoutButton paymentProvider={...}>`) — clean abstraction, just needs the new prices.

---

## 2. Pricing model — the new numbers

### 2.1 Public price points

| Plan | Currency | Monthly | Annual | Effective monthly (annual) | Annual saving |
| --- | --- | --- | --- | --- | --- |
| Free | — | $0 / R0 | $0 / R0 | — | — |
| **Growth** | **USD** | **$49** | **$490** | **$40.83** | **$98 (2 months free)** |
| Growth | ZAR | R799 | R7,990 | R665.83 | R1,598 |
| **Scale** | **USD** | **$119** | **$1,190** | **$99.17** | **$238 (2 months free)** |
| Scale | ZAR | R1,999 | R19,990 | R1,665.83 | R3,998 |

> The "2 months free" framing = `monthly × 10` for the annual price.
> Clean numbers, easy headline copy ("Save 2 months"), and PayFast/Paddle
> both accept any positive amount so we don't need to round to fit a
> processor's price list.

### 2.2 Source of truth — `@/lib/billing/plans.ts` shape

```ts
// canonical: only place these numbers ever live in code
export const BILLING_PLANS: PlanDefinition[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Try Veloraa with one job post",
    usd: { monthly: 0,   annual: 0,    monthlyEquivalent: 0,    savings: 0  },
    zar: { monthly: 0,   annual: 0,    monthlyEquivalent: 0,    savings: 0  },
    badge: null,
    /* features + limits unchanged */
  },
  {
    id: "growth",
    name: "Growth",
    tagline: "For actively hiring teams",
    badge: "Most Popular",
    usd: { monthly: 49,  annual: 490,  monthlyEquivalent: 41,   savings: 98   },
    zar: { monthly: 799, annual: 7990, monthlyEquivalent: 666,  savings: 1598 },
    /* same feature list as today */
  },
  {
    id: "scale",
    name: "Scale",
    tagline: "For high-volume hiring & teams",
    badge: "Best Value",
    usd: { monthly: 119,  annual: 1190,  monthlyEquivalent: 99,    savings: 238   },
    zar: { monthly: 1999, annual: 19990, monthlyEquivalent: 1666,  savings: 3998  },
    /* same feature list as today */
  },
];
```

### 2.3 PayFast plan registry — `@/lib/billing/payfast-plans.ts`

PayFast's `frequency` is an integer code: `3` = monthly, `6` = annual.
We rewrite the four entries to the new amounts:

```ts
export const PAYFAST_PLANS = {
  growth_monthly: { name: "Veloraa Growth — Monthly",  amount: "799.00",   frequency: 3, cycles: 0, subscription_type: 1 },
  growth_annual:  { name: "Veloraa Growth — Annual",   amount: "7990.00",  frequency: 6, cycles: 0, subscription_type: 1 },
  scale_monthly:  { name: "Veloraa Scale — Monthly",   amount: "1999.00",  frequency: 3, cycles: 0, subscription_type: 1 },
  scale_annual:   { name: "Veloraa Scale — Annual",    amount: "19990.00", frequency: 6, cycles: 0, subscription_type: 1 },
} as const;
```

### 2.4 Paddle prices

Paddle prices live in **the Paddle dashboard**, not in our code. We
create four new price objects (Growth Monthly $49 / Growth Annual $490
/ Scale Monthly $119 / Scale Annual $1,190) and reference them via env:

```dotenv
# .env.local (sandbox values during dev)
PADDLE_PRICE_GROWTH_MONTHLY=pri_01abc...
PADDLE_PRICE_GROWTH_ANNUAL=pri_01def...
PADDLE_PRICE_SCALE_MONTHLY=pri_01ghi...
PADDLE_PRICE_SCALE_ANNUAL=pri_01jkl...
```

We **leave the old Paddle prices alone** so existing test subscriptions
keep working, then archive them after migration.

---

## 3. Geo-detection — silent, no UI toggle

### 3.1 What runs today

`@c:\Users\minen\OneDrive\Desktop\Veloraa2.0\veloraa\src\proxy.ts:25-36`
already reads `x-vercel-ip-country` and writes a `v_currency` cookie.
That cookie is consumed by
`@c:\Users\minen\OneDrive\Desktop\Veloraa2.0\veloraa\src\app\(marketing)\pricing\page.tsx:14`
to seed the pricing page in the right currency.

### 3.2 What we add

We extend the proxy to also set `v_country` and bump TTL to 90 days.
Two cookies because country is also used by the in-app checkout API to
pick the provider before the user has saved a profile:

```ts
// src/proxy.ts (additions)
if (!request.cookies.has("v_currency") || !request.cookies.has("v_country")) {
  const country = (request.headers.get("x-vercel-ip-country") ?? "").toUpperCase();
  const currency = country === "ZA" ? "ZAR" : "USD";

  const opts = { path: "/", maxAge: 60 * 60 * 24 * 90, sameSite: "lax" as const };
  response.cookies.set("v_currency", currency, opts);
  response.cookies.set("v_country", country || "US", opts);
}
```

### 3.3 Resolution chain

When picking provider + currency for a checkout, we use this priority:

1. **`company_applications.hq_country`** — the truth once the wizard
   is filled.
2. **`v_country` cookie** — present from first request.
3. **`x-vercel-ip-country` header** — fallback if cookie was nuked.
4. Hard default: `"US"` → Paddle / USD.

A small helper centralises this:

```ts
// src/lib/billing/locale.ts (NEW)
import { cookies, headers } from "next/headers";

export type ResolvedLocale = {
  country: string;          // ISO-3166 alpha-2
  currency: "USD" | "ZAR";
  provider: "paddle" | "payfast";
};

export async function resolveLocale(profileCountry?: string | null): Promise<ResolvedLocale> {
  const c = (profileCountry ?? "").toUpperCase();
  if (c === "ZA" || c === "SOUTH AFRICA") {
    return { country: "ZA", currency: "ZAR", provider: "payfast" };
  }
  if (c) return { country: c, currency: "USD", provider: "paddle" };

  const cs = await cookies();
  const cookieCountry = cs.get("v_country")?.value?.toUpperCase();
  if (cookieCountry === "ZA") return { country: "ZA", currency: "ZAR", provider: "payfast" };
  if (cookieCountry)          return { country: cookieCountry, currency: "USD", provider: "paddle" };

  const h = await headers();
  const ipCountry = h.get("x-vercel-ip-country")?.toUpperCase();
  if (ipCountry === "ZA") return { country: "ZA", currency: "ZAR", provider: "payfast" };
  return { country: ipCountry || "US", currency: "USD", provider: "paddle" };
}
```

### 3.4 What this **does not** do

- **No browser fingerprinting / VPN detection.** A South African user
  on a US VPN will see USD until they sign up and pick `hq_country = ZA`,
  at which point provider flips to PayFast for them and `selected_plan`
  gets re-shown in ZAR. This is desirable: it kills toggle abuse without
  punishing real users.
- **No language toggle.** ZA users still see English. The currency is
  the only locale signal that changes.

### 3.5 Edge cases

| Scenario | Behavior |
| --- | --- |
| User in ZA on Vercel preview (no IP header). | Cookie missing → falls through to `US/USD/paddle`. The `hq_country` they pick during onboarding overrides on next paint. |
| User in ZA but pays via Paddle (corporate USD card). | `hq_country` = `ZA` forces PayFast. We add an admin-only override flag (`force_provider`) in `company_applications` for the rare exception. |
| User in EU (GDPR-relevant). | The cookie is `sameSite=lax`, no PII, technically necessary for pricing display. We add a one-line note in the cookie banner. Paddle handles VAT itself. |
| User on `/pricing` while signed in, profile says `hq_country = US`. | `resolveLocale(profileCountry)` is the entry point; cookie is ignored once authenticated. |

---

## 4. Database schema deltas

A second migration on top of `billing_schema.sql`:

```sql
-- supabase/billing_v2.sql

-- 1. Persist currency on every webhook update (we never want it to drift).
alter table public.company_applications
  add column if not exists subscription_currency text
    check (subscription_currency in ('USD', 'ZAR'));

-- 2. Stable de-dupe key for both providers.
alter table public.billing_events
  add column if not exists provider_event_id text;
create unique index if not exists billing_events_provider_event_uk
  on public.billing_events (provider, provider_event_id)
  where provider_event_id is not null;

-- 3. First-class invoice/receipt table — provider-agnostic.
create table if not exists public.invoices (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  provider        text not null check (provider in ('paddle', 'payfast')),
  provider_ref    text not null,                    -- Paddle transaction.id / PayFast pf_payment_id
  number          text,                              -- human-readable, e.g. VLR-2026-000123
  status          text not null default 'paid'
                  check (status in ('paid', 'refunded', 'void')),
  amount_cents    bigint not null,                   -- always store the smallest unit
  currency        text not null check (currency in ('USD', 'ZAR')),
  plan_id         text not null check (plan_id in ('growth', 'scale')),
  interval        text not null check (interval in ('monthly', 'annual')),
  period_start    timestamptz,
  period_end      timestamptz,
  pdf_url         text,                              -- signed Storage URL or null
  emitted_at      timestamptz not null default now()
);

create unique index if not exists invoices_provider_ref_uk
  on public.invoices (provider, provider_ref);
create index if not exists invoices_user_idx on public.invoices (user_id, emitted_at desc);

alter table public.invoices enable row level security;

drop policy if exists "invoices_select_own" on public.invoices;
create policy "invoices_select_own"
  on public.invoices for select to authenticated
  using ( user_id = auth.uid() or public.is_admin(auth.uid()) );

-- 4. Storage bucket for PDF receipts.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('receipts', 'receipts', false, 5242880, array['application/pdf'])
on conflict (id) do nothing;

drop policy if exists "receipts_owner_select" on storage.objects;
create policy "receipts_owner_select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 5. Drop the legacy `payment_currency` column? NO — keep for back-compat
--    until we're sure no read site references it. We just sync it from
--    `subscription_currency` in the webhook to be safe.
```

`subscription_currency` becomes the canonical "what currency is this
subscription billed in" column; `payment_currency` (already present)
stays as a mirror for the existing reads.

---

## 5. Webhook hardening

The existing handlers do roughly the right thing — we just bolt on
**idempotency** and fix the column-name bug.

### 5.1 Pattern (Paddle)

```ts
// src/app/api/webhooks/paddle/route.ts (sketch)
const eventId = (event as { eventId?: string }).eventId ?? null;

// Idempotent insert — if we've seen this event id before, exit early.
if (eventId) {
  const { error: dup } = await supabase
    .from("billing_events")
    .insert({
      employer_id: employer.user_id,
      provider: "paddle",
      provider_event_id: eventId,
      event_type: event.eventType,
      event_data: subscriptionData,
    });
  if (dup?.code === "23505") return NextResponse.json({ received: true, deduped: true });
}

// ... existing switch-on-eventType logic, but every UPDATE also
// writes subscription_currency from the price's currency field ...
```

### 5.2 Pattern (PayFast)

PayFast doesn't send a globally unique event id, but `pf_payment_id`
is unique per transaction. Use that.

```ts
const providerRef = params.pf_payment_id ?? params.m_payment_id;
// same idempotent insert keyed on provider="payfast", provider_event_id=providerRef
```

### 5.3 On `transaction.completed` / PayFast `COMPLETE` — emit invoice

Both branches now also do:

```ts
await supabase.from("invoices").insert({
  user_id: employer.user_id,
  provider: "paddle",                         // or "payfast"
  provider_ref: transactionId,                // unique
  number: await nextInvoiceNumber(),          // VLR-YYYY-000NNN, monotonic
  amount_cents: amountInCents,
  currency: priceCurrency,                    // "USD" | "ZAR"
  plan_id: planId,
  interval,
  period_start, period_end,
  status: "paid",
});

// Background: render PDF + upload to `receipts/<userId>/<invoiceId>.pdf`,
// then update invoices.pdf_url. Sender email is fired right after.
await renderAndStoreReceipt(invoiceId);
await sendEmail(receiptEmail({ ... }));
```

The render-and-upload step is intentionally async-fire-and-forget so a
slow PDF library never blocks webhook ack (Paddle / PayFast both
penalise slow handlers).

---

## 6. Receipts — email + PDF

### 6.1 Email template

Add to `@c:\Users\minen\OneDrive\Desktop\Veloraa2.0\veloraa\src\lib\email\templates.ts`:

```ts
export function paymentReceiptEmail(args: {
  companyName: string;
  invoiceNumber: string;
  planName: string;
  interval: "monthly" | "annual";
  amountFormatted: string;     // "$49.00" or "R799.00"
  periodStart: string;         // "01 May 2026"
  periodEnd: string;           // "31 May 2026"
  pdfUrl: string;              // signed storage URL, 7-day expiry
  manageHref: string;
}) {
  return baseTemplate({
    subject: `Receipt for ${args.planName} — ${args.invoiceNumber}`,
    intro: `Thanks for renewing Veloraa ${args.planName}.`,
    body: `<p>Your ${args.interval} subscription for <strong>${args.companyName}</strong> renewed successfully.</p>
           <p>Invoice <strong>${args.invoiceNumber}</strong> · ${args.amountFormatted} · ${args.periodStart} – ${args.periodEnd}</p>
           <p><a href="${args.pdfUrl}">Download PDF receipt</a></p>`,
    ctaHref: args.manageHref,
    ctaLabel: "Manage subscription",
  });
}
```

A matching `paymentFailedEmail` and `subscriptionCancelledEmail` round
out the set.

### 6.2 PDF rendering

Two viable approaches:

**Option A — `@react-pdf/renderer` (recommended).** Pure JS, runs on
the server, deterministic layout, ~120 KB. We already have a React
codebase so a `<ReceiptDocument invoice={...} />` component is the
fastest path. Render on demand inside the webhook background task and
upload to the `receipts` Storage bucket.

```tsx
// src/lib/billing/receipt-pdf.tsx (NEW, server-only)
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";

export async function renderReceiptPdf(invoice: InvoiceRow): Promise<Uint8Array> {
  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Veloraa</Text>
        <Text>Invoice {invoice.number}</Text>
        {/* … company + line items + totals … */}
      </Page>
    </Document>
  );
  const stream = await pdf(doc).toBuffer();
  return new Uint8Array(stream);
}
```

**Option B — Provider-rendered receipts.** Both Paddle and PayFast send
their own PDFs and host customer portals. We could just deep-link to
those. Cheaper to ship, but the branding is theirs and the URLs expire.
Use this **as a fallback** if the React-PDF render fails.

Both options coexist: we always upload our own PDF when render succeeds,
and if it ever fails we fall back to Paddle's `transaction.invoice.url`
or PayFast's email receipt link.

### 6.3 Download endpoint

```ts
// src/app/api/billing/receipts/[id]/route.ts  (NEW)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: invoice } = await supabase
    .from("invoices")
    .select("user_id, pdf_url, number")
    .eq("id", params.id)
    .single();
  // RLS already guarantees ownership; we just need a freshly-signed URL.
  const admin = createAdminClient();
  const { data } = await admin.storage
    .from("receipts")
    .createSignedUrl(`${invoice.user_id}/${params.id}.pdf`, 60 * 5);
  return NextResponse.redirect(data!.signedUrl);
}
```

The dashboard table renders `<a href={`/api/billing/receipts/${invoice.id}`} download>`.

---

## 7. Marketing pricing page redesign

`@c:\Users\minen\OneDrive\Desktop\Veloraa2.0\veloraa\src\components\marketing\Pricing.tsx`
gets rebuilt. Same file path, new UI. The page route
(`@c:\Users\minen\OneDrive\Desktop\Veloraa2.0\veloraa\src\app\(marketing)\pricing\page.tsx`)
stays — it just hands `defaultCurrency` from the cookie.

### 7.1 What goes away

- The **`<CurrencyToggle>`** component is deleted. The cookie sets the
  currency and the user never sees the choice.
- The "USD ↔ ZAR" hint under each card disappears for ZAR viewers
  (they never need to think about USD).
- The "USD subscribers pay via Paddle, ZA via PayFast" FAQ entry stays
  but is reworded around the silent detection.

### 7.2 What stays / improves

| Element | Change |
| --- | --- |
| Hero | New headline copy: "Transparent pricing for hiring the top 1%". Keep the green-glow background. |
| `<BillingToggle>` Monthly ↔ Annual | **Stays.** Highlight "Save 2 months" pill when annual is selected. |
| **Three pricing cards** | New layout. Free ⌜ Growth (featured, glow border) ⌝ Scale. Cards are **sticky-aligned** at the same height regardless of feature list length. |
| Price element | Currency symbol + big number + `/mo`. Below: "Billed annually (R7,990/yr)" if annual; else 1-line subtitle. **No** ZAR-equivalent footnote anymore. |
| Feature list | Single column, 6–8 items max, "Everything in Growth, plus" pattern preserved. |
| Comparison table | Stays, gets sticky header, a "Most popular" column highlight, and a "Annual price" row that updates with the toggle. |
| FAQ | Keep, swap the "What payment methods" answer to: "We accept the major cards, Apple/Google Pay, and PayPal worldwide via Paddle. South African subscribers pay in ZAR via PayFast (card, EFT, instant EFT)." |
| Final CTA | Two buttons stay; copy refresh. |

### 7.3 Component sketch

```tsx
// src/components/marketing/Pricing.tsx (rewritten shell)
export default function Pricing({
  defaultCurrency,
}: {
  defaultCurrency: "USD" | "ZAR";
}) {
  const [interval, setInterval] = useState<"monthly" | "annual">("monthly");
  // currency is locked from cookie — no setter
  const currency = defaultCurrency;

  return (
    <PricingShell>
      <PricingHero interval={interval} onInterval={setInterval} />
      <PricingCards interval={interval} currency={currency} />
      <PricingComparison interval={interval} currency={currency} />
      <PricingFAQ />
      <PricingCTA />
    </PricingShell>
  );
}
```

### 7.4 Card visual spec (high level)

```
┌────────────────────────────────┐
│ [icon] Growth        ✦ Most ✦ │   ← gradient ring + badge
│ For actively hiring teams      │
│                                │
│ R 799 / mo                     │   ← currency from cookie
│ Billed monthly · or save 2     │
│ months on annual                │
│                                │
│ ┌────────────────────────────┐ │
│ │ Get Growth →               │ │
│ └────────────────────────────┘ │
│                                │
│ ✓ Unlimited job posts          │
│ ✓ Full talent search           │
│ ✓ Pipeline + interview tools   │
│ ✓ Watchlist (50 profiles)      │
│ ✓ Hiring analytics             │
│ ✓ 1 team seat                  │
│ ✓ Email support (48 hr)        │
└────────────────────────────────┘
```

### 7.5 Mobile

Cards stack vertically; the comparison table becomes a sideways-scroll
container (`overflow-x: auto`) rather than collapsing rows. Bottom CTA
becomes sticky for the last viewport so the "Start hiring" call is
always one tap away.

---

## 8. Company subscription dashboard redesign

`@c:\Users\minen\OneDrive\Desktop\Veloraa2.0\veloraa\src\app\(app)\company\(shell)\subscription\page.tsx`

### 8.1 Structure

Two zones, side-by-side on desktop, stacked on mobile:

```
/company/subscription
├── Hero strip
│   "Plan & Billing — manage subscription, invoices, and payment method."
│
├── 1) Current plan card (left, ~60% width on desktop)
│   ┌────────────────────────────────────────┐
│   │ ✦ Growth · Active                      │
│   │ R 799 / mo · Renews 12 Jun 2026        │
│   │                                        │
│   │ [Manage subscription]  [Switch plan ↓] │
│   │                                        │
│   │ Quota          | Used / limit          │
│   │ Job posts      | Unlimited             │
│   │ Watchlist      | 23 / 50               │
│   │ Team seats     | 1 / 1                 │
│   └────────────────────────────────────────┘
│
├── 2) Plan picker (right, ~40% width)
│   Compact cards stacked vertically:
│   ▸ Growth (current — disabled)
│   ▸ Scale  (R 1,999/mo — Upgrade →)
│   ▸ Free   (downgrade — confirm modal)
│
├── 3) Invoices table (full width below)
│   | Date       | Number          | Plan   | Amount    | PDF |
│   | 12 May 26  | VLR-2026-000123 | Growth | R 799.00  | ↓   |
│   | 12 Apr 26  | VLR-2026-000091 | Growth | R 799.00  | ↓   |
│
└── 4) Payment method strip
    "Managed by PayFast · Use Manage subscription to update card."
```

### 8.2 Status pill

Reuses the existing colour map but adds two new states:

| `subscription_status` | UI label | Tone |
| --- | --- | --- |
| `free` | Free plan | subtle |
| `active` | Active | accent green |
| `past_due` | Payment failed — retrying | red |
| `paused` | Paused | amber |
| `cancelled` | Cancels on `period_end` | amber outline |
| `pending` *(new)* | Awaiting first payment | amber |

`pending` is set the moment we kick off a checkout and replaced by
the webhook on success. It guards the dashboard from showing "Free"
during the awkward gap.

### 8.3 Switch-plan flow

Server action `changePlan(planId, interval)`:

1. Resolve provider via `resolveLocale(application.hq_country)`.
2. **Paddle** — call `paddle.subscriptions.update(currentSubId, { items: [{ priceId, quantity: 1 }], prorationBillingMode: "prorated_immediately" })`. UI gets the new period_end via webhook.
3. **PayFast** — PayFast subscription updates require **token cancellation** of the old subscription and a fresh checkout (PayFast's recurring-billing API doesn't support mid-cycle plan change). UI shows a one-screen "We'll cancel your current plan and start the new one" confirmation, then redirects to PayFast.

### 8.4 Cancel & resume

- **Cancel** → `paddle.subscriptions.cancel(subId, { effectiveFrom: "next_billing_period" })` or PayFast token cancel API. UI flips to `cancelled` immediately, keeps full access until `period_end`.
- **Resume** (only Paddle supports it natively) → `paddle.subscriptions.resume(subId)`.

### 8.5 Invoice download

The table reads `public.invoices` filtered to the current user. Each
row's PDF link points at the signed-URL endpoint described in §6.3.

---

## 9. Onboarding wizard simplification

Today, step 6 of `@c:\Users\minen\OneDrive\Desktop\Veloraa2.0\veloraa\src\components\company\CompanyWizard.tsx`
forces the user to pick a plan **before** admin approves the company.
That value lands in `selected_plan` and then leaks into job-posting
quota checks (the bug from §1.2).

### 9.1 New flow

1. Onboarding wizard **drops the "pick a plan" step entirely.** The
   user submits → admin reviews → on approval the company starts on
   `subscription_plan = "free"`, `subscription_status = "free"`,
   `subscription_currency` = whatever `resolveLocale(hq_country)`
   returns.
2. The first time they need a paid feature (post a 2nd job, browse
   full talent pool, open the watchlist) we render a `<FeatureLock>`
   overlay and link them to `/company/subscription` to upgrade.
3. The dashboard side-rail keeps a small "Free plan — upgrade" pill.

Result: faster onboarding, no fake commitment, single source of plan
truth (`subscription_plan`), and the existing job-posting quota
instantly behaves correctly.

### 9.2 Migration of existing rows

```sql
-- One-time backfill: anyone whose subscription is still "free" but
-- whose `selected_plan` was "growth" / "scale" gets it cleared so
-- they are not silently upgraded.
update public.company_applications
   set selected_plan = 'free'
 where subscription_status = 'free'
   and selected_plan in ('growth', 'scale');
```

`selected_plan` ultimately becomes deprecated (kept for back-compat
reads) and the new `getEffectivePlan()` always prefers
`subscription_plan` once `subscription_status in ('active','past_due','paused','cancelled')`.

---

## 10. Platform-wide feature gating (Spotify / YouTube model)

### 10.1 Single resolver

Move the rule from `@c:\Users\minen\OneDrive\Desktop\Veloraa2.0\veloraa\src\lib\company\candidate-access.ts:20`
into `@/lib/billing/plans.ts` so every layer agrees:

```ts
// src/lib/billing/plans.ts (additions)
export type EffectivePlan = {
  id: PlanId;
  status: "free" | "active" | "past_due" | "paused" | "cancelled" | "pending";
  fromBilling: boolean;   // true if backed by an active paid subscription
};

export function getEffectivePlan(app: CompanyApplication | null): EffectivePlan {
  const status = (app?.subscription_status ?? "free") as EffectivePlan["status"];
  const planFromBilling = app?.subscription_plan as PlanId | undefined;

  if (status === "active" || status === "past_due") {
    return { id: planFromBilling ?? "free", status, fromBilling: true };
  }
  if (status === "cancelled") {
    // keep paid access until period_end, then drop to free
    const periodEnded = app?.current_period_end && new Date(app.current_period_end) < new Date();
    return periodEnded
      ? { id: "free", status: "free", fromBilling: false }
      : { id: planFromBilling ?? "free", status: "cancelled", fromBilling: true };
  }
  return { id: "free", status: "free", fromBilling: false };
}
```

### 10.2 Server gate everywhere paid features live

```ts
// src/lib/billing/gate.ts (rewrite)
export async function assertFeature(feature: Feature) {
  const ok = await canAccess(feature);
  if (!ok) redirect("/company/subscription?upgrade=" + feature);
}
```

Adopted at the top of every protected page / action:

| Path | Gates |
| --- | --- |
| `@c:\Users\minen\OneDrive\Desktop\Veloraa2.0\veloraa\src\app\(app)\company\(shell)\candidates\page.tsx` | `assertFeature("talent_search")` (with downgrade-to-preview already in place) |
| `@c:\Users\minen\OneDrive\Desktop\Veloraa2.0\veloraa\src\app\(app)\company\(shell)\jobs\new\page.tsx` | `assertFeature("post_job")` |
| `@c:\Users\minen\OneDrive\Desktop\Veloraa2.0\veloraa\src\app\actions\job-posting.ts` | `await assertFeature("post_job")` (replacing the `selected_plan` read) |
| `/company/pipeline` (when added) | `assertFeature("pipeline")` |
| `/company/analytics` | `assertFeature("analytics")` |
| `/company/team` | `assertFeature("team_seats")` |

### 10.3 Client `<FeatureLock>` overlay (Spotify-style)

A reusable client component for "feature visible but locked":

```tsx
// src/components/billing/FeatureLock.tsx (NEW)
export function FeatureLock({
  feature,
  plan,
  children,
}: {
  feature: Feature;
  plan: PlanId;        // "growth" or "scale" — the minimum required
  children: ReactNode; // the blurred-behind UI
}) {
  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-[4px] grayscale-[40%]">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-page/70 backdrop-blur-sm">
        <div className="rounded-2xl border border-edge bg-surface p-6 shadow-lg max-w-sm text-center">
          <Sparkles className="mx-auto mb-3 h-6 w-6 text-accent" />
          <h3 className="text-base font-semibold text-heading font-raleway">
            Available on the {plan === "growth" ? "Growth" : "Scale"} plan
          </h3>
          <p className="mt-2 text-sm text-body">
            Unlock {labelFor(feature)} and the rest of the {plan} toolkit.
          </p>
          <Link
            href={`/company/subscription?upgrade=${plan}`}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white"
          >
            Upgrade <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
```

Used like:

```tsx
{await canAccess("pipeline")
  ? <PipelineBoard jobs={jobs} />
  : <FeatureLock feature="pipeline" plan="growth"><PipelineBoardPreview /></FeatureLock>}
```

This is the **Spotify Free / YouTube Premium** UX: the user can see
exactly what they're missing and upgrade in one tap.

### 10.4 Quotas (`watchlist`, `talent_alerts`, `team_seats`)

Add a small `quotas.ts`:

```ts
export const QUOTAS: Record<PlanId, { watchlist: number; talentAlerts: number; teamSeats: number }> = {
  free:   { watchlist: 0,   talentAlerts: 0, teamSeats: 1 },
  growth: { watchlist: 50,  talentAlerts: 3, teamSeats: 1 },
  scale:  { watchlist: Infinity, talentAlerts: Infinity, teamSeats: 5 },
};
```

The `<WatchlistAddButton>` calls a server action that does
`if ((countNow + 1) > QUOTAS[plan].watchlist) return upsell("watchlist")`.

### 10.5 Realtime tie-in

Per the parallel `REALTIME_PLAN.md` (Phase 2c), the company subscription
page already plans a `<LiveSubscriptionStatus>` wrapper. We extend it
to also push **upgrade-completed** events into a small toast:

> "Welcome to Growth — you can now post unlimited jobs and access full
> candidate profiles."

This makes the post-Paddle-redirect feel instant even before the
billing webhook lands.

---

## 11. File-by-file change list (preview, not yet built)

| File | Verb | Notes |
| --- | --- | --- |
| `supabase/billing_v2.sql` | **NEW** | §4 migration. |
| `src/lib/billing/plans.ts` | **EDIT** | New prices; add `getEffectivePlan`. |
| `src/lib/billing/payfast-plans.ts` | **EDIT** | New ZAR amounts. |
| `src/lib/billing/locale.ts` | **NEW** | `resolveLocale()` central helper. |
| `src/lib/billing/quotas.ts` | **NEW** | Quota table + helpers. |
| `src/lib/billing/gate.ts` | **EDIT** | Add `assertFeature`; consume `getEffectivePlan`. |
| `src/lib/billing/receipt-pdf.tsx` | **NEW** | React-PDF receipt component. |
| `src/lib/email/templates.ts` | **EDIT** | Add `paymentReceiptEmail`, `paymentFailedEmail`, `subscriptionCancelledEmail`, `subscriptionUpgradedEmail`. |
| `src/proxy.ts` | **EDIT** | Also persist `v_country`. |
| `src/components/marketing/Pricing.tsx` | **REWRITE** | New visual spec, no currency toggle. |
| `src/app/(marketing)/pricing/page.tsx` | **EDIT** | Pass through `v_currency`, `v_country`. |
| `src/app/(app)/company/(shell)/subscription/page.tsx` | **REWRITE** | Two-zone layout + invoices table. |
| `src/components/billing/SubscriptionActions.tsx` | **REFACTOR** | Replaced by inline buttons in the new dashboard. |
| `src/components/billing/FeatureLock.tsx` | **NEW** | Spotify-style upsell overlay. |
| `src/components/company/CompanyWizard.tsx` | **EDIT** | Drop step 6 (plan picker). Cleanup `selected_plan` references. |
| `src/lib/company/options.ts` | **EDIT** | Delete legacy `PLANS` export. |
| `src/lib/company/candidate-access.ts` | **EDIT** | `getEffectiveCompanyPlanId` re-exports `getEffectivePlan`. |
| `src/app/api/billing/paddle/checkout/route.ts` | **EDIT** | Use `legal_name`; tag the customer with `country` metadata. |
| `src/app/api/billing/payfast/checkout/route.ts` | **EDIT** | Same. |
| `src/app/api/billing/status/route.ts` | **EDIT** | Include invoices list. |
| `src/app/api/billing/receipts/[id]/route.ts` | **NEW** | Signed-URL redirect. |
| `src/app/api/webhooks/paddle/route.ts` | **EDIT** | Idempotency, currency, invoice insert, fix `mapPaddlePlanName`. |
| `src/app/api/webhooks/payfast/route.ts` | **EDIT** | Idempotency on `pf_payment_id`, IP allowlist check, invoice insert. |
| `src/app/actions/job-posting.ts` | **EDIT** | Replace `selected_plan` read with `assertFeature("post_job")`. |

Total: **~7 new files, 14 edits, 2 rewrites.** Concentrated in
`@/lib/billing/`, `@/components/billing/`, and the two
subscription/pricing pages — which is exactly where this kind of
revamp belongs.

---

## 12. Migration & rollout plan

### Phase 0 — prep (does not ship to users)

1. Create the four new Paddle prices in the Paddle sandbox
   ($49 / $490 / $119 / $1,190).
2. Update PayFast sandbox plan amounts.
3. Run `billing_v2.sql` against the dev Supabase project.
4. Test webhooks end-to-end against sandbox: signup → checkout →
   webhook fires → invoice row + PDF + email.

### Phase 1 — backend swap (no UI changes yet)

5. Ship the schema migration to prod.
6. Deploy webhook hardening (idempotency, invoice emit). Old prices
   still flow through the old pipeline; new invoice rows start
   accumulating.
7. Backfill `subscription_currency` from `payment_currency` for all
   existing rows.

### Phase 2 — pricing & gating

8. Cut over `BILLING_PLANS` to the new numbers.
9. Cut over `payfast-plans.ts` to new amounts.
10. Update env vars to point at the new Paddle price IDs.
11. Adopt `assertFeature` across protected pages and server actions.
12. Drop the onboarding plan-picker step.

### Phase 3 — UI revamp

13. Ship the new marketing `/pricing` page.
14. Ship the new `/company/subscription` dashboard.
15. Ship `<FeatureLock>` and adopt it on candidates / pipeline /
    analytics surfaces.

### Phase 4 — receipts polish

16. Wire `@react-pdf/renderer` into the webhook flow.
17. Send the first real `paymentReceiptEmail`. Verify the PDF
    render + signed URL on a real invoice.

### Phase 5 — cleanup

18. Archive the old Paddle prices in the dashboard.
19. Delete legacy `PLANS` export and `selected_plan` reads.
20. Roll the cookie expiry from 30 → 90 days.

Each phase is independently revertable; nothing in Phase 1 changes the
user-visible experience, so we can soak it in prod for a day before
flipping the pricing.

---

## 13. Testing matrix

| Path | Country (header) | Profile country | Expected | Tests |
| --- | --- | --- | --- | --- |
| `/pricing` (anon) | `ZA` | — | ZAR cards, R799 / R1,999 | unit + visual |
| `/pricing` (anon) | `US` | — | USD cards, $49 / $119 | unit + visual |
| `/pricing` (anon) | `CN` | — | USD cards | unit |
| `/company/subscription` | `US` | `ZA` | ZAR cards, PayFast checkout | e2e |
| `/company/subscription` | `ZA` | `US` | USD cards, Paddle checkout | e2e |
| Paddle webhook duplicate `transaction.completed` | — | — | One invoice row, one email | webhook replay |
| PayFast ITN duplicate | — | — | Same | webhook replay |
| PDF render failure | — | — | Email goes out with provider-hosted fallback URL; user can still get a receipt | unit |
| Plan downgrade (Scale → Free) | — | — | Status `cancelled`, full access until `period_end`, then auto-flip to `free` | scheduled-job test |

---

## 14. Risks & open questions

| Risk | Mitigation |
| --- | --- |
| Paddle's price-update API caches old prices on existing subs. | Update prices on **new** subscriptions only; existing customers grandfather their old price for one billing cycle and we then prompt them to "switch to the new lower plan" via the dashboard. |
| PayFast doesn't support mid-cycle plan changes. | Documented in §8.3 — UI flow is "cancel current, start new". Acceptable trade-off for SA volume. |
| `@react-pdf/renderer` can OOM on huge invoices. | We render once per webhook event with a single line item — capped well below 1 MB. Bench-tested before phase 4. |
| User's country derived from VPN. | Real users: solved by `hq_country` on profile. Bad actors: PayFast / Paddle both run their own fraud screens, so a USD-paying ZA user via VPN doesn't materially hurt us. |
| GDPR / cookie banner. | `v_currency` + `v_country` both qualify as "necessary for the service" (currency display). One-line addition to the existing cookie note. |
| Existing `selected_plan` reads. | Ripped out in phase 2 step 11 with a final grep audit — not removed from schema until phase 5. |
| Webhook ordering (Paddle sends `transaction.completed` before `subscription.activated` sometimes). | Idempotent rows mean either order produces the same final state. Handlers no longer assume order. |

### Open questions for you (don't block the build)

1. **Confirm Scale price**: $119 or $120? I've planned around **$119**
   because $119 × 10 = $1,190 (clean annual headline) and pairs with
   R1,999 visually. Easy to flip to $120 if you'd prefer the round
   number.
2. **Free plan retention**: keep "1 job ever" or move to "1 active job
   at a time" (refreshes when filled)? Today's quota is `count(*)
   excluding rejected` which behaves like the latter.
3. **Annual upsell strength**: do you want a one-time popup on the
   subscription page after 30 days on Monthly that offers
   "Save 2 months — switch to annual"?
4. **VAT / Tax**: Paddle is a Merchant of Record (handles VAT /
   sales-tax automatically). PayFast is not — should ZAR prices be
   VAT-inclusive (R799 incl. VAT) or VAT-exclusive (R799 + 15%)? The
   plan currently assumes **inclusive** to match SA SMB expectations.
5. **Multi-seat (Scale plan)**: the schema supports `team_seats: 5`
   but there's no actual invite flow yet. In scope of this revamp or
   a follow-up?
6. **Receipt invoice numbering**: monotonic global (`VLR-2026-000123`)
   or per-customer? I'd go global for simpler audits.

---

## 15. Effort estimate

- **Phase 0 (prep)**: 2 hours.
- **Phase 1 (schema + webhook hardening)**: 4 hours.
- **Phase 2 (pricing + gates)**: 4 hours.
- **Phase 3 (UI revamp — pricing page + dashboard + FeatureLock)**: 6–8 hours, mostly visual.
- **Phase 4 (receipts)**: 3 hours.
- **Phase 5 (cleanup)**: 1 hour.

≈ **2.5 working days** for the full revamp end-to-end, with each phase
shippable on its own. Pricing change is **landed by end of phase 2**;
visual revamp is the back half.

---

*Authored by Cascade. Companion to `REALTIME_PLAN.md` — both can be
implemented independently.*
