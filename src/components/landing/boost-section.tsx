import Link from "next/link";
import type { Locale } from "@/i18n/dictionaries";

const CONTENT = {
  fr: {
    eyebrow: "Pour les prestataires",
    title: "Boostez votre visibilité",
    lead: "Apparaissez en tête du catalogue, marquez vos services d'un badge prioritaire et décrouchez plus de commandes.",
    tiers: [
      {
        name: "Boost Starter",
        price: "5 000 FCFA",
        period: "/mois",
        perks: [
          "Badge prioritaire sur vos services",
          "Remontée dans le catalogue",
        ],
        cta: "Activer",
        highlight: false,
      },
      {
        name: "Boost Pro",
        price: "10 000 FCFA",
        period: "/mois",
        badge: "Populaire",
        perks: [
          "Badge prioritaire sur vos services",
          "Remontée dans le catalogue",
          "Mise en avant dans la recherche",
        ],
        cta: "Activer",
        highlight: true,
      },
      {
        name: "Boost Elite",
        price: "18 000 FCFA",
        period: "/mois",
        perks: [
          "Badge prioritaire sur vos services",
          "Remontée dans le catalogue",
          "Mise en avant dans la recherche",
          "Affiché sur la page d'accueil",
        ],
        cta: "Activer",
        highlight: false,
      },
    ],
    note: "Le Boost s'ajoute à votre plan de base et se renouvelle tous les 30 jours. Résiliable à tout moment.",
    cta: "Gérer mon Boost →",
  },
  en: {
    eyebrow: "For providers",
    title: "Boost your visibility",
    lead: "Appear at the top of the catalogue, mark your services with a priority badge, and land more orders.",
    tiers: [
      {
        name: "Boost Starter",
        price: "5,000 XOF",
        period: "/month",
        perks: [
          "Priority badge on your services",
          "Moved up in the catalogue",
        ],
        cta: "Activate",
        highlight: false,
      },
      {
        name: "Boost Pro",
        price: "10,000 XOF",
        period: "/month",
        badge: "Popular",
        perks: [
          "Priority badge on your services",
          "Moved up in the catalogue",
          "Featured in search results",
        ],
        cta: "Activate",
        highlight: true,
      },
      {
        name: "Boost Elite",
        price: "18,000 XOF",
        period: "/month",
        perks: [
          "Priority badge on your services",
          "Moved up in the catalogue",
          "Featured in search results",
          "Displayed on the home page",
        ],
        cta: "Activate",
        highlight: false,
      },
    ],
    note: "Boost is an add-on on top of your base plan, renewed every 30 days. Cancel anytime.",
    cta: "Manage my Boost →",
  },
};

export function BoostSection({ locale = "fr" }: { locale?: Locale }) {
  const t = CONTENT[locale];

  return (
    <section className="border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        {/* Header */}
        <div data-reveal className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-brand-600)]">
            {t.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">{t.title}</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-[var(--subtle)]">
            {t.lead}
          </p>
        </div>

        {/* Tier cards */}
        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {t.tiers.map((tier) => (
            <div
              key={tier.name}
              data-reveal
              className={`relative flex flex-col rounded-2xl p-6 text-white transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/30 ${
                tier.highlight
                  ? "border border-[rgba(34,197,94,0.35)] bg-[linear-gradient(160deg,rgba(22,163,74,0.22)_0%,rgba(11,25,18,0.92)_60%)] shadow-[0_0_0_1px_rgba(34,197,94,0.15),0_24px_56px_rgba(0,0,0,0.35)]"
                  : "border border-[rgba(255,255,255,0.07)] bg-[rgba(11,25,18,0.85)]"
              }`}
            >
              {"badge" in tier && tier.badge && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#22c55e] px-3.5 py-1 text-xs font-bold text-white shadow-[0_4px_16px_rgba(34,197,94,0.4)]">
                  {tier.badge}
                </span>
              )}

              {/* Name */}
              <p className={`font-display text-lg font-bold ${tier.highlight ? "text-[#4ade80]" : "text-white"}`}>
                {tier.name}
              </p>

              {/* Price */}
              <div className="mt-4">
                <span className="font-display text-2xl font-bold text-white">{tier.price}</span>
                <span className="ml-1 text-sm text-white/55">{tier.period}</span>
              </div>

              {/* Perks */}
              <ul className="mt-5 flex-1 space-y-2.5">
                {tier.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2.5 text-sm">
                    <svg
                      className="mt-0.5 shrink-0 text-[#22c55e]"
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="currentColor"
                      aria-hidden
                    >
                      <path d="M11.854 3.646a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L5.5 9.293l5.646-5.647a.5.5 0 0 1 .708 0Z" />
                    </svg>
                    <span className="text-white/70">{perk}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href="/auth?role=provider"
                className={`mt-7 block rounded-full px-4 py-3 text-center text-sm font-semibold transition-all duration-150 ${
                  tier.highlight
                    ? "bg-[#22c55e] text-white shadow-[0_4px_16px_rgba(34,197,94,0.35)] hover:bg-[#16a34a] hover:-translate-y-px"
                    : "border border-[rgba(34,197,94,0.3)] text-[#22c55e] hover:bg-[rgba(34,197,94,0.08)]"
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        <p data-reveal className="mt-6 text-center text-xs text-[var(--subtle)]">
          {t.note}
        </p>
      </div>
    </section>
  );
}
