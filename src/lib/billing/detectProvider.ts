// eslint-disable-next-line @typescript-eslint/no-require-imports
const disposableDomains: string[] = require("disposable-email-domains");

export function detectPaymentProvider(
  companyCountry: string
): "paddle" | "payfast" {
  if (companyCountry === "South Africa" || companyCountry === "ZA")
    return "payfast";
  return "paddle";
}

export function detectCurrency(provider: "paddle" | "payfast"): "USD" | "ZAR" {
  return provider === "payfast" ? "ZAR" : "USD";
}

export function isBlockedEmailDomain(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return true;
  return disposableDomains.includes(domain);
}

export function extractCompanyDomain(email: string): string {
  return email.split("@")[1]?.toLowerCase() ?? "";
}
