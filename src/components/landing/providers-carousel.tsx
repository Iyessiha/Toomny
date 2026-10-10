"use client";

import { useRef } from "react";
import Link from "next/link";
import { categoryGradient } from "@/lib/categories";
import { formatMoney } from "@/lib/money";
import type { Locale } from "@/i18n/dictionaries";
import type { ServiceCard } from "@/lib/catalog";

/* ── Types ── */
type ProviderCard = {
  id: string;
  display_name: string;
  country_code: string | null;
  rating_avg: number | null;
  rating_count: number;
  category_slug: string | null;
  min_price: number;
  currency: string;
  service_id: string;
};

/* ── Star row ── */
function Stars({ n }: { n: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="11" height="11" viewBox="0 0 24 24" aria-hidden>
          <path
            fill={i < n ? "#FFCB00" : "var(--border)"}
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z"
          />
        </svg>
      ))}
    </div>
  );
}

/* ── Single card ── */
function Card({ p, locale }: { p: ProviderCard; locale: Locale }) {
  const gradient = categoryGradient(p.category_slug);
  const initials = p.display_name.slice(0, 2).toUpperCase();
  const stars = p.rating_avg != null ? Math.round(p.rating_avg) : 5;

  return (
    <Link
      href={`/services/${p.service_id}`}
      className="group flex w-[220px] shrink-0 flex-col items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-brand-300)] hover:shadow-xl hover:shadow-black/[0.06]"
    >
      {/* Avatar gradient */}
      <div
        className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white shadow-md"
        style={{ background: gradient }}
        aria-hidden
      >
        {initials}
        {/* Badge pays */}
        {p.country_code && (
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[var(--background)] bg-[var(--surface)] text-sm">
            {countryFlag(p.country_code)}
          </span>
        )}
      </div>

      {/* Nom — toujours 1 ligne */}
      <div className="w-full">
        <p className="truncate font-display text-sm font-bold">{p.display_name}</p>
        {/* Catégorie / spécialité */}
        <p className="mt-0.5 truncate text-[11px] text-[var(--subtle)]">
          {categoryLabel(p.category_slug)}
        </p>
      </div>

      {/* Stars — hauteur fixe */}
      <div className="flex h-5 items-center gap-1.5">
        <Stars n={stars} />
        {p.rating_count > 0 && (
          <span className="text-[10px] text-[var(--subtle)]">({p.rating_count})</span>
        )}
      </div>

      {/* Prix dès — toujours présent */}
      <div className="mt-auto w-full border-t border-[var(--border)] pt-3">
        <p className="text-[10px] text-[var(--subtle)]">Dès</p>
        <p className="font-display text-sm font-bold text-[var(--color-brand-600)]">
          {formatMoney(BigInt(p.min_price), p.currency, locale)}
        </p>
      </div>
    </Link>
  );
}

/* ── Helpers ── */
function countryFlag(code: string): string {
  const flags: Record<string, string> = {
    CI: "🇨🇮", SN: "🇸🇳", ML: "🇲🇱", BF: "🇧🇫",
    GH: "🇬🇭", NG: "🇳🇬", TG: "🇹🇬", BJ: "🇧🇯",
    CM: "🇨🇲", GN: "🇬🇳", CD: "🇨🇩", MR: "🇲🇷",
  };
  return flags[code.toUpperCase()] ?? "🌍";
}

function categoryLabel(slug: string | null): string {
  const labels: Record<string, string> = {
    "design-graphique": "Design graphique",
    "developpement-web": "Développement web",
    "marketing-digital": "Marketing digital",
    "redaction-traduction": "Rédaction & traduction",
    "montage-video": "Montage vidéo",
    "community-management": "Community management",
    "photographie": "Photographie",
    "comptabilite-admin": "Comptabilité & admin",
  };
  return labels[slug ?? ""] ?? "Freelance";
}

/* ── Carousel track (client) ── */
export function ProvidersCarouselTrack({
  services,
  locale,
  title,
  subtitle,
  ctaLabel,
}: {
  services: ServiceCard[];
  locale: Locale;
  title: string;
  subtitle: string;
  ctaLabel: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  // Déduplique par provider et garde le service avec le prix le plus bas
  const seen = new Set<string>();
  const providers: ProviderCard[] = [];
  for (const s of services) {
    if (!s.provider) continue;
    if (seen.has(s.provider.id)) continue;
    seen.add(s.provider.id);
    providers.push({
      id: s.provider.id,
      display_name: s.provider.display_name ?? "Prestataire",
      country_code: s.provider.country_code,
      rating_avg: s.provider.rating_avg,
      rating_count: s.provider.rating_count,
      category_slug: s.category_slug,
      min_price: s.price_minor,
      currency: s.currency,
      service_id: s.id,
    });
  }

  const scroll = (dir: -1 | 1) => {
    trackRef.current?.scrollBy({ left: dir * 260, behavior: "smooth" });
  };

  if (providers.length === 0) return null;

  return (
    <section className="border-t border-[var(--border)] overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        {/* Header */}
        <div className="flex items-end justify-between gap-4" data-reveal>
          <div>
            <h2 className="text-2xl font-bold leading-tight sm:text-3xl">{title}</h2>
            <p className="mt-1 text-sm text-[var(--subtle)]">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Flèches */}
            <button
              type="button"
              onClick={() => scroll(-1)}
              aria-label="Précédent"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background)] text-[var(--subtle)] transition-colors hover:border-[var(--color-brand-300)] hover:text-[var(--color-brand-600)]"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              aria-label="Suivant"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background)] text-[var(--subtle)] transition-colors hover:border-[var(--color-brand-300)] hover:text-[var(--color-brand-600)]"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
            <Link
              href="/services"
              className="ml-2 hidden text-sm font-semibold text-[var(--color-brand-600)] hover:underline sm:block"
            >
              {ctaLabel}
            </Link>
          </div>
        </div>

        {/* Track horizontal scroll */}
        <div
          ref={trackRef}
          className="mt-8 flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scroll-pl-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {providers.map((p, i) => (
            <div key={p.id} data-reveal style={{ transitionDelay: `${Math.min(i, 5) * 50}ms` }} className="snap-start">
              <Card p={p} locale={locale} />
            </div>
          ))}
          {/* Fade-out côté droit pour signifier qu'il y a plus */}
          <div className="w-8 shrink-0" aria-hidden />
        </div>

        {/* CTA mobile */}
        <div className="mt-2 sm:hidden">
          <Link
            href="/services"
            className="text-sm font-semibold text-[var(--color-brand-600)] hover:underline"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
