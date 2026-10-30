import Link from "next/link";
import { ProviderCard } from "@/components/providers/provider-card";
import { listPublicProviders } from "@/lib/provider-cards";
import { getCatalogTexts } from "@/i18n/catalog";
import type { Locale } from "@/i18n/dictionaries";

/** Aperçu des prestataires sur la landing : boostés et mieux notés d'abord, lien vers la liste complète. */
export async function ProvidersPreview({ locale }: { locale: Locale }) {
  const t = getCatalogTexts(locale);
  const providers = (await listPublicProviders(t.detailProvider)).slice(0, 6);
  if (providers.length === 0) return null;

  return (
    <section className="border-t border-[var(--border)] bg-[var(--background)]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <div data-reveal className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-brand-600)]">{t.providersKicker}</p>
            <h2 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">{t.providersPageTitle}</h2>
            <p className="mt-1 max-w-xl text-sm text-[var(--subtle)]">{t.providersPageSubtitle}</p>
          </div>
          <Link href="/prestataires" className="shrink-0 text-sm font-semibold text-[var(--color-brand-600)] hover:underline">
            {t.providersSeeAll} →
          </Link>
        </div>

        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((p) => (
            <li key={p.id} data-reveal>
              <ProviderCard p={p} locale={locale} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
