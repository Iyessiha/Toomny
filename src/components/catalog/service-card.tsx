"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { categoryGradient } from "@/lib/categories";
import { formatMoney } from "@/lib/money";
import type { ServiceCard as ServiceCardData } from "@/lib/catalog";
import type { Locale } from "@/i18n/dictionaries";
import { getCatalogTexts } from "@/i18n/catalog";
import { CoverImage } from "./cover-image";
import { WishlistButton } from "./wishlist-button";

type Props = {
  service: ServiceCardData;
  locale: Locale;
};

function Stars({ n, size = 11 }: { n: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          <path
            fill={i < Math.round(n) ? "#FFCB00" : "var(--border)"}
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z"
          />
        </svg>
      ))}
    </div>
  );
}

export function ServiceCard({ service: s, locale }: Props) {
  const t = getCatalogTexts(locale);
  const router = useRouter();
  const gradient = categoryGradient(s.category_slug);
  const initials = (s.provider?.display_name ?? "P").slice(0, 2).toUpperCase();
  const rating = s.provider?.rating_avg ?? null;
  const ratingCount = s.provider?.rating_count ?? 0;

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/services/${s.id}`)}
      onKeyDown={(e) => e.key === "Enter" && router.push(`/services/${s.id}`)}
      className="group block cursor-pointer overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[var(--color-brand-500)]/10 hover:border-[var(--color-brand-200)]"
    >
      {/* ── Image avec overlay gradient ── */}
      <div className="relative w-full overflow-hidden" style={{ paddingBottom: "58%" }}>
        <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
          <CoverImage src={s.cover_url} alt={s.title} categorySlug={s.category_slug} />
        </div>

        {/* Gradient sombre en bas pour lisibilité */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.10) 45%, transparent 75%)" }}
        />

        {/* Badge Vedette — haut gauche */}
        {s.boosted && (
          <div className="absolute left-2.5 top-2.5 z-10">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-bold text-amber-950 shadow-md shadow-amber-500/30">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" />
              </svg>
              Vedette
            </span>
          </div>
        )}

        {/* Wishlist — haut droite */}
        <div className="absolute right-2 top-2 z-10" onClick={(e) => e.stopPropagation()}>
          <WishlistButton serviceId={s.id} size="sm" labels={{ add: t.wishlistAdd, remove: t.wishlistRemove }} />
        </div>

        {/* Prix en surimpression bas-droite */}
        <div className="absolute bottom-2.5 right-3 z-10 text-right">
          <p className="text-[9px] font-medium text-white/70">{t.from}</p>
          <p className="font-display text-base font-extrabold leading-none text-white drop-shadow">
            {formatMoney(BigInt(s.price_minor), s.currency, locale)}
          </p>
        </div>

        {/* Délai — bas gauche */}
        <div className="absolute bottom-2.5 left-3 z-10 flex items-center gap-1">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.80)" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
          </svg>
          <span className="text-[11px] font-semibold text-white/80">
            {s.delivery_days} {s.delivery_days > 1 ? t.days : t.day}
          </span>
        </div>
      </div>

      {/* ── Contenu ── */}
      <div className="p-3.5">

        {/* Prestataire row */}
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white ring-2 ring-[var(--background)]"
            style={{ background: gradient }}
          >
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            {s.provider?.id ? (
              <Link
                href={`/prestataires/${s.provider.id}`}
                onClick={(e) => e.stopPropagation()}
                className="block truncate text-xs font-semibold text-[var(--foreground)] transition-colors hover:text-[var(--color-brand-600)] hover:underline underline-offset-2"
              >
                {s.provider.display_name ?? t.provider}
                {s.provider.country_code && (
                  <span className="ml-1 font-normal text-[var(--subtle)]">· {s.provider.country_code}</span>
                )}
              </Link>
            ) : (
              <p className="truncate text-xs font-semibold text-[var(--foreground)]">
                {s.provider?.display_name ?? t.provider}
              </p>
            )}

            {/* Stars + count OU badge Nouveau */}
            <div className="mt-0.5 flex items-center gap-1.5">
              {rating != null && ratingCount > 0 ? (
                <>
                  <Stars n={rating} />
                  <span className="text-[11px] font-bold text-amber-500">{rating.toFixed(1)}</span>
                  <span className="text-[10px] text-[var(--subtle)]">
                    ({ratingCount} {locale === "fr" ? "avis" : ratingCount > 1 ? "reviews" : "review"})
                  </span>
                </>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand-50)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-brand-700)]">
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand-500)]" />
                  {locale === "fr" ? "Nouveau" : "New"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Titre du service */}
        <p className="mt-2.5 line-clamp-2 text-sm font-semibold leading-snug text-[var(--foreground)]">
          {s.title}
        </p>

        {/* Escrow indicator */}
        <div className="mt-3 flex items-center gap-1.5 rounded-xl bg-[var(--surface)] px-3 py-2">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-500)" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
            <rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span className="text-[10px] font-medium text-[var(--subtle)]">
            {locale === "fr" ? "Paiement sécurisé jusqu'à la livraison" : "Payment secured until delivery"}
          </span>
        </div>
      </div>
    </div>
  );
}
