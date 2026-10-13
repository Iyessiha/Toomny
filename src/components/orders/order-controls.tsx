"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { advanceOrder } from "@/app/(fr)/orders/actions";
import type { OrderAction } from "@/lib/orders";
import { ORDER_RULES } from "@/lib/orders";
import { getDashboardTexts } from "@/i18n/dashboard";
import type { Locale } from "@/i18n/dictionaries";

export function OrderControls({ orderId, actions, locale = "fr" }: { orderId: string; actions: OrderAction[]; locale?: Locale }) {
  const t = getDashboardTexts(locale).orders;
  const router = useRouter();
  const [pending, setPending] = useState<OrderAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  if (actions.length === 0) return null;

  async function run(action: OrderAction) {
    setPending(action);
    setError(null);
    const result = await advanceOrder({ orderId, action, reason });
    setPending(null);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setReason("");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {actions.includes("dispute") && (
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder={t.disputePlaceholder}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none focus:border-[var(--color-brand-500)]"
        />
      )}
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <button
            key={a}
            type="button"
            disabled={pending !== null}
            onClick={() => run(a)}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-60 ${
              "danger" in ORDER_RULES[a] && ORDER_RULES[a].danger
                ? "border border-red-200 bg-red-50 text-red-700"
                : "bg-[var(--color-brand-500)] text-white"
            }`}
          >
            {pending === a ? t.inProgress : t.actionLabels[a]}
          </button>
        ))}
      </div>
      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    </div>
  );
}
