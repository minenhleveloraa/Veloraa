import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: employer } = await supabase
    .from("company_applications")
    .select(
      "subscription_plan, subscription_status, subscription_interval, payment_provider, payment_currency, subscription_currency, current_period_start, current_period_end, has_used_free_post"
    )
    .eq("user_id", user.id)
    .single();

  if (!employer)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Include the most-recent invoices for the dashboard. RLS already
  // restricts these to the current user.
  const { data: invoices } = await supabase
    .from("invoices")
    .select(
      "id, number, provider, status, amount_cents, currency, plan_id, interval, period_start, period_end, emitted_at"
    )
    .order("emitted_at", { ascending: false })
    .limit(24);

  return NextResponse.json({
    ...employer,
    invoices: invoices ?? [],
  });
}
