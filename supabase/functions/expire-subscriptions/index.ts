import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const now = new Date().toISOString();

  // Downgrade cancelled subscriptions whose period has ended
  await supabase
    .from("company_applications")
    .update({
      subscription_plan: "free",
      subscription_status: "free",
    })
    .eq("subscription_status", "cancelled")
    .lt("current_period_end", now);

  // Flag past_due subscriptions that haven't recovered in 7 days
  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();
  await supabase
    .from("company_applications")
    .update({ subscription_status: "cancelled" })
    .eq("subscription_status", "past_due")
    .lt("current_period_end", sevenDaysAgo);

  return new Response("OK");
});
