"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { sendMessage } from "@/app/(fr)/orders/actions";
import { getDashboardTexts } from "@/i18n/dashboard";
import type { Locale } from "@/i18n/dictionaries";

export function MessageForm({ orderId, locale = "fr" }: { orderId: string; locale?: Locale }) {
  const t = getDashboardTexts(locale).orders;
  const router = useRouter();
  const ref = useRef<HTMLTextAreaElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = ref.current?.value ?? "";
    setPending(true);
    setError(null);
    const result = await sendMessage({ orderId, body });
    setPending(false);
    if ("error" in result) {
      setError(result.error ?? null);
      return;
    }
    if (ref.current) ref.current.value = "";
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <textarea
        ref={ref}
        required
        rows={3}
        maxLength={2000}
        placeholder={t.messagePlaceholder}
        className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none focus:border-[var(--color-brand-500)]"
      />
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={pending} className="rounded-full bg-[var(--color-brand-500)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
        {pending ? t.sending : t.send}
      </button>
    </form>
  );
}
