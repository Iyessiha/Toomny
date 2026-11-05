import Link from "next/link";
import { getBoostedServices, getServices } from "@/lib/catalog";
import { interleaveByProvider } from "@/lib/interleave";
import { ServiceCard } from "@/components/catalog/service-card";
import type { Locale } from "@/i18n/dictionaries";

const LABELS = {
  fr: {
    vedetteKicker: "En vedette",
    vedetteTitle: "Prestations mises en avant",
    vedetteSubtitle: "Des prestataires qui ont choisi la visibilité maximale.",
    title: "Services populaires",
    subtitle: "Les prestations les plus demandées sur Toomny",
    all: "Voir tout le catalogue →",
  },
  en: {
    vedetteKicker: "Featured",
    vedetteTitle: "Highlighted services",
    vedetteSubtitle: "Providers who chose maximum visibility.",
    title: "Popular services",
    subtitle: "The most requested services on Toomny",
    all: "Browse the full catalogue →",
  },
};

/**
 * Deux blocs : les prestations boostées en vedette, puis les services populaires
 * mélangés pour qu'un même prestataire ne s'aligne pas avec lui-même.
 */
export async function FeaturedServices({ locale }: { locale: Locale }) {
  const t = LABELS[locale];
  const [vedette, all] = await Promise.all([getBoostedServices(4), getServices({ sort: "recent" })]);

  const vedetteIds = new Set(vedette.map((s) => s.id));
  const popular = interleaveByProvider(
    all.filter((s) => !vedetteIds.has(s.id)),
    (s) => s.provider?.id ?? s.id,
  ).slice(0, 8);

  if (vedette.length === 0 && popular.length === 0) return null;

  return (
    <>
      {vedette.length > 0 && (
        <section className="border-t border-[var(--border)] bg-[var(--background)]">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
            <div data-reveal className="mb-8">
              <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                {t.vedetteKicker}
              </p>
              <h2 className="text-2xl font-bold leading-tight sm:text-3xl">{t.vedetteTitle}</h2>
              <p className="mt-1 text-sm text-[var(--subtle)]">{t.vedetteSubtitle}</p>
            </div>
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {vedette.map((s) => (
                <li key={s.id} data-reveal>
                  <ServiceCard service={s} locale={locale} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {popular.length > 0 && (
        <section className="border-t border-[var(--border)] bg-[var(--surface)]">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
            <div data-reveal className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold leading-tight sm:text-3xl">{t.title}</h2>
                <p className="mt-1 text-sm text-[var(--subtle)]">{t.subtitle}</p>
              </div>
              <Link href="/services" className="shrink-0 text-sm font-semibold text-[var(--color-brand-600)] hover:underline">
                {t.all}
              </Link>
            </div>

            <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {popular.map((s) => (
                <li key={s.id} data-reveal>
                  <ServiceCard service={s} locale={locale} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
