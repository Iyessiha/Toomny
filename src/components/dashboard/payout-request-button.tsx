"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestPayout } from "@/app/(fr)/dashboard/versements/actions";
import { getPayoutTexts } from "@/i18n/payouts";
import { formatMoney } from "@/lib/money";
import type { Locale } from "@/i18n/dictionaries";

export function PayoutRequestButton({
  locale = "fr",
  available,
  currency,
  hasChannel,
}: {
  locale?: Locale;
  available: string;
  currency: string;
  hasChannel: boolean;
}) {
  const t = getPayoutTexts(locale);
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const availableBig = BigInt(available);
  const canRequest = hasChannel && availableBig > 0n;

  async function handleRequest() {
    setPending(true);
    setMessage(null);
    const result = await requestPayout();
    setPending(false);
    if ("error" in result && result.error) {
      setMessage({ type: "err", text: result.error });
    } else if ("count" in result && result.count) {
      setMessage({ type: "ok", text: t.requested(result.count) });
      router.refresh();
    }
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6">
      <h2 className="font-display text-base font-bold">{t.request}</h2>
      <p className="mt-1 text-sm text-[var(--subtle)]">
        {!hasChannel
          ? t.noChannel
          : availableBig === 0n
          ? t.nothingAvailable
          : formatMoney(availableBig, currency, locale)}
      </p>

      {message && (
        <p
          className={`mt-3 rounded-xl px-4 py-3 text-sm ${
            message.type === "ok"
              ? "bg-[var(--color-brand-50)] text-[var(--color-brand-700)]"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </p>
      )}

      <button
        onClick={handleRequest}
        disabled={!canRequest || pending}
        className="mt-4 w-full rounded-full bg-[var(--color-brand-500)] px-6 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
      >
        {pending ? t.requesting : t.request}
      </button>
    </section>
  );
}
