"use client";

import { useMemo } from "react";
import { Check, Circle } from "lucide-react";

export interface PasswordRules {
  length: boolean;
  letter: boolean;
  number: boolean;
  special: boolean;
}

export function getPasswordRules(value: string): PasswordRules {
  return {
    length: value.length >= 8,
    letter: /[a-zA-Z]/.test(value),
    number: /[0-9]/.test(value),
    special: /[^a-zA-Z0-9]/.test(value),
  };
}

export function getPasswordScore(rules: PasswordRules): number {
  return Object.values(rules).filter(Boolean).length;
}

const RULE_LABELS: { key: keyof PasswordRules; label: string }[] = [
  { key: "length", label: "8+ characters" },
  { key: "letter", label: "One letter" },
  { key: "number", label: "One number" },
  { key: "special", label: "One special char" },
];

const STRENGTH_LABELS = ["Too short", "Weak", "Fair", "Good", "Strong"] as const;

export default function PasswordStrength({ value }: { value: string }) {
  const rules = useMemo(() => getPasswordRules(value), [value]);
  const score = getPasswordScore(rules);

  // Show nothing until the user has started typing.
  const showBar = value.length > 0;

  return (
    <div className="mt-2 space-y-2.5">
      {showBar && (
        <div className="flex items-center gap-3">
          <div className="flex flex-1 gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i < score
                    ? score <= 1
                      ? "bg-red-500"
                      : score === 2
                      ? "bg-amber-500"
                      : score === 3
                      ? "bg-yellow-500"
                      : "bg-accent"
                    : "bg-edge"
                }`}
              />
            ))}
          </div>
          <span
            className={`min-w-[52px] text-right text-[11px] uppercase tracking-wider font-jetbrains ${
              score <= 1
                ? "text-red-500"
                : score === 2
                ? "text-amber-500"
                : score === 3
                ? "text-yellow-500"
                : "text-accent"
            }`}
          >
            {STRENGTH_LABELS[score]}
          </span>
        </div>
      )}

      <ul className="flex flex-wrap gap-x-3 gap-y-1.5">
        {RULE_LABELS.map((r) => {
          const met = rules[r.key];
          return (
            <li
              key={r.key}
              className={`inline-flex items-center gap-1.5 text-[11px] transition-colors font-raleway ${
                met ? "text-accent" : "text-subtle"
              }`}
            >
              {met ? (
                <Check className="h-3 w-3" strokeWidth={3} />
              ) : (
                <Circle className="h-3 w-3" />
              )}
              {r.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
