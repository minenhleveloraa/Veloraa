import { NextRequest, NextResponse } from "next/server";
import { paddle } from "@/lib/billing/paddle";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordInvoice } from "@/lib/billing/invoices";
import type { Currency } from "@/lib/billing/plans";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("paddle-signature");
  const rawBody = await req.text();

  let event;
  try {
    event = await paddle.webhooks.unmarshal(
      rawBody,
      process.env.PADDLE_WEBHOOK_SECRET!,
      signature!
    );
  } catch (err) {
    console.error("Paddle webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const eventType = event.eventType as string;
  const eventId = (event as { eventId?: string }).eventId ?? null;

  const subscriptionData = event.data as unknown as Record<string, unknown>;
  const customerId = subscriptionData?.customerId as string | undefined;
  const subscriptionId = subscriptionData?.id as string | undefined;

  const { data: employer } = await supabase
    .from("company_applications")
    .select("user_id, subscription_currency")
    .eq("paddle_customer_id", customerId)
    .single();

  if (!employer) {
    console.error(
      "Paddle webhook: no employer found for customer",
      customerId
    );
    return NextResponse.json({ received: true });
  }

  // ── Idempotency ─────────────────────────────────────────────────────
  // Insert the event row first; if the unique (provider, provider_event_id)
  // constraint fires, we know we've seen this event and exit early.
  if (eventId) {
    const { error: insertErr } = await supabase
      .from("billing_events")
      .insert({
        employer_id: employer.user_id,
        provider: "paddle",
        provider_event_id: eventId,
        event_type: eventType,
        event_data: subscriptionData,
      });
    if (insertErr?.code === "23505") {
      return NextResponse.json({ received: true, deduped: true });
    }
    if (insertErr) {
      console.error("[paddle webhook] event insert failed:", insertErr);
    }
  } else {
    // No event id (older Paddle versions) — log without dedup.
    await supabase.from("billing_events").insert({
      employer_id: employer.user_id,
      provider: "paddle",
      event_type: eventType,
      event_data: subscriptionData,
    });
  }

  const items = (subscriptionData as Record<string, unknown>).items as
    | Array<{
        price?: { id?: string };
        priceId?: string;
        recurring_price_id?: string;
      }>
    | undefined;
  const priceId = items?.[0]?.price?.id ?? items?.[0]?.priceId;
  const planFromPrice = mapPaddlePlanName(priceId);

  const billingCycle = (subscriptionData as Record<string, unknown>)
    .billingCycle as { interval?: string } | undefined;
  const interval: "monthly" | "annual" =
    billingCycle?.interval === "year" ? "annual" : "monthly";

  const currentBillingPeriod = (subscriptionData as Record<string, unknown>)
    .currentBillingPeriod as
    | { startsAt?: string; endsAt?: string }
    | undefined;
  const billingPeriod = (subscriptionData as Record<string, unknown>)
    .billingPeriod as { startsAt?: string; endsAt?: string } | undefined;

  // Pull currency off the txn details when available; fall back to the
  // currency we recorded at checkout time.
  const details = (subscriptionData as Record<string, unknown>).details as
    | { totals?: { currencyCode?: string } }
    | undefined;
  const txCurrency =
    (details?.totals?.currencyCode?.toUpperCase() as Currency | undefined) ??
    ((employer.subscription_currency as Currency | null) ?? "USD");

  switch (eventType) {
    case "subscription.created":
    case "subscription.activated":
      await supabase
        .from("company_applications")
        .update({
          subscription_status: "active",
          subscription_plan: planFromPrice ?? undefined,
          subscription_interval: interval,
          subscription_currency: txCurrency,
          payment_currency: txCurrency,
          paddle_subscription_id: subscriptionId,
          current_period_start: currentBillingPeriod?.startsAt,
          current_period_end: currentBillingPeriod?.endsAt,
        })
        .eq("user_id", employer.user_id);
      break;

    case "subscription.updated":
      await supabase
        .from("company_applications")
        .update({
          subscription_plan: planFromPrice ?? undefined,
          subscription_interval: interval,
          subscription_currency: txCurrency,
          payment_currency: txCurrency,
          current_period_end: currentBillingPeriod?.endsAt,
        })
        .eq("user_id", employer.user_id);
      break;

    case "subscription.cancelled":
      await supabase
        .from("company_applications")
        .update({ subscription_status: "cancelled" })
        .eq("user_id", employer.user_id);
      break;

    case "subscription.paused":
      await supabase
        .from("company_applications")
        .update({ subscription_status: "paused" })
        .eq("user_id", employer.user_id);
      break;

    case "subscription.resumed":
      await supabase
        .from("company_applications")
        .update({ subscription_status: "active" })
        .eq("user_id", employer.user_id);
      break;

    case "transaction.payment_failed":
      await supabase
        .from("company_applications")
        .update({ subscription_status: "past_due" })
        .eq("user_id", employer.user_id);
      break;

    case "transaction.completed": {
      await supabase
        .from("company_applications")
        .update({
          subscription_status: "active",
          subscription_currency: txCurrency,
          payment_currency: txCurrency,
          current_period_start: billingPeriod?.startsAt,
          current_period_end: billingPeriod?.endsAt,
        })
        .eq("user_id", employer.user_id);

      // Emit an invoice row + (future) PDF render. Idempotent.
      const txnId = (subscriptionData.id as string) ?? null;
      const totalRaw =
        (details?.totals as { total?: string } | undefined)?.total ?? null;
      const amountCents = totalRaw ? Number(totalRaw) : null;

      if (txnId && planFromPrice && amountCents != null && Number.isFinite(amountCents)) {
        await recordInvoice(supabase, {
          userId: employer.user_id,
          provider: "paddle",
          providerRef: txnId,
          amountCents,
          currency: txCurrency,
          planId: planFromPrice,
          interval,
          periodStart: billingPeriod?.startsAt ?? null,
          periodEnd: billingPeriod?.endsAt ?? null,
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}

/**
 * Map a Paddle price id to a Veloraa plan id. Returns null for unknown
 * ids so the caller can skip the update instead of incorrectly tagging
 * the row as "scale" (the previous behaviour).
 */
function mapPaddlePlanName(
  priceId: string | undefined | null
): "growth" | "scale" | null {
  if (!priceId) return null;
  const growthPrices = [
    process.env.PADDLE_PRICE_GROWTH_MONTHLY,
    process.env.PADDLE_PRICE_GROWTH_ANNUAL,
  ];
  const scalePrices = [
    process.env.PADDLE_PRICE_SCALE_MONTHLY,
    process.env.PADDLE_PRICE_SCALE_ANNUAL,
  ];
  if (growthPrices.includes(priceId)) return "growth";
  if (scalePrices.includes(priceId)) return "scale";
  return null;
}
