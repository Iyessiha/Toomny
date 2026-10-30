import type { Metadata } from "next";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ProviderCard } from "@/components/providers/provider-card";
import { listPublicProviders } from "@/lib/provider-cards";
import { filterProviders } from "@/lib/provider-search";
import { visitorLocale } from "@/i18n/server-locale";
import { getCatalogTexts } from "@/i18n/catalog";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = getCatalogTexts(await visitorLocale());
  return {
    title: t.providersPageTitle,
    description: t.providersPageSubtitle,
    alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://toomny.com"}/prestataires` },
  };
}

export default async function ProvidersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const locale = await visitorLocale();
  const t = getCatalogTexts(locale);
  const { q: rawQ = "" } = await searchParams;
  const query = rawQ.slice(0, 80);

  const all = await listPublicProviders(t.detailProvider);
  const rows = filterProviders(all, query);
  return (
    <>
      <Header locale={locale} />
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <header className="mb-8 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-brand-600)]">{t.providersKicker}</p>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">{t.providersPageTitle}</h1>
          <p className="mt-2 text-[var(--subtle)]">{t.providersPageSubtitle}</p>
        </header>

        <form action="/prestataires" method="get" className="mb-8 flex gap-2">
          <input
            name="q"
            defaultValue={query}
            placeholder={t.providersSearchPlaceholder}
            aria-label={t.providersSearchPlaceholder}
            className="input flex-1"
          />
          <button type="submit" className="btn-primary">{t.providersSearchButton}</button>
        </form>

        {rows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--border)] p-10 text-center text-sm text-[var(--subtle)]">
            {query ? t.providersNoResult : t.providersEmpty}
          </p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((p) => (
              <li key={p.id}>
                <ProviderCard p={p} locale={locale} />
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer locale={locale} />
    </>
  );
}
