"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestPayout } from "@/app/(fr)/dashboard/versements/actions";
import { getPayoutTexts } from "@/i18n/payouts";
import { Section } from "@/components/dashboard/pro";
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
    <Section title={t.request}>
      <p className="text-sm text-[var(--subtle)]">
        {!hasChannel
          ? t.noChannel
          : availableBig === 0n
          ? t.nothingAvailable
          : formatMoney(availableBig, currency, locale)}
      </p>

      {message && (
        <p className={`notice ${message.type === "ok" ? "notice-success" : "notice-danger"} mt-3`}>
          {message.text}
        </p>
      )}

      <button
        onClick={handleRequest}
        disabled={!canRequest || pending}
        className="btn-primary mt-4 w-full"
      >
        {pending ? t.requesting : t.request}
      </button>
    </Section>
  );
}
