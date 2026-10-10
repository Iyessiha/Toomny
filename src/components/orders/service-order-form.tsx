"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createOrder } from "@/app/(fr)/orders/actions";
import { getCatalogTexts } from "@/i18n/catalog";
import { formatMoney } from "@/lib/money";
import type { Locale } from "@/i18n/dictionaries";

export type ServicePackage = {
  id: string;
  tier: 1 | 2 | 3;
  name: string;
  description: string | null;
  price_minor: number;
  delivery_days: number;
  currency: string;
};

export function ServiceOrderForm({
  serviceId,
  locale = "fr",
  packages = [],
}: {
  serviceId: string;
  locale?: Locale;
  packages?: ServicePackage[];
}) {
  const t = getCatalogTexts(locale);
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPkg, setSelectedPkg] = useState<ServicePackage | null>(
    packages.length > 0 ? packages[0] : null
  );

  const tierLabel = (tier: 1 | 2 | 3) =>
    tier === 1 ? t.pkgBasic : tier === 2 ? t.pkgStandard : t.pkgPremium;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const requirements = String(new FormData(e.currentTarget).get("requirements") ?? "");
    setPending(true);
    setError(null);
    const result = await createOrder({
      serviceId,
      requirements,
      packageId: selectedPkg?.id,
    });
    if ("error" in result) {
      setPending(false);
      setError(result.error);
      return;
    }
    router.push(`/orders/${result.orderId}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {/* Package selector */}
      {packages.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--subtle)]">
            {locale === "fr" ? "Forfait" : "Package"}
          </p>
          <div className="flex flex-col gap-2">
            {packages.map((pkg) => (
              <button
                key={pkg.id}
                type="button"
                onClick={() => setSelectedPkg(pkg)}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                  selectedPkg?.id === pkg.id
                    ? "border-[var(--color-brand-500)] bg-[var(--color-brand-50)] text-[var(--color-brand-700)]"
                    : "border-[var(--border)] hover:border-[var(--color-brand-300)]"
                }`}
              >
                <div className="min-w-0">
                  <p className="font-semibold">{tierLabel(pkg.tier)} · {pkg.name}</p>
                  {pkg.description && (
                    <p className="mt-0.5 truncate text-xs text-[var(--subtle)]">{pkg.description}</p>
                  )}
                  <p className="mt-0.5 text-xs text-[var(--subtle)]">
                    {t.pkgDelivery} {pkg.delivery_days} {pkg.delivery_days > 1 ? t.days : t.day}
                  </p>
                </div>
                <p className="ml-4 shrink-0 font-display text-base font-bold text-[var(--color-brand-600)]">
                  {formatMoney(BigInt(pkg.price_minor), pkg.currency, locale)}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

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
