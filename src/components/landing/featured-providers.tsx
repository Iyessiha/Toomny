import Link from "next/link";
import { getFeaturedProviders } from "@/lib/catalog";
import { categoryGradient } from "@/lib/categories";
import type { Locale } from "@/i18n/dictionaries";

const LABELS = {
  fr: {
    kicker: "Talents en vedette",
    title: "Prestataires mis en avant",
    subtitle: "Ces experts ont choisi d'apparaître ici pour vous offrir leur meilleur service.",
    missions: "missions",
    cta: "Voir le profil",
    all: "Parcourir tous les prestataires →",
  },
  en: {
    kicker: "Featured talent",
    title: "Highlighted providers",
    subtitle: "These experts chose to be featured here to offer you their best work.",
    missions: "orders",
    cta: "View profile",
    all: "Browse all providers →",
  },
};

export async function FeaturedProviders({ locale }: { locale: Locale }) {
  const providers = await getFeaturedProviders();
  if (providers.length === 0) return null;

  const t = LABELS[locale];

  return (
    <section className="border-t border-[var(--border)] bg-[var(--background)]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">

        {/* Header */}
        <div data-reveal className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" />
              </svg>
              {t.kicker}
            </p>
            <h2 className="text-2xl font-bold leading-tight sm:text-3xl">{t.title}</h2>
            <p className="mt-1 max-w-xl text-sm text-[var(--subtle)]">{t.subtitle}</p>
          </div>
          <Link
            href="/services"
            className="shrink-0 text-sm font-semibold text-[var(--color-brand-600)] hover:underline"
          >
            {t.all}
          </Link>
        </div>

        {/* Grid */}
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {providers.map((p) => {
            const initials = (p.display_name ?? "P").slice(0, 2).toUpperCase();
            const gradient = categoryGradient(null);

            return (
              <li key={p.id} data-reveal>
                <Link
                  href={`/prestataires/${p.id}`}
                  className="group flex h-full flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5"
                >
                  {/* Avatar + badge Elite */}
                  <div className="mb-4 flex items-start justify-between">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-base font-bold text-white"
                      style={{ background: gradient }}
                    >
                      {initials}
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" />
                      </svg>
                      Elite
                    </span>
                  </div>

                  {/* Nom */}
                  <p className="font-display text-sm font-bold leading-tight text-[var(--foreground)]">
                    {p.display_name ?? "Prestataire"}
                    {p.country_code && (
                      <span className="ml-1.5 font-normal text-[var(--subtle)]">· {p.country_code}</span>
                    )}
                  </p>

                  {/* Headline */}
                  {p.headline && (
                    <p className="mt-1 line-clamp-2 text-xs text-[var(--subtle)]">{p.headline}</p>
                  )}

                  {/* Skills */}
                  {p.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {p.skills.map((s) => (
                        <span
                          key={s}
                          className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] text-[var(--subtle)]"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="mt-auto pt-4 flex items-center gap-3 border-t border-[var(--border)]">
                    {p.rating_avg != null && p.rating_count > 0 && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-amber-500">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" />
                        </svg>
                        {p.rating_avg.toFixed(1)}
                        <span className="font-normal text-[var(--subtle)]">({p.rating_count})</span>
                      </span>
                    )}
                    {p.completed_orders > 0 && (
                      <span className="text-xs text-[var(--subtle)]">
                        {p.completed_orders} {t.missions}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

      </div>
    </section>
  );
}
