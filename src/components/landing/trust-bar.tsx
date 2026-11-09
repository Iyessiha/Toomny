import { getTrustStats, TRUST_THRESHOLDS } from "@/lib/landing-stats";
import { TrustCarousel, type TrustPoint } from "./trust-carousel";
import type { Locale } from "@/i18n/dictionaries";

const COPY = {
  fr: {
    label: "Nos garanties",
    prev: "Garantie précédente",
    next: "Garantie suivante",
    points: [
      { title: "Paiement conservé", body: "Votre argent sera retenu jusqu'à la validation de la livraison, dès l'ouverture des paiements." },
      { title: "Prestations vérifiées", body: "Chaque prestataire présente une pièce d'identité contrôlée avant de publier." },
      { title: "Litige arbitré", body: "Un humain tranche, en français, à partir des échanges conservés." },
      { title: "Mobile money et carte", body: "Payez en FCFA par mobile money (Wave, Orange Money, MTN, Moov) ou par carte bancaire." },
    ] satisfies TrustPoint[],
    stats: { completedOrders: "commandes livrées", reviews: "avis clients" },
  },
  en: {
    label: "Our guarantees",
    prev: "Previous guarantee",
    next: "Next guarantee",
    points: [
      { title: "Payment held", body: "Your money will be held until you approve, once payments open." },
      { title: "Verified services", body: "Every provider presents a checked ID document before publishing." },
      { title: "Dispute settled", body: "A person decides, in French, from the exchanges kept on the platform." },
      { title: "Mobile money and card", body: "Pay in XOF by mobile money (Wave, Orange Money, MTN, Moov) or by bank card." },
    ] satisfies TrustPoint[],
    stats: { completedOrders: "orders delivered", reviews: "client reviews" },
  },
} as const;

/** Garanties sous le héros, en carrousel. Les chiffres ne s'affichent qu'au-dessus d'un seuil. */
export async function TrustBar({ locale }: { locale: Locale }) {
  const t = COPY[locale];
  const stats = await getTrustStats();
  const shown = (Object.keys(TRUST_THRESHOLDS) as (keyof typeof TRUST_THRESHOLDS)[]).filter(
    (key) => stats[key] >= TRUST_THRESHOLDS[key],
  );

  return (
    <section className="border-b border-[var(--border)] bg-[var(--background)]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <TrustCarousel items={[...t.points]} label={t.label} prevLabel={t.prev} nextLabel={t.next} />
        {shown.length > 0 && (
          <dl className="mt-6 flex flex-wrap justify-center gap-x-10 gap-y-3 border-t border-[var(--border)] pt-5">
            {shown.map((key) => (
              <div key={key} className="flex items-baseline gap-2">
                <dt className="sr-only">{t.stats[key]}</dt>
                <dd className="font-display text-2xl font-extrabold text-[var(--brand-text-1)]">{stats[key].toLocaleString(locale === "en" ? "en-GB" : "fr-FR")}</dd>
                <span className="text-sm text-[var(--subtle)]">{t.stats[key]}</span>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}
