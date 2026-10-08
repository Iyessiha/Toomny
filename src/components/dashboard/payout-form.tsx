"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { savePayoutSettings } from "@/app/(fr)/dashboard/versements/actions";
import { getPayoutTexts } from "@/i18n/payouts";
import type { Locale } from "@/i18n/dictionaries";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none focus:border-[var(--color-brand-500)]";

export function PayoutForm({
  locale,
  channel,
  msisdn,
}: {
  locale: Locale;
  channel: string | null;
  msisdn: string | null;
}) {
  const t = getPayoutTexts(locale);
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setSaved(false);
    const result = await savePayoutSettings(new FormData(e.currentTarget));
    setPending(false);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="channel" className="text-sm font-medium">{t.channel}</label>
        <select id="channel" name="channel" defaultValue={channel ?? ""} required className={inputClass}>
          <option value="" disabled>{t.choose}</option>
          {Object.entries(t.channels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="msisdn" className="text-sm font-medium">{t.number}</label>
        <input id="msisdn" name="msisdn" inputMode="tel" required defaultValue={msisdn ?? ""} placeholder="+225 07 00 00 00 00" className={inputClass} />
        <p className="mt-1.5 text-xs text-[var(--subtle)]">{t.numberHint}</p>
      </div>
      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {saved && <p role="status" className="rounded-xl bg-[var(--color-brand-50)] px-4 py-3 text-sm text-[var(--color-brand-700)]">{t.saved}</p>}
      <button type="submit" disabled={pending} className="rounded-full bg-[var(--color-brand-500)] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60">
        {pending ? t.saving : t.save}
      </button>
    </form>
  );
}
