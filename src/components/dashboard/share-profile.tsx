import { SHARE_NETWORKS, shareHref, trackedUrl, type ShareNetwork } from "@/lib/share-links";
import type { Locale } from "@/i18n/dictionaries";

const COPY = {
  fr: {
    title: "Partagez votre profil",
    lead: "Votre profil regroupe toutes vos prestations, vos avis et vos réalisations. Partagez-le là où vos clients sont.",
    message: (name: string) => `Découvrez le profil de ${name} sur Toomny : prestations, avis et réalisations.`,
    networks: { whatsapp: "WhatsApp", facebook: "Facebook", x: "X", linkedin: "LinkedIn", telegram: "Telegram" },
  },
  en: {
    title: "Share your profile",
    lead: "Your profile gathers all your services, reviews and work. Share it where your clients are.",
    message: (name: string) => `Discover ${name}'s profile on Toomny: services, reviews and work.`,
    networks: { whatsapp: "WhatsApp", facebook: "Facebook", x: "X", linkedin: "LinkedIn", telegram: "Telegram" },
  },
} as const;

/** Partage du profil prestataire, suivi par réseau (medium provider_share, campagne profile_share). */
export function ShareProfile({ locale, siteUrl, profileUrl, name }: { locale: Locale; siteUrl: string; profileUrl: string; name: string }) {
  const t = COPY[locale];
  const base = profileUrl.startsWith("http") ? profileUrl : `${siteUrl}${profileUrl}`;
  const message = t.message(name);
  return (
    <section className="rounded-3xl border border-[var(--border)] bg-white p-6">
      <h2 className="font-display text-base font-bold">{t.title}</h2>
      <p className="mt-1 text-sm text-[var(--subtle)]">{t.lead}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {SHARE_NETWORKS.map((network: ShareNetwork) => (
          <a
            key={network}
            href={shareHref(network, trackedUrl(base, network, "provider_share", "profile_share"), message)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-[var(--border)] px-3.5 py-2 text-xs font-semibold hover:border-[var(--color-brand-500)] hover:text-[var(--color-brand-600)]"
          >
            {t.networks[network]}
          </a>
        ))}
      </div>
    </section>
  );
}
