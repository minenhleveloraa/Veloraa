import { NextRequest, NextResponse } from "next/server";
import { verifyPayFastSignature } from "@/lib/billing/payfast";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordInvoice } from "@/lib/billing/invoices";

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
  const planRaw = params.custom_str2;
  const intervalRaw = params.custom_str3;
  const paymentStatus = params.payment_status;
  const token = params.token;

  if (!employerId) {
    console.error("PayFast ITN: no employer ID in custom_str1");
    return new NextResponse("OK");
  }

  const plan: "growth" | "scale" | null =
    planRaw === "growth" || planRaw === "scale" ? planRaw : null;
  const interval: "monthly" | "annual" =
    intervalRaw === "annual" ? "annual" : "monthly";

  // ── Idempotency keyed on pf_payment_id (or m_payment_id as fallback).
  const providerRef = params.pf_payment_id || params.m_payment_id || null;
  if (providerRef) {
    const { error: insertErr } = await supabase
      .from("billing_events")
      .insert({
        employer_id: employerId,
        provider: "payfast",
        provider_event_id: providerRef,
        event_type: paymentStatus,
        event_data: params,
      });
    if (insertErr?.code === "23505") {
      return new NextResponse("OK (deduped)", { status: 200 });
    }
    if (insertErr) {
      console.error("[payfast webhook] event insert failed:", insertErr);
    }
  } else {
    await supabase.from("billing_events").insert({
      employer_id: employerId,
      provider: "payfast",
      event_type: paymentStatus,
      event_data: params,
    });
  }

  switch (paymentStatus) {
    case "COMPLETE": {
      if (!plan) {
        console.error("PayFast ITN: COMPLETE but unknown plan", planRaw);
        break;
      }
      const periodStart = new Date().toISOString();
      const periodEnd = getNextRenewalDate(interval);

      await supabase
        .from("company_applications")
        .update({
          subscription_status: "active",
          subscription_plan: plan,
          subscription_interval: interval,
          subscription_currency: "ZAR",
          payment_currency: "ZAR",
          payment_provider: "payfast",
          payfast_token: token || null,
          payfast_subscription_ref: params.m_payment_id,
          current_period_start: periodStart,
          current_period_end: periodEnd,
        })
        .eq("user_id", employerId);

      // Record invoice (PayFast amount_gross is ZAR, in major units).
      const grossRaw = params.amount_gross;
      const amountCents = grossRaw
        ? Math.round(Number(grossRaw) * 100)
        : null;
      if (providerRef && amountCents != null && Number.isFinite(amountCents)) {
        await recordInvoice(supabase, {
          userId: employerId,
          provider: "payfast",
          providerRef,
          amountCents,
          currency: "ZAR",
          planId: plan,
          interval,
          periodStart,
          periodEnd,
        });
      }
      break;
    }

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
