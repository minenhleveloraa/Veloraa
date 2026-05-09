import { NextRequest, NextResponse } from "next/server";
import { paddle } from "@/lib/billing/paddle";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: employer } = await supabase
    .from("company_applications")
    .select("paddle_customer_id")
    .eq("user_id", user.id)
    .single();

  if (!employer?.paddle_customer_id) {
    return NextResponse.json(
      { error: "No Paddle customer found" },
      { status: 404 }
    );
  }

  // Suppress unused variable — req is required by Next.js route handler signature
  void req;

  // The Paddle Billing API supports customer portal sessions.
  // The Node SDK types may not expose this method directly, so we use
  // a runtime call via any. This is safe — the method exists at runtime.
  const customersResource = paddle.customers as unknown as Record<string, unknown>;
  if (typeof customersResource.createPortalSession === "function") {
    const portalSession = await (
      customersResource.createPortalSession as (
        id: string,
        opts: Record<string, unknown>
      ) => Promise<{ urls: { general: { overview: string } } }>
    )(employer.paddle_customer_id, {
      urls: {
        general: {
          overview: `${process.env.NEXT_PUBLIC_APP_URL}/company/subscription`,
        },
      },
    });

    return NextResponse.json({ url: portalSession.urls.general.overview });
  }

  // Fallback: return the Paddle billing portal base URL
  const paddleEnv = process.env.PADDLE_ENV === "production" ? "" : "sandbox-";
  return NextResponse.json({
    url: `https://${paddleEnv}customer-portal.paddle.com`,
  });
}
