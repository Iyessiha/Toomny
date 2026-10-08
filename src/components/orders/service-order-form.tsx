"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createOrder } from "@/app/(fr)/orders/actions";
import { getCatalogTexts } from "@/i18n/catalog";
import type { Locale } from "@/i18n/dictionaries";

export function ServiceOrderForm({ serviceId, locale = "fr" }: { serviceId: string; locale?: Locale }) {
  const t = getCatalogTexts(locale);
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const requirements = String(new FormData(e.currentTarget).get("requirements") ?? "");
    setPending(true);
    setError(null);
    const result = await createOrder({ serviceId, requirements });
    if ("error" in result) {
      setPending(false);
      setError(result.error);
      return;
    }
    router.push(`/orders/${result.orderId}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label htmlFor="requirements" className="text-sm font-medium">{t.orderNeed}</label>
      <textarea
        id="requirements"
        name="requirements"
        required
        minLength={10}
        maxLength={2000}
        rows={5}
        placeholder={t.orderPlaceholder}
        className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none focus:border-[var(--color-brand-500)]"
      />
      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={pending} className="w-full rounded-full bg-[var(--color-brand-500)] px-6 py-3.5 text-sm font-semibold text-white disabled:opacity-60">
        {pending ? t.ordering : t.order}
      </button>
      <p className="text-xs text-[var(--subtle)]">{t.orderNote}</p>
    </form>
  );
}
