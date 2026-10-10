import Link from "next/link";
import { getServices } from "@/lib/catalog";
import { ServiceCard } from "@/components/catalog/service-card";
import type { Locale } from "@/i18n/dictionaries";

const LABELS = {
  fr: { title: "Services populaires", subtitle: "Les prestations les plus demandées sur Toomny", all: "Voir tout le catalogue →" },
  en: { title: "Popular services", subtitle: "The most requested services on Toomny", all: "Browse the full catalogue →" },
};

export async function FeaturedServices({ locale }: { locale: Locale }) {
  const services = await getServices({ sort: "recent" });
  const featured = services.slice(0, 8);
  if (featured.length === 0) return null;

  const t = LABELS[locale];

  return (
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
          {featured.map((s) => (
            <li key={s.id} data-reveal className="flex">
              <ServiceCard service={s} locale={locale} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
