"use client";
import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";

export function SubscriptionActions({
  provider,
  hasPaddleCustomer,
}: {
  provider: "paddle" | "payfast";
  hasPaddleCustomer: boolean;
}) {
  const [loading, setLoading] = useState(false);

  const handleManage = async () => {
    if (provider === "paddle" && hasPaddleCustomer) {
      setLoading(true);
      try {
        const res = await fetch("/api/billing/paddle/portal", {
          method: "POST",
        });
        const { url } = await res.json();
        if (url) {
          window.open(url, "_blank");
        }
      } catch (err) {
        console.error("Failed to open billing portal:", err);
      } finally {
        setLoading(false);
      }
    } else if (provider === "payfast") {
      window.open("https://www.payfast.co.za/login", "_blank");
    }
  };

  return (
    <div className="flex flex-col gap-2 sm:items-end">
      <button
        type="button"
        onClick={handleManage}
        disabled={loading}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-edge bg-surface px-5 py-2.5 text-xs font-semibold text-heading transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60 font-raleway"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ExternalLink className="h-3.5 w-3.5" />
        )}
        Manage subscription
      </button>
      <p className="text-[10px] text-subtle font-jetbrains">
        {provider === "paddle"
          ? "Opens Paddle customer portal"
          : "Opens PayFast dashboard"}
      </p>
    </div>
  );
}
