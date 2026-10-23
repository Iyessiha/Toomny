"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/dictionaries";
import { SHARE_NETWORKS, shareHref, trackedUrl, type ShareNetwork } from "@/lib/share-links";

export type SharableService = { id: string; title: string; priceLabel: string };

type Props = {
  services: SharableService[];
  locale: Locale;
  siteUrl: string;
};

const COPY = {
  fr: {
    title: "Partagez vos prestations",
    lead: "Chaque partage est une visite possible sur votre prestation. Partagez-la où vos clients se trouvent.",
    message: (title: string, price: string) => `Découvrez ma prestation « ${title} » sur Toomny (${price}).`,
    copy: "Copier le lien",
    copied: "Lien copié",
    networks: { whatsapp: "WhatsApp", facebook: "Facebook", x: "X", linkedin: "LinkedIn", telegram: "Telegram" },
  },
  en: {
    title: "Share your services",
    lead: "Every share can bring a visit to your service. Share it where your clients are.",
    message: (title: string, price: string) => `Discover my service "${title}" on Toomny (${price}).`,
    copy: "Copy link",
    copied: "Link copied",
    networks: { whatsapp: "WhatsApp", facebook: "Facebook", x: "X", linkedin: "LinkedIn", telegram: "Telegram" },
  },
} as const;

/** Lien public d'une prestation, marqué par réseau pour mesurer ce qui amène des commandes. */
function serviceUrl(siteUrl: string, id: string, network: string): string {
  return trackedUrl(`${siteUrl}/services/${id}`, network, "provider_share", "service_share");
}

/** Bloc du tableau de bord : partager chaque prestation publiée sur les réseaux, en un clic. */
export function ShareServices({ services, locale, siteUrl }: Props) {
  const t = COPY[locale];
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (services.length === 0) return null;

  async function copy(id: string) {
    try {
      await navigator.clipboard.writeText(serviceUrl(siteUrl, id, "copy"));
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Presse-papiers indisponible : rien à afficher de plus.
    }
  }

  return (
    <section aria-labelledby="share-services" className="mb-8 rounded-3xl border border-[var(--border)] bg-white p-6">
      <h2 id="share-services" className="font-display text-lg font-bold">{t.title}</h2>
      <p className="mt-1 text-sm text-[var(--subtle)]">{t.lead}</p>

      <ul className="mt-5 divide-y divide-[var(--border)]">
        {services.map((s) => {
          const text = t.message(s.title, s.priceLabel);
          return (
            <li key={s.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate font-semibold">{s.title}</p>
                <p className="text-sm text-[var(--subtle)]">{s.priceLabel}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {SHARE_NETWORKS.map((network: ShareNetwork) => (
                  <a
                    key={network}
                    href={shareHref(network, serviceUrl(siteUrl, s.id, network), text)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold hover:border-[var(--color-brand-500)] hover:text-[var(--color-brand-600)]"
                  >
                    {t.networks[network]}
                  </a>
                ))}
                <button
                  type="button"
                  onClick={() => copy(s.id)}
                  className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold hover:border-[var(--color-brand-500)] hover:text-[var(--color-brand-600)]"
                >
                  {copiedId === s.id ? t.copied : t.copy}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
