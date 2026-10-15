"use client";

import { useState } from "react";

type Props = {
  orderId: string;
  labels: { payNow: string; paying: string; payError: string };
};

export function PayButton({ orderId, labels }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = (await res.json()) as { checkoutUrl?: string; error?: string };
      if (!res.ok || !data.checkoutUrl) {
        setError(data.error ?? labels.payError);
        setLoading(false);
        return;
      }
      if (typeof window !== "undefined" && typeof (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag === "function") {
        (window as unknown as { gtag: (...args: unknown[]) => void }).gtag("event", "ads_conversion_Paiement_initi__1", {});
      }
      window.location.href = data.checkoutUrl;
    } catch {
      setError(labels.payError);
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full rounded-full bg-[var(--color-brand-500)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-600)] disabled:opacity-60"
      >
        {loading ? labels.paying : labels.payNow}
      </button>
      {error && <p className="text-xs text-[var(--tone-danger-fg)]">{error}</p>}
    </div>
  );
}
