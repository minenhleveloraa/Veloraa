"use client";
import { PaddleCheckoutButton } from "./PaddleCheckout";
import { PayFastCheckoutButton } from "./PayFastCheckout";

interface CheckoutButtonProps {
  plan: "growth" | "scale";
  interval: "monthly" | "annual";
  paymentProvider: "paddle" | "payfast";
  children?: React.ReactNode;
  className?: string;
}

export function CheckoutButton({
  plan,
  interval,
  paymentProvider,
  children,
  className,
}: CheckoutButtonProps) {
  if (paymentProvider === "payfast") {
    return (
      <PayFastCheckoutButton
        plan={plan}
        interval={interval}
        className={className}
      >
        {children}
      </PayFastCheckoutButton>
    );
  }
  return (
    <PaddleCheckoutButton
      plan={plan}
      interval={interval}
      className={className}
    >
      {children}
    </PaddleCheckoutButton>
  );
}
