import { NextRequest, NextResponse } from "next/server";
import { verifyPayFastSignature } from "@/lib/billing/payfast";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    params[key] = value.toString();
  });

  const isValid = verifyPayFastSignature(params);
  if (!isValid) {
    console.error("PayFast ITN signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const employerId = params.custom_str1;
  const plan = params.custom_str2 as "growth" | "scale";
  const interval = params.custom_str3 as "monthly" | "annual";
  const paymentStatus = params.payment_status;
  const token = params.token;

  if (!employerId) {
    console.error("PayFast ITN: no employer ID in custom_str1");
    return new NextResponse("OK");
  }

  await supabase.from("billing_events").insert({
    employer_id: employerId,
    provider: "payfast",
    event_type: paymentStatus,
    event_data: params,
  });

  switch (paymentStatus) {
    case "COMPLETE":
      await supabase
        .from("company_applications")
        .update({
          subscription_status: "active",
          subscription_plan: plan,
          subscription_interval: interval,
          payfast_token: token || null,
          payfast_subscription_ref: params.m_payment_id,
          current_period_start: new Date().toISOString(),
          current_period_end: getNextRenewalDate(interval),
        })
        .eq("user_id", employerId);
      break;

    case "FAILED":
    case "CANCELLED":
      await supabase
        .from("company_applications")
        .update({
          subscription_status:
            paymentStatus === "CANCELLED" ? "cancelled" : "past_due",
        })
        .eq("user_id", employerId);
      break;
  }

  return new NextResponse("OK", { status: 200 });
}

function getNextRenewalDate(interval: "monthly" | "annual"): string {
  const date = new Date();
  if (interval === "annual") {
    date.setFullYear(date.getFullYear() + 1);
  } else {
    date.setMonth(date.getMonth() + 1);
  }
  return date.toISOString();
}
