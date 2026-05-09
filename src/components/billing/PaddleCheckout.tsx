"use client";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export function PaddleCheckoutButton({
  plan,
  interval,
  children,
  className,
}: {
  plan: "growth" | "scale";
  interval: "monthly" | "annual";
  children?: React.ReactNode;
  className?: string;
}) {
  const [paddle, setPaddle] = useState<Paddle | undefined>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializePaddle({
      environment: (process.env.NEXT_PUBLIC_PADDLE_ENV as "sandbox" | "production") ?? "sandbox",
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
    }).then(setPaddle);
  }, []);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/paddle/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval }),
      });
      const { priceId, customerId } = await res.json();

      paddle?.Checkout.open({
        customer: { id: customerId },
        items: [{ priceId, quantity: 1 }],
        settings: {
          successUrl: `${window.location.origin}/company/dashboard?upgraded=true`,
        },
      });
    } catch (err) {
      console.error("Paddle checkout error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleCheckout} disabled={loading} className={className}>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        children ?? `Upgrade to ${plan.charAt(0).toUpperCase() + plan.slice(1)}`
      )}
    </button>
  );
}
