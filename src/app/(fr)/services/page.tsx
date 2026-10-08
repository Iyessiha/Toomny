import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { getCategories, getServices, categoryName } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";
import { categoryMeta } from "@/lib/categories";
import { getCatalogTexts } from "@/i18n/catalog";
import { visitorLocale } from "@/i18n/server-locale";

export async function generateMetadata(): Promise<Metadata> {
  const t = getCatalogTexts(await visitorLocale());
  return { title: t.listMetaTitle, description: t.listMetaDescription };
}

export const dynamic = "force-dynamic";

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string }>;
}) {
  const locale = await visitorLocale();
  const t = getCatalogTexts(locale);
  const { categorie } = await searchParams;
  const [categories, services] = await Promise.all([getCategories(), getServices(categorie)]);
  const active = categories.find((c) => c.slug === categorie);

  return (
    <>
      <Header locale={locale} />

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
            {active ? categoryName(active, locale) : t.listTitle}
          </h1>
          {active && categoryMeta(active.slug) && (
            <p className="mt-3 text-base text-[var(--subtle)]">
              {locale === "en" ? categoryMeta(active.slug)?.blurbEn : categoryMeta(active.slug)?.blurbFr}
            </p>
          )}
          <p className="mt-4 text-lg leading-relaxed text-[var(--subtle)]">{t.listLead}</p>
        </div>

        <nav className="mt-8 flex flex-wrap gap-2" aria-label={t.filterLabel}>
          <Link
            href="/services"
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              !categorie
                ? "border-[var(--color-brand-500)] bg-[var(--color-brand-500)] text-white"
                : "border-[var(--border)] text-[var(--subtle)] hover:border-[var(--color-brand-300)] hover:text-[var(--foreground)]"
            }`}
          >
            {t.all}
          </Link>
          {categories.map((c) => {
            const Icon = categoryMeta(c.slug)?.icon;
            return (
              <Link
                key={c.id}
                href={`/services?categorie=${c.slug}`}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  categorie === c.slug
                    ? "border-[var(--color-brand-500)] bg-[var(--color-brand-500)] text-white"
                    : "border-[var(--border)] text-[var(--subtle)] hover:border-[var(--color-brand-300)] hover:text-[var(--foreground)]"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  {Icon && <Icon className="h-4 w-4" aria-hidden />}
                  {categoryName(c, locale)}
                </span>
              </Link>
            );
          })}
        </nav>

        {services.length > 0 ? (
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <li
                key={s.id}
                className="group flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-brand-300)] hover:shadow-lg hover:shadow-black/[0.04]"
              >
                <h2 className="font-display text-base font-bold leading-snug">
                  <Link href={`/services/${s.id}`} className="hover:underline">{s.title}</Link>
                </h2>
                <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-[var(--subtle)]">{s.description}</p>
                <div className="mt-5 flex items-end justify-between border-t border-[var(--border)] pt-4">
                  <div>
                    <p className="text-xs text-[var(--subtle)]">
                      {s.provider?.display_name ?? t.provider}
                      {s.provider?.country_code ? ` · ${s.provider.country_code}` : ""}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--subtle)]">
                      {t.delivery} {s.delivery_days} {s.delivery_days > 1 ? t.days : t.day}
                    </p>
                  </div>
                  <p className="font-display text-base font-bold text-[var(--color-brand-600)]">
                    {formatMoney(BigInt(s.price_minor), s.currency, locale)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-12 rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-16 text-center">
            <h2 className="font-display text-xl font-bold">{active ? t.emptyCategory : t.emptyAll}</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--subtle)]">{t.emptyBody}</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href="/auth?role=provider"
                className="rounded-full bg-[var(--color-brand-500)] px-6 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.03] active:scale-95"
              >
                {t.publish}
              </Link>
              {active && (
                <Link href="/services" className="rounded-full border border-[var(--border)] px-6 py-3 text-sm font-semibold transition-colors hover:bg-[var(--background)]">
                  {t.allCategories}
                </Link>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer locale={locale} />
    </>
  );
}
