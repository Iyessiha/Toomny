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
          className="input"
        />
      )}
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <button
            key={a}
            type="button"
            disabled={pending !== null}
            onClick={() => run(a)}
            className={`${
              "danger" in ORDER_RULES[a] && ORDER_RULES[a].danger ? "btn-danger" : "btn-primary"
            } disabled:opacity-60`}
          >
            {pending === a ? t.inProgress : t.actionLabels[a]}
          </button>
        ))}
      </div>
      {error && <p role="alert" className="notice notice-danger">{error}</p>}
    </div>
  );
}
