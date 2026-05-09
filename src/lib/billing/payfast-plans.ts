export const PAYFAST_PLANS = {
  growth_monthly: {
    name: "Veloraa Growth — Monthly",
    amount: "3699.00",
    cycles: 0,
    frequency: 3,
    subscription_type: 1,
  },
  growth_annual: {
    name: "Veloraa Growth — Annual",
    amount: "36990.00",
    cycles: 0,
    frequency: 6,
    subscription_type: 1,
  },
  scale_monthly: {
    name: "Veloraa Scale — Monthly",
    amount: "7399.00",
    cycles: 0,
    frequency: 3,
    subscription_type: 1,
  },
  scale_annual: {
    name: "Veloraa Scale — Annual",
    amount: "73990.00",
    cycles: 0,
    frequency: 6,
    subscription_type: 1,
  },
} as const;

export type PayFastPlanKey = keyof typeof PAYFAST_PLANS;
