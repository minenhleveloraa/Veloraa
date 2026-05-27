import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/billing/receipts/:id
 *
 * Returns a signed Storage URL redirect to the invoice PDF if one has
 * been rendered, otherwise responds 404 — the client should fall back
 * to the provider's hosted receipt URL stored on `invoices.pdf_url`.
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // RLS guarantees ownership.
  const { data: invoice } = await supabase
    .from("invoices")
    .select("user_id, pdf_url")
    .eq("id", id)
    .maybeSingle();

  if (!invoice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // If the webhook attached a provider-hosted URL (Paddle's transaction.invoice.url
  // or PayFast's email receipt link), redirect there directly.
  if (invoice.pdf_url) {
    return NextResponse.redirect(invoice.pdf_url, { status: 302 });
  }

  // Otherwise try a signed Storage URL — the path convention is
  // <userId>/<invoiceId>.pdf. If the file hasn't been rendered yet
  // (Phase 4 of SUBSCRIPTION_PLAN.md), this returns 404.
  const admin = createAdminClient();
  const { data: signed, error } = await admin.storage
    .from("receipts")
    .createSignedUrl(`${invoice.user_id}/${id}.pdf`, 60 * 5);

  if (error || !signed?.signedUrl) {
    return NextResponse.json(
      { error: "Receipt not yet available" },
      { status: 404 }
    );
  }

  return NextResponse.redirect(signed.signedUrl, { status: 302 });
}
