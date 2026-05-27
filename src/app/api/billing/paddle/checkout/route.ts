import { NextRequest, NextResponse } from "next/server";
import { paddle } from "@/lib/billing/paddle";
import { createClient } from "@/lib/supabase/server";
import { resolveLocale } from "@/lib/billing/locale";

const PRICE_MAP: Record<string, string> = {
  growth_monthly: process.env.PADDLE_PRICE_GROWTH_MONTHLY!,
  growth_annual: process.env.PADDLE_PRICE_GROWTH_ANNUAL!,
  scale_monthly: process.env.PADDLE_PRICE_SCALE_MONTHLY!,
  scale_annual: process.env.PADDLE_PRICE_SCALE_ANNUAL!,
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan, interval } = await req.json();
  const priceId = PRICE_MAP[`${plan}_${interval}`];
  if (!priceId)
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  const { data: employer } = await supabase
    .from("company_applications")
    .select("paddle_customer_id, legal_name, hq_country")
    .eq("user_id", user.id)
    .single();

  const locale = await resolveLocale(employer?.hq_country ?? null);

  let customerId = employer?.paddle_customer_id;
  if (!customerId) {
    const customer = await paddle.customers.create({
      email: user.email!,
      name: employer?.legal_name ?? undefined,
      customData: {
        veloraa_user_id: user.id,
        country: locale.country,
      },
    });
    customerId = customer.id;
    await supabase
      .from("company_applications")
      .update({ paddle_customer_id: customerId })
      .eq("user_id", user.id);
  }

  // Mark the subscription as pending so the dashboard doesn't flicker
  // back to "Free" while the user finishes the Paddle popup.
  await supabase
    .from("company_applications")
    .update({
      payment_provider: "paddle",
      payment_currency: locale.currency,
      subscription_currency: locale.currency,
      subscription_status: "pending",
      subscription_plan: plan,
      subscription_interval: interval,
    })
    .eq("user_id", user.id);

  return NextResponse.json({
    priceId,
    customerId,
    customerEmail: user.email,
  });
}
