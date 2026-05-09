import { NextRequest, NextResponse } from "next/server";
import {
  generatePayFastSignature,
  PAYFAST_BASE_URL,
} from "@/lib/billing/payfast";
import { PAYFAST_PLANS, type PayFastPlanKey } from "@/lib/billing/payfast-plans";
import { createClient } from "@/lib/supabase/server";

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
    .select("company_name")
    .eq("user_id", user.id)
    .single();

  const params: Record<string, string> = {
    merchant_id: process.env.PAYFAST_MERCHANT_ID!,
    merchant_key: process.env.PAYFAST_MERCHANT_KEY!,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/company/dashboard?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?cancelled=true`,
    notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/payfast`,
    name_first: employer?.company_name?.split(" ")[0] || "Company",
    name_last: employer?.company_name?.split(" ").slice(1).join(" ") || "",
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

  return NextResponse.json({
    actionUrl: PAYFAST_BASE_URL,
    params,
  });
}
