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
  const initials = (s.provider?.display_name ?? "P").slice(0, 2).toUpperCase();
  const rating = s.provider?.rating_avg ?? null;
  const ratingCount = s.provider?.rating_count ?? 0;

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/services/${s.id}`)}
      onKeyDown={(e) => e.key === "Enter" && router.push(`/services/${s.id}`)}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] transition-shadow duration-200 hover:shadow-lg hover:shadow-black/[0.06]"
    >
      {/* Visuel */}
      <div className="relative w-full overflow-hidden bg-[var(--background)]" style={{ paddingBottom: "62%" }}>
        <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.03]">
          <CoverImage src={s.cover_url} alt={s.title} categorySlug={s.category_slug} />
        </div>
        {s.boosted && (
          <span className="absolute left-2.5 top-2.5 z-10 rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold text-[var(--foreground)] shadow-sm">
            {t.featured}
          </span>
        )}
        <div className="absolute right-2 top-2 z-10" onClick={(e) => e.stopPropagation()}>
          <WishlistButton serviceId={s.id} size="sm" labels={{ add: t.wishlistAdd, remove: t.wishlistRemove }} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Prestataire */}
        <div className="flex items-center gap-2 text-xs">
          <span
            aria-hidden
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-100)] text-[10px] font-bold text-[var(--color-brand-700)]"
          >
            {initials}
          </span>
          {s.provider?.id ? (
            <Link
              href={`/prestataires/${s.provider.id}`}
              onClick={(e) => e.stopPropagation()}
              className="min-w-0 truncate font-semibold text-[var(--foreground)] hover:underline underline-offset-2"
            >
              {s.provider.display_name ?? t.provider}
            </Link>
          ) : (
            <span className="min-w-0 truncate font-semibold">{s.provider?.display_name ?? t.provider}</span>
          )}
          {s.provider?.verified && (
            <span title={t.identityVerified} className="flex-none text-[var(--color-brand-600)]" aria-label={t.identityVerified}>✓</span>
          )}
        </div>

        {/* Titre : la phrase « Je vais… » */}
        <p className="line-clamp-2 text-[15px] leading-snug text-[var(--foreground)]">{s.title}</p>

        {/* Avis */}
        <div className="flex items-center gap-1.5 text-xs">
          {rating != null && ratingCount > 0 ? (
            <>
              <Stars n={rating} size={11} />
              <span className="font-semibold">{rating.toFixed(1)}</span>
              <span className="text-[var(--subtle)]">({ratingCount})</span>
            </>
          ) : (
            <span className="text-[var(--subtle)]">{locale === "fr" ? "Nouveau" : "New"}</span>
          )}
        </div>

        {/* Prix */}
        <div className="mt-auto flex items-baseline gap-1.5 border-t border-[var(--border)] pt-3">
          <span className="text-xs text-[var(--subtle)]">{t.from}</span>
          <span className="font-display text-base font-bold">{formatMoney(BigInt(s.price_minor), s.currency, locale)}</span>
        </div>
      </div>
    </div>
  );
}
