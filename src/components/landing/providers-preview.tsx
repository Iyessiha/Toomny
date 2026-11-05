import Link from "next/link";
import { ProviderCard } from "@/components/providers/provider-card";
import { ProvidersSlider } from "@/components/providers/provider-slider";
import { listPublicProviders } from "@/lib/provider-cards";
import { getCatalogTexts } from "@/i18n/catalog";
import type { Locale } from "@/i18n/dictionaries";

const MAX_IN_SLIDER = 8;

/** Aperçu des prestataires sur la landing : carrousel lent, boostés et mieux notés d'abord. */
export async function ProvidersPreview({ locale }: { locale: Locale }) {
  const t = getCatalogTexts(locale);
  const providers = (await listPublicProviders(t.detailProvider)).slice(0, MAX_IN_SLIDER);
  if (providers.length === 0) return null;

  const prev = locale === "en" ? "Previous" : "Précédent";
  const next = locale === "en" ? "Next" : "Suivant";

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

        <div data-reveal className="mt-10">
          <ProvidersSlider label={t.providersPageTitle} prevLabel={prev} nextLabel={next}>
            {providers.map((p) => (
              <ProviderCard key={p.id} p={p} locale={locale} />
            ))}
          </ProvidersSlider>
        </div>
      </div>
    </section>
  );
}
