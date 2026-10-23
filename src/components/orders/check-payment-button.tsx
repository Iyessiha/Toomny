"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PaymentCheck } from "@/lib/payments/confirm-order-payment";

type CheckResult = { status: PaymentCheck | "error" };

type Props = {
  orderId: string;
  action: (orderId: string) => Promise<CheckResult>;
  labels: {
    checkPayment: string;
    checkingPayment: string;
    checkPending: string;
    checkFailed: string;
    checkError: string;
  };
};

export function CheckPaymentButton({ orderId, action, labels }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleCheck() {
    setMessage(null);
    startTransition(async () => {
      const result = await action(orderId);
      if (result.status === "funded") {
        router.refresh();
        return;
      }
      if (result.status === "pending") setMessage(labels.checkPending);
      else if (result.status === "failed") setMessage(labels.checkFailed);
      else setMessage(labels.checkError);
    });
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      <button
        type="button"
        onClick={handleCheck}
        disabled={pending}
        className="w-full rounded-full border border-[var(--color-brand-500)] px-5 py-2.5 text-sm font-semibold text-[var(--color-brand-600)] transition hover:bg-white disabled:opacity-60"
      >
        {pending ? labels.checkingPayment : labels.checkPayment}
      </button>
      {message && <p className="text-xs text-[var(--subtle)]">{message}</p>}
    </div>
  );
}
