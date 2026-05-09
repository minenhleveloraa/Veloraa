import { NextRequest, NextResponse } from "next/server";
import { paddle } from "@/lib/billing/paddle";
import { createAdminClient } from "@/lib/supabase/admin";

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

  const subscriptionData = event.data as unknown as Record<string, unknown>;
  const customerId = subscriptionData?.customerId as string | undefined;
  const subscriptionId = subscriptionData?.id as string | undefined;

  const { data: employer } = await supabase
    .from("company_applications")
    .select("user_id")
    .eq("paddle_customer_id", customerId)
    .single();

  if (!employer) {
    console.error(
      "Paddle webhook: no employer found for customer",
      customerId
    );
    return NextResponse.json({ received: true });
  }

  await supabase.from("billing_events").insert({
    employer_id: employer.user_id,
    provider: "paddle",
    event_type: event.eventType,
    event_data: subscriptionData,
  });

  const items = (subscriptionData as Record<string, unknown>).items as
    | Array<{ price?: { id?: string } }>
    | undefined;
  const billingCycle = (subscriptionData as Record<string, unknown>)
    .billingCycle as { interval?: string } | undefined;
  const currentBillingPeriod = (subscriptionData as Record<string, unknown>)
    .currentBillingPeriod as
    | { startsAt?: string; endsAt?: string }
    | undefined;
  const billingPeriod = (subscriptionData as Record<string, unknown>)
    .billingPeriod as { startsAt?: string; endsAt?: string } | undefined;

  const eventType = event.eventType as string;

  switch (eventType) {
    case "subscription.created":
    case "subscription.activated":
      await supabase
        .from("company_applications")
        .update({
          subscription_status: "active",
          subscription_plan: mapPaddlePlanName(items?.[0]?.price?.id),
          subscription_interval:
            billingCycle?.interval === "year" ? "annual" : "monthly",
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
          subscription_plan: mapPaddlePlanName(items?.[0]?.price?.id),
          subscription_interval:
            billingCycle?.interval === "year" ? "annual" : "monthly",
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

    case "transaction.completed":
      await supabase
        .from("company_applications")
        .update({
          subscription_status: "active",
          current_period_start: billingPeriod?.startsAt,
          current_period_end: billingPeriod?.endsAt,
        })
        .eq("user_id", employer.user_id);
      break;
  }

  return NextResponse.json({ received: true });
}

function mapPaddlePlanName(
  priceId: string | undefined
): "growth" | "scale" {
  const growthPrices = [
    process.env.PADDLE_PRICE_GROWTH_MONTHLY,
    process.env.PADDLE_PRICE_GROWTH_ANNUAL,
  ];
  return growthPrices.includes(priceId) ? "growth" : "scale";
}
