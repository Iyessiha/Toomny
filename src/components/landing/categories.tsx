import Link from "next/link";
import { getLanding } from "@/content/landing";
import { categoryMeta, categoryGradient } from "@/lib/categories";
import type { Locale } from "@/i18n/dictionaries";

export function Categories({ locale = "fr" }: { locale?: Locale }) {
  const t = getLanding(locale).categories;

  return (
    <section id="categories" className="border-t border-[var(--border)]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <div data-reveal className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-brand-600)]">
              {t.eyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">{t.title}</h2>
          </div>
          <Link
            href="/services"
            className="shrink-0 text-sm font-semibold text-[var(--color-brand-600)] hover:underline"
          >
            {locale === "fr" ? "Tout voir →" : "See all →"}
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
          {t.items.map((c, i) => {
            const meta = categoryMeta(c.slug);
            const Icon = meta?.icon;
            const gradient = categoryGradient(c.slug);

            return (
              <Link
                key={c.slug}
                href={`/services?categorie=${c.slug}`}
                data-reveal
                style={{ transitionDelay: `${(i % 4) * 40}ms` }}
                className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10"
              >
                {/* Fond gradient */}
                <div
                  className="flex aspect-[4/3] w-full flex-col items-start justify-end p-4"
                  style={{ background: gradient }}
                >
                  {/* Icône en haut à droite */}
                  {Icon && (
                    <div className="absolute right-3 top-3 opacity-30 transition-opacity group-hover:opacity-50">
                      <Icon className="h-14 w-14 text-white" aria-hidden />
                    </div>
                  )}

                  {/* Overlay sombre en bas */}
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{ background: "linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 60%)" }}
                    aria-hidden
                  />

                  {/* Texte */}
                  <div className="relative z-10">
                    <p className="text-sm font-bold leading-tight text-white">{c.name}</p>
                    <p className="mt-0.5 text-[11px] text-white/75">{c.items}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
