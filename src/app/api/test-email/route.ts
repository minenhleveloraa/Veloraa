import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/send";

export async function GET(req: NextRequest) {
  // Only allow testing in development environment for security
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Forbidden in production environment" },
      { status: 403 }
    );
  }

  // Get recipient email from query parameter (?to=user@example.com)
  const { searchParams } = new URL(req.url);
  let recipient = searchParams.get("to");

  // Fallback to the first admin email if configured
  if (!recipient && process.env.ADMIN_EMAILS) {
    recipient = process.env.ADMIN_EMAILS.split(",")[0].trim();
  }

  if (!recipient) {
    return NextResponse.json(
      {
        error: "No recipient email provided.",
        instruction: "Please visit this URL with a query parameter, e.g.: /api/test-email?to=your-email@example.com",
      },
      { status: 400 }
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      ok: false,
      status: "missing_key",
      message: "RESEND_API_KEY is not configured in your .env.local file.",
      instruction: "Add 'RESEND_API_KEY=re_...' to your .env.local and restart your Next.js dev server.",
    });
  }

  const result = await sendEmail({
    to: recipient,
    subject: "🔥 Veloraa — Resend API Connection Test",
    html: `
      <div style="font-family: sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px;">
        <h1 style="color: #6366f1; margin-top: 0;">Veloraa Connection Successful!</h1>
        <p>Hello,</p>
        <p>This is a test email confirming that your **Resend API Key** is correctly wired up and working with the Veloraa platform.</p>
        <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 24px 0;" />
        <p style="font-size: 12px; color: #888888;">
          Sender Address Configured: ${process.env.EMAIL_FROM ?? "Veloraa <onboarding@resend.dev>"}
        </p>
      </div>
    `,
    text: `Hello, This is a test email confirming that your Resend API Key is correctly wired up and working with the Veloraa platform.`,
  });

  return NextResponse.json({
    ok: result.ok,
    recipient,
    result,
    from: process.env.EMAIL_FROM ?? "Veloraa <onboarding@resend.dev>",
    debug: {
      hasApiKey: !!apiKey,
      apiKeyPrefix: apiKey ? `${apiKey.substring(0, 5)}...` : "none",
    },
  });
}
