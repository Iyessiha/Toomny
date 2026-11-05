"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createOrder } from "@/app/(fr)/orders/actions";
import { getCatalogTexts } from "@/i18n/catalog";
import { formatMoney } from "@/lib/money";
import { getAddonTexts } from "@/i18n/addons";
import type { Locale } from "@/i18n/dictionaries";

type Pkg = {
  id: string;
  tier: 1 | 2 | 3;
  name: string;
  description: string | null;
  price_minor: number;
  delivery_days: number;
  currency: string;
};

type AddonItem = {
  id: string;
  title: string;
  description: string | null;
  price_minor: number;
  currency: string;
  extra_delivery_days: number;
};

type TrustItem = { icon: string; label: string };
type ProviderService = { id: string; title: string; price_minor: number; currency: string };

export function ServiceSidebar({
  serviceId,
  providerId,
  providerName,
  packages,
  addons = [],
  basePrice,
  baseCurrency,
  baseDelivery,
  locale = "fr",
  isGuest,
  isOwner,
  trustItems,
  providerServices = [],
}: {
  serviceId: string;
  providerId: string;
  providerName?: string;
  packages: Pkg[];
  addons?: AddonItem[];
  basePrice: number;
  baseCurrency: string;
  baseDelivery: number;
  locale?: Locale;
  isGuest: boolean;
  isOwner: boolean;
  trustItems: TrustItem[];
  providerServices?: ProviderService[];
}) {
  const t = getCatalogTexts(locale);
  const router = useRouter();

  const [selectedPkg, setSelectedPkg] = useState<Pkg | null>(
    packages.length > 0 ? packages[0] : null
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const chosenAddons = addons.filter((a) => selectedAddonIds.includes(a.id));
  const addonsPrice = chosenAddons.reduce((sum, a) => sum + a.price_minor, 0);
  const addonsDays = chosenAddons.reduce((sum, a) => sum + a.extra_delivery_days, 0);

  const displayPrice = (selectedPkg ? selectedPkg.price_minor : basePrice) + addonsPrice;
  const displayCurrency = selectedPkg ? selectedPkg.currency : baseCurrency;
  const displayDelivery = (selectedPkg ? selectedPkg.delivery_days : baseDelivery) + addonsDays;

  function toggleAddon(id: string) {
    setSelectedAddonIds((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));
  }

  const tierLabel = (tier: 1 | 2 | 3) =>
    tier === 1 ? t.pkgBasic : tier === 2 ? t.pkgStandard : t.pkgPremium;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await createOrder({
      serviceId,
      requirements: "",
      packageId: selectedPkg?.id,
      addonIds: selectedAddonIds,
    });
    if ("error" in result) {
      setPending(false);
      setError(result.error);
      return;
    }
    router.push(`/orders/${result.orderId}`);
  }

  return (
    <>
      {/* Pricing + CTA card */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]">

        {/* Package tabs (Fiverr-style) */}
        {packages.length > 0 && (
          <div className="flex border-b border-[var(--border)]">
            {packages.map((pkg) => (
              <button
                key={pkg.id}
                type="button"
                onClick={() => setSelectedPkg(pkg)}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                  selectedPkg?.id === pkg.id
                    ? "border-b-2 border-[var(--color-brand-500)] text-[var(--color-brand-600)]"
                    : "text-[var(--subtle)] hover:text-[var(--foreground)]"
                }`}
              >
                {tierLabel(pkg.tier)}
              </button>
            ))}
          </div>
        )}

        {/* Dynamic price + delivery */}
        <div className="border-b border-[var(--border)] px-6 pb-4 pt-5">
          {selectedPkg && (
            <p className="mb-1 text-sm font-semibold">{selectedPkg.name}</p>
          )}
          <p className="font-display text-3xl font-bold text-[var(--color-brand-600)]">
            {formatMoney(BigInt(displayPrice), displayCurrency, locale)}
          </p>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-[var(--subtle)]">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {locale === "en" ? "Delivery in" : "Livraison en"}{" "}
            <strong className="font-semibold text-[var(--foreground)]">{displayDelivery}</strong>{" "}
            {displayDelivery > 1 ? t.days : t.day}
          </p>
          {selectedPkg?.description && (
            <p className="mt-3 text-sm leading-relaxed text-[var(--subtle)]">
              {selectedPkg.description}
            </p>
          )}
        </div>

        {/* Suppléments : options cochées, le total et le délai se mettent à jour */}
        {addons.length > 0 && (
          <div className="space-y-2 border-b border-[var(--border)] px-6 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--subtle)]">
              {getAddonTexts(locale).clientTitle}
            </p>
            {addons.map((addon) => {
              const checked = selectedAddonIds.includes(addon.id);
              return (
                <label
                  key={addon.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-2.5 text-sm transition-colors ${
                    checked
                      ? "border-[var(--color-brand-500)] bg-[var(--color-brand-50)]"
                      : "border-[var(--border)] hover:border-[var(--color-brand-300)]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleAddon(addon.id)}
                    className="mt-0.5 h-4 w-4 accent-[var(--color-brand-500)]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{addon.title}</span>
                    {addon.description && (
                      <span className="mt-0.5 block text-xs text-[var(--subtle)]">{addon.description}</span>
                    )}
                    {addon.extra_delivery_days > 0 && (
                      <span className="mt-0.5 block text-xs text-[var(--subtle)]">
                        +{addon.extra_delivery_days} {addon.extra_delivery_days > 1 ? t.days : t.day}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 font-display text-sm font-bold text-[var(--color-brand-600)]">
                    +{formatMoney(BigInt(addon.price_minor), addon.currency, locale)}
                  </span>
                </label>
              );
            })}
          </div>
        )}

        {/* Action zone */}
        <div className="space-y-3 p-6">
          {isGuest ? (
            <Link
              href="/auth"
              className="flex items-center justify-center gap-2 rounded-full bg-[var(--color-brand-500)] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-brand-600)]"
            >
              {t.loginToOrder}
            </Link>
          ) : isOwner ? (
            <p className="text-center text-sm text-[var(--subtle)]">{t.ownService}</p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-3">
              {error && (
                <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-full bg-[var(--color-brand-500)] px-6 py-3.5 text-sm font-semibold text-white disabled:opacity-60 transition-colors hover:bg-[var(--color-brand-600)]"
              >
                {pending ? t.ordering : t.order}
              </button>
              <p className="text-xs text-[var(--subtle)]">{t.orderNote}</p>
            </form>
          )}

          {!isOwner && (
            <>
              <Link
                href={`/services/${serviceId}/contact`}
                className="flex items-center justify-center gap-2 rounded-full border border-[var(--color-brand-300)] px-6 py-3 text-sm font-semibold text-[var(--color-brand-600)] transition-colors hover:bg-[var(--color-brand-50)]"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                {t.contactSeller}
              </Link>
              <Link
                href={`/prestataires/${providerId}`}
                className="flex items-center justify-center gap-2 rounded-full border border-[var(--border)] px-6 py-3 text-sm font-semibold transition-colors hover:border-[var(--color-brand-400)] hover:text-[var(--color-brand-600)]"
              >
                {locale === "en" ? "View profile" : "Voir le profil"}
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Trust badges */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <ul className="space-y-3">
          {trustItems.map((item) => (
            <li key={item.label} className="flex items-start gap-3 text-sm">
              <span aria-hidden className="mt-0.5 text-base">{item.icon}</span>
              <span className="leading-snug text-[var(--subtle)]">{item.label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Autres services du prestataire */}
      {providerServices.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
          <p className="mb-3 text-sm font-semibold">
            {locale === "en"
              ? `More from ${providerName ?? "this seller"}`
              : `Autres prestations de ${providerName ?? "ce prestataire"}`}
          </p>
          <ul className="space-y-2">
            {providerServices.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/services/${s.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm transition-colors hover:border-[var(--color-brand-300)] hover:bg-[var(--background)]"
                >
                  <span className="line-clamp-1 flex-1 font-medium leading-snug">
                    {s.title}
                  </span>
                  <span className="shrink-0 font-semibold text-[var(--color-brand-600)]">
                    {formatMoney(BigInt(s.price_minor), s.currency, locale)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href={`/prestataires/${providerId}`}
            className="mt-3 block text-center text-xs font-semibold text-[var(--color-brand-600)] hover:underline"
          >
            {locale === "en" ? "View all services →" : "Voir toutes les prestations →"}
          </Link>
        </div>
      )}
    </>
  );
}
