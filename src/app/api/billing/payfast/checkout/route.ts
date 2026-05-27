import { NextRequest, NextResponse } from "next/server";
import {
  generatePayFastSignature,
  PAYFAST_BASE_URL,
} from "@/lib/billing/payfast";
import { PAYFAST_PLANS, type PayFastPlanKey } from "@/lib/billing/payfast-plans";
import { createClient } from "@/lib/supabase/server";
import { resolveLocale } from "@/lib/billing/locale";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan, interval } = await req.json();
  const planKey = `${plan}_${interval}` as PayFastPlanKey;
  const planConfig = PAYFAST_PLANS[planKey];
  if (!planConfig)
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  const { data: employer } = await supabase
    .from("company_applications")
    .select("legal_name, hq_country")
    .eq("user_id", user.id)
    .single();

  // Provider should be PayFast (the client picks this route), but
  // resolveLocale enforces ZA/ZAR consistency.
  const locale = await resolveLocale(employer?.hq_country ?? null);

  // PayFast requires a contact name. We split the legal_name conservatively.
  const fullName = (employer?.legal_name ?? "").trim();
  const parts = fullName ? fullName.split(/\s+/) : [];
  const nameFirst = parts[0] || "Company";
  const nameLast = parts.slice(1).join(" ") || "Account";

  const params: Record<string, string> = {
    merchant_id: process.env.PAYFAST_MERCHANT_ID!,
    merchant_key: process.env.PAYFAST_MERCHANT_KEY!,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/company/subscription?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/company/subscription?cancelled=true`,
    notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/payfast`,
    name_first: nameFirst,
    name_last: nameLast,
    email_address: user.email!,
    m_payment_id: `${user.id}_${Date.now()}`,
    amount: planConfig.amount,
    item_name: planConfig.name,
    item_description: `Veloraa ${plan} plan — ${interval} billing`,
    subscription_type: String(planConfig.subscription_type),
    billing_date: new Date().toISOString().split("T")[0],
    recurring_amount: planConfig.amount,
    frequency: String(planConfig.frequency),
    cycles: String(planConfig.cycles),
    custom_str1: user.id,
    custom_str2: plan,
    custom_str3: interval,
  };

  params.signature = generatePayFastSignature(params);

  // Mark the subscription as pending so the dashboard doesn't flicker
  // back to "Free" between redirect and webhook.
  await supabase
    .from("company_applications")
    .update({
      payment_provider: "payfast",
      payment_currency: locale.currency,
      subscription_currency: locale.currency,
      subscription_status: "pending",
      subscription_plan: plan,
      subscription_interval: interval,
    })
    .eq("user_id", user.id);

  return NextResponse.json({
    actionUrl: PAYFAST_BASE_URL,
    params,
  });
}
