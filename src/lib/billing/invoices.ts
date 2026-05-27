import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Currency } from "@/lib/billing/plans";

export interface RecordInvoiceInput {
  userId: string;
  provider: "paddle" | "payfast";
  /** Paddle txn id or PayFast pf_payment_id; unique per provider. */
  providerRef: string;
  amountCents: number;
  currency: Currency;
  planId: "growth" | "scale";
  interval: "monthly" | "annual";
  periodStart?: string | null;
  periodEnd?: string | null;
}

export interface RecordedInvoice {
  id: string;
  number: string | null;
  alreadyExisted: boolean;
}

/**
 * Build the next monotonic invoice number, e.g. `VLR-2026-000123`.
 * Uses the `invoice_number_seq` sequence created in `billing_v2.sql`.
 */
async function nextInvoiceNumber(
  admin: SupabaseClient
): Promise<string | null> {
  // Calls the SECURITY DEFINER `public.next_invoice_number()` RPC
  // installed by `supabase/billing_v2.sql`. If the migration hasn't run
  // yet we silently return null and the invoice row gets no number.
  try {
    const { data, error } = await admin.rpc("next_invoice_number");
    if (error) {
      console.warn("[invoices] next_invoice_number rpc failed:", error.message);
      return null;
    }
    return typeof data === "string" ? data : null;
  } catch {
    return null;
  }
}

/**
 * Insert an invoice row idempotently keyed on (provider, provider_ref).
 * Returns the existing row if a duplicate is detected.
 */
export async function recordInvoice(
  admin: SupabaseClient,
  input: RecordInvoiceInput
): Promise<RecordedInvoice | null> {
  const number = await nextInvoiceNumber(admin);

  const { data: inserted, error } = await admin
    .from("invoices")
    .insert({
      user_id: input.userId,
      provider: input.provider,
      provider_ref: input.providerRef,
      number,
      amount_cents: input.amountCents,
      currency: input.currency,
      plan_id: input.planId,
      interval: input.interval,
      period_start: input.periodStart ?? null,
      period_end: input.periodEnd ?? null,
      status: "paid",
    })
    .select("id, number")
    .single();

  // Unique violation → fetch the existing row.
  if (error?.code === "23505") {
    const { data: existing } = await admin
      .from("invoices")
      .select("id, number")
      .eq("provider", input.provider)
      .eq("provider_ref", input.providerRef)
      .maybeSingle();
    if (existing) {
      return { id: existing.id, number: existing.number, alreadyExisted: true };
    }
    return null;
  }

  if (error) {
    console.error("[invoices] insert failed:", error);
    return null;
  }

  return {
    id: inserted!.id,
    number: inserted!.number,
    alreadyExisted: false,
  };
}
