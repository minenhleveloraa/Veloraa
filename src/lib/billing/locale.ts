import "server-only";
import { cookies, headers } from "next/headers";
import type { Currency } from "@/lib/billing/plans";

export type PaymentProvider = "paddle" | "payfast";

export interface ResolvedLocale {
  /** ISO-3166 alpha-2 country code (uppercased). */
  country: string;
  currency: Currency;
  provider: PaymentProvider;
}

const ZA_KEYS = new Set(["ZA", "SOUTH AFRICA", "SOUTHAFRICA"]);

function isZA(value: string | null | undefined): boolean {
  if (!value) return false;
  return ZA_KEYS.has(value.toUpperCase().trim());
}

/**
 * Resolve the user's billing locale (country, currency, provider).
 *
 * Priority chain:
 *   1. `profileCountry`             — truth once the company wizard is filled.
 *   2. `v_country` cookie           — present from first request.
 *   3. `x-vercel-ip-country` header — fallback if cookie was nuked.
 *   4. Hard default                 — US / USD / Paddle.
 */
export async function resolveLocale(
  profileCountry?: string | null
): Promise<ResolvedLocale> {
  const profile = (profileCountry ?? "").trim().toUpperCase();
  if (isZA(profile)) {
    return { country: "ZA", currency: "ZAR", provider: "payfast" };
  }
  if (profile) {
    return { country: profile, currency: "USD", provider: "paddle" };
  }

  const cookieStore = await cookies();
  const cookieCountry = cookieStore.get("v_country")?.value?.toUpperCase();
  if (isZA(cookieCountry)) {
    return { country: "ZA", currency: "ZAR", provider: "payfast" };
  }
  if (cookieCountry) {
    return { country: cookieCountry, currency: "USD", provider: "paddle" };
  }

  const headerStore = await headers();
  const ipCountry = headerStore
    .get("x-vercel-ip-country")
    ?.toUpperCase();
  if (isZA(ipCountry)) {
    return { country: "ZA", currency: "ZAR", provider: "payfast" };
  }

  return {
    country: ipCountry || "US",
    currency: "USD",
    provider: "paddle",
  };
}
