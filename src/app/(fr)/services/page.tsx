import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { getCategories, getServices, categoryName } from "@/lib/catalog";
import { categoryMeta, categoryGradient } from "@/lib/categories";
import { getCatalogTexts } from "@/i18n/catalog";
import { visitorLocale } from "@/i18n/server-locale";
import { ServiceCard } from "@/components/catalog/service-card";
import { CATALOG_PAGE_SIZE } from "@/lib/catalog";

export async function generateMetadata(): Promise<Metadata> {
  const t = getCatalogTexts(await visitorLocale());
  return { title: t.listMetaTitle, description: t.listMetaDescription };
}

export const dynamic = "force-dynamic";

const BUDGET_OPTIONS = [
  { value: "", labelKey: "budgetAll" as const },
  { value: "50000", labelKey: "budget50" as const },
  { value: "200000", labelKey: "budget200" as const },
  { value: "999999999", labelKey: "budget200plus" as const },
];

const DELIVERY_OPTIONS = [
  { value: "", labelKey: "deliveryAll" as const },
  { value: "1", labelKey: "delivery1" as const },
  { value: "3", labelKey: "delivery3" as const },
  { value: "7", labelKey: "delivery7" as const },
  { value: "14", labelKey: "delivery14" as const },
];

function buildUrl(base: Record<string, string | undefined>, override: Record<string, string | undefined>) {
  const merged = { ...base, ...override };
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v) params.set(k, v);
  }
  const s = params.toString();
  return `/services${s ? "?" + s : ""}`;
}

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string; q?: string; sort?: string; budget?: string; jours?: string; page?: string }>;
}) {
  const locale = await visitorLocale();
  const t = getCatalogTexts(locale);
  const { categorie, q, sort, budget, jours, page: pageParam } = await searchParams;

  const maxPrice = budget ? Number(budget) : undefined;
  const maxDays = jours ? Number(jours) : undefined;
  const sortValue = sort === "rating" ? "rating" : "recent";
  const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;

  const [categories, rawServices] = await Promise.all([
    getCategories(),
    getServices({ categorySlug: categorie, q, maxPrice, maxDays, sort: sortValue, page }),
  ]);

  const hasMore = rawServices.length > CATALOG_PAGE_SIZE;
  const services = rawServices.slice(0, CATALOG_PAGE_SIZE);

  const active = categories.find((c) => c.slug === categorie);

  // Chips de filtres actifs
  const currentParams = { categorie, q, sort, budget, jours, page: pageParam };
  const activeChips: { label: string; removeUrl: string }[] = [];
  if (q) activeChips.push({ label: `"${q}"`, removeUrl: buildUrl(currentParams, { q: undefined, page: undefined }) });
  if (budget) {
    const opt = BUDGET_OPTIONS.find((o) => o.value === budget);
    if (opt) activeChips.push({ label: t[opt.labelKey], removeUrl: buildUrl(currentParams, { budget: undefined, page: undefined }) });
  }
  if (jours) {
    const opt = DELIVERY_OPTIONS.find((o) => o.value === jours);
    if (opt) activeChips.push({ label: t[opt.labelKey], removeUrl: buildUrl(currentParams, { jours: undefined, page: undefined }) });
  }
  if (sort && sort !== "recent") {
    activeChips.push({ label: t.sortRating, removeUrl: buildUrl(currentParams, { sort: undefined, page: undefined }) });
  }
  const hasActiveFilters = activeChips.length > 0;

  return (
    <>
      <Header locale={locale} />

      <main className="app-enter min-h-screen">
        {/* Barre de recherche + filtres */}
        <div className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <form method="GET" action="/services" className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:gap-3">
              {/* Champ recherche */}
              <div className="relative flex-1">
                <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--subtle)]" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
                </svg>
                <input
                  type="search"
                  name="q"
                  defaultValue={q}
                  placeholder={t.searchPlaceholder}
                  className="h-10 w-full rounded-full border border-[var(--border)] bg-[var(--surface)] pl-9 pr-4 text-sm outline-none transition focus:border-[var(--color-brand-400)] focus:ring-2 focus:ring-[var(--color-brand-400)]/20"
                />
              </div>

              {/* Tri */}
              <select
                name="sort"
                defaultValue={sort ?? "recent"}
                className="h-10 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none focus:border-[var(--color-brand-400)]"
              >
                <option value="recent">{t.sortRecent}</option>
                <option value="rating">{t.sortRating}</option>
              </select>

              {/* Budget */}
              <select
                name="budget"
                defaultValue={budget ?? ""}
                className="h-10 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none focus:border-[var(--color-brand-400)]"
              >
                {BUDGET_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{t[o.labelKey]}</option>
                ))}
              </select>

              {/* Délai de livraison */}
              <select
                name="jours"
                defaultValue={jours ?? ""}
                className="h-10 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none focus:border-[var(--color-brand-400)]"
              >
                {DELIVERY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{t[o.labelKey]}</option>
                ))}
              </select>

              {/* Conserver la catégorie active dans le form */}
              {categorie && <input type="hidden" name="categorie" value={categorie} />}

              <button
                type="submit"
                className="h-10 shrink-0 rounded-full bg-[var(--color-brand-500)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-600)]"
              >
                {locale === "fr" ? "Rechercher" : "Search"}
              </button>
            </form>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          {/* Onglets catégories */}
          <nav className="flex flex-wrap gap-2" aria-label={t.filterLabel}>
            <Link
              href={buildUrl({ q, sort, budget, jours }, { categorie: undefined })}
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
              const isActive = categorie === c.slug;
              return (
                <Link
                  key={c.id}
                  href={buildUrl({ q, sort, budget, jours }, { categorie: c.slug })}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
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

          {/* Chips filtres actifs */}
          {hasActiveFilters && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-[var(--subtle)]">{t.activeFiltersLabel} :</span>
              {activeChips.map((chip) => (
                <Link
                  key={chip.label}
                  href={chip.removeUrl}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-brand-300)] bg-[var(--color-brand-50)] px-3 py-1 text-xs font-semibold text-[var(--color-brand-700)] transition-colors hover:border-[var(--color-brand-500)]"
                >
                  {chip.label}
                  <span aria-hidden className="font-normal opacity-60">✕</span>
                </Link>
              ))}
              <Link
                href={categorie ? `/services?categorie=${categorie}` : "/services"}
                className="text-xs font-medium text-[var(--subtle)] underline underline-offset-2 hover:text-[var(--foreground)]"
              >
                {t.clearFilters}
              </Link>
            </div>
          )}

          {/* Titre + count */}
          <div className="mt-6">
            {active ? (
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: categoryGradient(active.slug) }}
                  aria-hidden
                >
                  {(() => {
                    const Icon = categoryMeta(active.slug)?.icon;
                    return Icon ? <Icon className="h-5 w-5 text-white" /> : null;
                  })()}
                </div>
                <div>
                  <h1 className="text-xl font-bold leading-tight">{categoryName(active, locale)}</h1>
                  <p className="text-sm text-[var(--subtle)]">
                    {services.length} {services.length > 1 ? t.resultCountPlural : t.resultCount}
                    {categoryMeta(active.slug) && (
                      <span> · {locale === "en" ? categoryMeta(active.slug)?.blurbEn : categoryMeta(active.slug)?.blurbFr}</span>
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-xl font-bold">{q ? `"${q}"` : t.listTitle}</h1>
                <p className="text-sm text-[var(--subtle)]">{services.length} {services.length > 1 ? t.resultCountPlural : t.resultCount}</p>
              </div>
            )}
          </div>

          {/* Grille de cartes */}
          {services.length > 0 ? (
            <>
              <ul className="app-stagger mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {services.map((s) => (
                  <li key={s.id} className="flex">
                    <ServiceCard service={s} locale={locale} />
                  </li>
                ))}
              </ul>

              {/* Pagination prev / next */}
              {(page > 1 || hasMore) && (
                <nav className="mt-10 flex items-center justify-center gap-3" aria-label={locale === "fr" ? "Pagination" : "Pagination"}>
                  {page > 1 ? (
                    <Link
                      href={buildUrl(currentParams, { page: page > 2 ? String(page - 1) : undefined })}
                      className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--border)] px-5 text-sm font-semibold transition-colors hover:border-[var(--color-brand-300)] hover:text-[var(--color-brand-600)]"
                    >
                      ← {locale === "fr" ? "Précédent" : "Previous"}
                    </Link>
                  ) : (
                    <span className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--border)] px-5 text-sm font-semibold opacity-30 cursor-default select-none">
                      ← {locale === "fr" ? "Précédent" : "Previous"}
                    </span>
                  )}

                  <span className="min-w-[2.5rem] text-center text-sm font-semibold tabular-nums text-[var(--subtle)]">
                    {page}
                  </span>

                  {hasMore ? (
                    <Link
                      href={buildUrl(currentParams, { page: String(page + 1) })}
                      className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--border)] px-5 text-sm font-semibold transition-colors hover:border-[var(--color-brand-300)] hover:text-[var(--color-brand-600)]"
                    >
                      {locale === "fr" ? "Suivant" : "Next"} →
                    </Link>
                  ) : (
                    <span className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--border)] px-5 text-sm font-semibold opacity-30 cursor-default select-none">
                      {locale === "fr" ? "Suivant" : "Next"} →
                    </span>
                  )}
                </nav>
              )}
            </>
          ) : (
            <div className="mt-16 rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-16 text-center">
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
        </div>
      </main>

      <Footer locale={locale} />
    </>
  );
}
