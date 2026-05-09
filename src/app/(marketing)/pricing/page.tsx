import type { Metadata } from "next";
import { cookies } from "next/headers";
import Pricing from "@/components/marketing/Pricing";
import type { Currency } from "@/lib/billing/plans";

export const metadata: Metadata = {
  title: "Pricing — Veloraa",
  description:
    "Simple, transparent pricing for hiring the world's top 1% of vetted technical talent. No hidden fees, no per-seat charges.",
};

export default async function PricingPage() {
  const cookieStore = await cookies();
  const detectedCurrency = (cookieStore.get("v_currency")?.value || "USD") as Currency;

  return <Pricing defaultCurrency={detectedCurrency} />;
}
