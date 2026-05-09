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
      "subscription_plan, subscription_status, subscription_interval, payment_provider, payment_currency, current_period_start, current_period_end, has_used_free_post"
    )
    .eq("user_id", user.id)
    .single();

  if (!employer)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(employer);
}
