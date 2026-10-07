import Link from "next/link";
import { getLanding } from "@/content/landing";
import type { Locale } from "@/i18n/dictionaries";

export function Categories({ locale = "fr" }: { locale?: Locale }) {
  const t = getLanding(locale).categories;

  return (
    <section id="categories" className="border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div data-reveal className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-brand-600)]">
            {t.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">{t.title}</h2>
          <p className="mt-4 text-lg leading-relaxed text-[var(--subtle)]">{t.lead}</p>
        </div>

        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {t.items.map((c, i) => (
            <Link
              key={c.slug}
              href={`/services?categorie=${c.slug}`}
              data-reveal
              style={{ transitionDelay: `${(i % 4) * 50}ms` }}
              className="group rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-brand-300)] hover:shadow-lg hover:shadow-black/[0.04]"
            >
              <h3 className="font-display text-base font-bold">{c.name}</h3>
              <p className="mt-1.5 text-sm text-[var(--subtle)]">{c.items}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-brand-600)]">
                {t.explore}
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="transition-transform duration-300 group-hover:translate-x-1">
                  <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
