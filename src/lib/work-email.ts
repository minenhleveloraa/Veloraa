/**
 * Work-email policy.
 *
 * Companies must sign up with a work email. This is enforced by:
 *   1. A curated blocklist of popular personal email providers.
 *   2. An env-based dev override (`COMPANY_EXTRA_ALLOWED_DOMAINS`) so you
 *      can let specific personal domains through during development.
 *
 * ──────────────────────────────────────────────────────────────────────
 * Launch / production checklist
 * ──────────────────────────────────────────────────────────────────────
 * When you're ready to flip to strict work-email-only, simply **unset**
 * the `COMPANY_EXTRA_ALLOWED_DOMAINS` env var (or remove the line in
 * your production env). No code change needed — the validator reverts to
 * blocking all personal providers automatically.
 */

const PERSONAL_EMAIL_PROVIDERS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "yahoo.co.in",
  "ymail.com",
  "outlook.com",
  "hotmail.com",
  "hotmail.co.uk",
  "live.com",
  "msn.com",
  "aol.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "proton.me",
  "protonmail.com",
  "pm.me",
  "tutanota.com",
  "gmx.com",
  "gmx.net",
  "mail.com",
  "zoho.com",
  "yandex.com",
  "yandex.ru",
  "fastmail.com",
  "fastmail.fm",
  "qq.com",
  "163.com",
  "126.com",
  "naver.com",
  "daum.net",
  "rediffmail.com",
]);

function getExtraAllowedDomains(): Set<string> {
  const raw = process.env.COMPANY_EXTRA_ALLOWED_DOMAINS ?? "";
  return new Set(
    raw
      .split(",")
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean)
  );
}

export interface WorkEmailCheck {
  ok: boolean;
  domain?: string;
  reason?: "invalid" | "personal-provider";
  message?: string;
}

export function checkWorkEmail(email: string): WorkEmailCheck {
  const trimmed = (email ?? "").trim().toLowerCase();
  const at = trimmed.lastIndexOf("@");
  if (at < 1 || at === trimmed.length - 1) {
    return { ok: false, reason: "invalid", message: "Enter a valid email." };
  }
  const domain = trimmed.slice(at + 1);

  // Dev override: specific domains listed here are always accepted.
  const extras = getExtraAllowedDomains();
  if (extras.has(domain)) {
    return { ok: true, domain };
  }

  if (PERSONAL_EMAIL_PROVIDERS.has(domain)) {
    return {
      ok: false,
      domain,
      reason: "personal-provider",
      message: `Personal emails aren't accepted — please use your company email (not ${domain}).`,
    };
  }

  return { ok: true, domain };
}
