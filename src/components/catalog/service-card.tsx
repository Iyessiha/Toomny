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

export function ServiceCard({ service: s, locale }: Props) {
  const t = getCatalogTexts(locale);
  const router = useRouter();
  const gradient = categoryGradient(s.category_slug);
  const initials = (s.provider?.display_name ?? "P").slice(0, 2).toUpperCase();
  const rating = s.provider?.rating_avg ?? null;
  const ratingCount = s.provider?.rating_count ?? 0;

  return (
    // div cliquable au lieu de Link pour éviter les <a> imbriqués
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/services/${s.id}`)}
      onKeyDown={(e) => e.key === "Enter" && router.push(`/services/${s.id}`)}
      className="group block cursor-pointer overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.015] hover:border-[var(--color-brand-300)]/60 hover:shadow-xl hover:shadow-[var(--color-brand-500)]/10"
    >
      {/* ── Image de couverture ── */}
      <div className="relative w-full overflow-hidden" style={{ paddingBottom: "56.25%" }}>
        <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
          <CoverImage
            src={s.cover_url}
            alt={s.title}
            categorySlug={s.category_slug}
          />
        </div>
        {/* Wishlist overlay */}
        <div className="absolute right-2 top-2 z-10" onClick={(e) => e.stopPropagation()}>
          <WishlistButton serviceId={s.id} size="sm" labels={{ add: t.wishlistAdd, remove: t.wishlistRemove }} />
        </div>
        {/* Badge boosté */}
        {s.boosted && (
          <div className="absolute left-2 top-2 z-10">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-bold text-amber-950 shadow-md shadow-amber-500/30">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" />
              </svg>
              Vedette
            </span>
          </div>
        )}
      </div>

      {/* ── Contenu ── */}
      <div className="p-3">

        {/* Prestataire — lien standalone, stopPropagation pour ne pas déclencher le div parent */}
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
            style={{ background: gradient }}
          >
            {initials}
          </span>
          {s.provider?.id ? (
            <Link
              href={`/prestataires/${s.provider.id}`}
              onClick={(e) => e.stopPropagation()}
              className="truncate text-xs font-medium text-[var(--subtle)] transition-colors hover:text-[var(--color-brand-600)] hover:underline underline-offset-2"
            >
              {s.provider.display_name ?? t.provider}
              {s.provider.country_code && (
                <span className="ml-1">· {s.provider.country_code}</span>
              )}
            </Link>
          ) : (
            <p className="truncate text-xs font-medium text-[var(--subtle)]">
              {s.provider?.display_name ?? t.provider}
            </p>
          )}
        </div>

        {/* Titre du service */}
        <p className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-[var(--foreground)]">
          {s.title}
        </p>

        {/* Note / badge Nouveau */}
        <div className="mt-1.5 flex items-center gap-1.5">
          {rating != null && ratingCount > 0 ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden>
                <path fill="#FFCB00" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" />
              </svg>
              <span className="text-xs font-bold text-amber-500">{rating.toFixed(1)}</span>
              <span className="text-xs text-[var(--subtle)]">
                ({ratingCount} {ratingCount > 1 ? (locale === "fr" ? "avis" : "reviews") : (locale === "fr" ? "avis" : "review")})
              </span>
            </>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand-50)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-brand-700)]">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand-500)]" />
              {locale === "fr" ? "Nouveau" : "New"}
            </span>
          )}
        </div>

        {/* Séparateur */}
        <div className="mt-2.5 border-t border-[var(--border)]" />

        {/* Prix */}
        <div className="mt-2 flex items-end justify-between gap-2">
          <span className="min-w-0 flex-1 truncate text-[10px] text-[var(--subtle)]">
            {t.delivery} {s.delivery_days} {s.delivery_days > 1 ? t.days : t.day}
          </span>
          <div className="shrink-0 text-right">
            <p className="text-[10px] text-[var(--subtle)]">{t.from}</p>
            <p className="whitespace-nowrap font-display text-xs font-bold text-[var(--color-brand-600)] sm:text-sm">
              {formatMoney(BigInt(s.price_minor), s.currency, locale)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
