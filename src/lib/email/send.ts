import "server-only";
import { Resend } from "resend";

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send a transactional email via Resend.
 *
 * If RESEND_API_KEY is not configured, this resolves with a "skipped"
 * result and logs to the console — the admin review flow still completes
 * so you can test locally without wiring up an email provider.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailInput): Promise<{ ok: boolean; skipped?: boolean; message?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.EMAIL_FROM ?? "Veloraa <onboarding@resend.dev>";

  if (!apiKey) {
    console.warn(
      `[email:skipped] No RESEND_API_KEY set. Would have emailed ${to}: ${subject}`
    );
    return { ok: true, skipped: true };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text,
    });
    if (error) {
      console.error("[email] Resend error:", error);
      return { ok: false, message: error.message ?? "Failed to send email." };
    }
    return { ok: true };
  } catch (e) {
    console.error("[email] Unexpected error:", e);
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Failed to send email.",
    };
  }
}
