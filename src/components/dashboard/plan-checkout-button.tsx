"use client";

import { useState } from "react";
import type { PlanTier } from "@/lib/plans";

type Props = {
  plan: PlanTier;
  highlight: boolean;
  label: string;
  redirectingLabel: string;
  errorLabel: string;
  disabled?: boolean;
};

export function PlanCheckoutButton({
  plan,
  highlight,
  label,
  redirectingLabel,
  errorLabel,
  disabled = false,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    if (disabled || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = (await res.json()) as { checkoutUrl?: string; error?: string };
      if (!res.ok || !data.checkoutUrl) {
        setError(data.error ?? errorLabel);
        setLoading(false);
        return;
      }
      window.location.href = data.checkoutUrl;
    } catch {
      setError(errorLabel);
      setLoading(false);
    }
  }

  return (
    <div className="mt-7 flex flex-col gap-2">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={disabled || loading}
        className={`w-full rounded-xl px-4 py-3 text-center text-sm font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 ${
          highlight
            ? "bg-white text-[var(--color-brand-600)] hover:bg-white/90"
            : "bg-[var(--color-brand-500)] text-white hover:bg-[var(--color-brand-600)]"
        }`}
      >
        {loading ? redirectingLabel : label}
      </button>
      {error && (
        <p
          className={`text-xs ${
            highlight ? "text-white" : "text-[var(--tone-danger-fg)]"
          }`}
        >
          {error}
        </p>
      )}
    </div>
  );
}
