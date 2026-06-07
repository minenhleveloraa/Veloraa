import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications/create";

/**
 * POST /api/velscreen-webhook — Receive completed interview reports from Velscreen
 *
 * Validates HMAC-SHA256 signature from x-velscreen-signature header.
 * Stores the report in the talent_applications table and notifies the admin.
 */
export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    const signature = req.headers.get("x-velscreen-signature");

    // Verify HMAC signature
    const secret = process.env.VELSCREEN_API_SECRET;
    if (!secret) {
      console.error("[Veloraa Webhook] Missing VELSCREEN_API_SECRET");
      return NextResponse.json(
        { ok: false, message: "Server misconfigured." },
        { status: 500 }
      );
    }

    if (!signature) {
      return NextResponse.json(
        { ok: false, message: "Missing signature." },
        { status: 401 }
      );
    }

    const hmac = createHmac("sha256", secret);
    hmac.update(raw, "utf8");
    const expected = hmac.digest("hex");

    const sigBuf = Buffer.from(signature, "hex");
    const expBuf = Buffer.from(expected, "hex");

    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return NextResponse.json(
        { ok: false, message: "Invalid signature." },
        { status: 401 }
      );
    }

    // Parse payload
    const payload = JSON.parse(raw);

    if (payload.event !== "interview.completed") {
      return NextResponse.json(
        { ok: false, message: `Unknown event: ${payload.event}` },
        { status: 400 }
      );
    }

    const { veloraa_user_id, session_token, report } = payload;

    if (!veloraa_user_id || !report) {
      return NextResponse.json(
        { ok: false, message: "Missing required fields." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Store the Velscreen report in the talent application
    const { error: updErr } = await admin
      .from("talent_applications")
      .update({
        velscreen_report: report,
        velscreen_session_token: session_token,
        velscreen_completed_at: report.completed_at || new Date().toISOString(),
      })
      .eq("user_id", veloraa_user_id);

    if (updErr) {
      console.error("[Veloraa Webhook] Failed to store report:", updErr);
      return NextResponse.json(
        { ok: false, message: updErr.message },
        { status: 500 }
      );
    }

    // Create notification for admin
    await createNotification({
      userId: veloraa_user_id,
      kind: "review_decision",
      title: "AI Interview Report Ready",
      body: `Velscreen AI interview completed. Recommendation: ${report.recommendation}. Overall score: ${report.scores?.overall ?? "N/A"}/100.`,
      refTable: "talent_applications",
    });

    console.log(
      `[Veloraa Webhook] Report received for user ${veloraa_user_id}: recommendation=${report.recommendation}, overall=${report.scores?.overall}`
    );

    return NextResponse.json({ ok: true, message: "Report received." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("[Veloraa Webhook Error]:", error);
    return NextResponse.json(
      { ok: false, message },
      { status: 500 }
    );
  }
}
