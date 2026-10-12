"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  processPayout,
  markPayoutPaid,
  markPayoutFailed,
  requeuePayout,
} from "@/app/(fr)/admin/payouts/actions";
import { getAdminTexts } from "@/i18n/admin";
import type { Locale } from "@/i18n/dictionaries";

type Mode = "idle" | "confirmPaid" | "confirmFailed";

/**
 * Actions d'une ligne de versement. Les transitions simples (prise en charge,
 * remise en file) sont immédiates ; le paiement et l'échec demandent une
 * confirmation avec saisie (référence opérateur, motif) pour éviter les clics
 * accidentels sur de l'argent.
 */
export function PayoutRowActions({
  payoutId,
  status,
  locale = "fr",
}: {
  payoutId: string;
  status: string;
  locale?: Locale;
}) {
  const t = getAdminTexts(locale).payoutsPage;
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("idle");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [field, setField] = useState("");

  async function run(action: () => Promise<{ error: string } | { success: true }>) {
    setPending(true);
    setError(null);
    const result = await action();
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setMode("idle");
    setField("");
    router.refresh();
  }

  const btn =
    "rounded-full px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60";
  const ghost =
    "rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium disabled:opacity-60";

  if (status === "paid") return null;

  return (
    <div className="flex flex-col items-end gap-2">
      {mode === "idle" && (
        <div className="flex items-center justify-end gap-2">
          {status === "queued" && (
            <>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => processPayout(payoutId))}
                className={`${btn} bg-[var(--color-brand-500)]`}
              >
                {t.process}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => setMode("confirmFailed")}
                className={`${btn} bg-red-600`}
              >
                {t.markFailed}
              </button>
            </>
          )}
          {status === "processing" && (
            <>
              <button
                type="button"
                disabled={pending}
                onClick={() => setMode("confirmPaid")}
                className={`${btn} bg-green-600`}
              >
                {t.markPaid}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => setMode("confirmFailed")}
                className={`${btn} bg-red-600`}
              >
                {t.markFailed}
              </button>
            </>
          )}
          {status === "failed" && (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => requeuePayout(payoutId))}
              className={`${btn} bg-amber-500`}
            >
              {t.requeue}
            </button>
          )}
        </div>
      )}

      {mode === "confirmPaid" && (
        <div className="flex w-64 flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
          <label className="text-xs font-medium">
            {t.providerRefLabel}
            <input
              value={field}
              onChange={(e) => setField(e.target.value)}
              maxLength={120}
              placeholder={t.providerRefPlaceholder}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs outline-none focus:border-[var(--color-brand-500)]"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" disabled={pending} onClick={() => setMode("idle")} className={ghost}>
              ✕
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => markPayoutPaid(payoutId, field))}
              className={`${btn} bg-green-600`}
            >
              {t.markPaid}
            </button>
          </div>
        </div>
      )}

      {mode === "confirmFailed" && (
        <div className="flex w-64 flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
          <label className="text-xs font-medium">
            {t.failureReasonLabel}
            <textarea
              value={field}
              onChange={(e) => setField(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder={t.failureReasonPlaceholder}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs outline-none focus:border-red-400"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" disabled={pending} onClick={() => setMode("idle")} className={ghost}>
              ✕
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => markPayoutFailed(payoutId, field))}
              className={`${btn} bg-red-600`}
            >
              {t.markFailed}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="max-w-64 text-right text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
