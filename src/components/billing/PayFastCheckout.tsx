"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export function PayFastCheckoutButton({
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
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/payfast/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval }),
      });
      const { actionUrl, params } = await res.json();

      const form = document.createElement("form");
      form.method = "POST";
      form.action = actionUrl;

      Object.entries(params).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value as string;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      console.error("PayFast checkout error:", err);
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
