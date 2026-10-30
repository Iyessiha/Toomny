import { getTrustStats, TRUST_THRESHOLDS } from "@/lib/landing-stats";
import type { Locale } from "@/i18n/dictionaries";

const COPY = {
  fr: {
    points: [
      { title: "Paiement conservé", body: "Votre argent est retenu jusqu'à la validation de la livraison." },
      { title: "Prestataires vérifiés", body: "Pièce d'identité contrôlée avant la publication." },
      { title: "Litiges arbitrés", body: "Un humain tranche, en français, à partir des échanges conservés." },
      { title: "Mobile money et carte", body: "Payez en FCFA avec Wave, Orange Money, MTN ou Moov." },
    ],
    stats: { verifiedProviders: "prestataires vérifiés", completedOrders: "commandes livrées", reviews: "avis clients" },
  },
  en: {
    points: [
      { title: "Payment held", body: "Your money is held until you approve the delivery." },
      { title: "Verified providers", body: "ID document checked before publishing." },
      { title: "Disputes settled", body: "A person decides, in French, from the exchanges kept on the platform." },
      { title: "Mobile money and card", body: "Pay in XOF with Wave, Orange Money, MTN or Moov." },
    ],
    stats: { verifiedProviders: "verified providers", completedOrders: "orders delivered", reviews: "client reviews" },
  },
} as const;

/** Bande de confiance sous le héros : garanties réelles, et chiffres seulement quand ils sont crédibles. */
export async function TrustBar({ locale }: { locale: Locale }) {
  const t = COPY[locale];
  const stats = await getTrustStats();
  const shown = (Object.keys(TRUST_THRESHOLDS) as (keyof typeof TRUST_THRESHOLDS)[]).filter(
    (key) => stats[key] >= TRUST_THRESHOLDS[key],
  );

  return (
    <section aria-label={locale === "en" ? "Guarantees" : "Garanties"} className="border-b border-[var(--border)] bg-[var(--background)]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {t.points.map((p) => (
            <li key={p.title} className="flex gap-3">
              <span aria-hidden className="mt-1 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[var(--color-brand-500)] text-xs font-bold text-white">✓</span>
              <div>
                <p className="text-sm font-semibold">{p.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-[var(--subtle)]">{p.body}</p>
              </div>
            </li>
          ))}
        </ul>
        {shown.length > 0 && (
          <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-3 border-t border-[var(--border)] pt-5">
            {shown.map((key) => (
              <div key={key} className="flex items-baseline gap-2">
                <dt className="sr-only">{t.stats[key]}</dt>
                <dd className="font-display text-2xl font-extrabold text-[var(--color-brand-600)]">{stats[key].toLocaleString(locale === "en" ? "en-GB" : "fr-FR")}</dd>
                <span className="text-sm text-[var(--subtle)]">{t.stats[key]}</span>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}
