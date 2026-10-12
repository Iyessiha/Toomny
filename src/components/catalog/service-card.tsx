import Link from "next/link";
import { categoryGradient } from "@/lib/categories";
import { formatMoney } from "@/lib/money";
import type { ServiceCard as ServiceCardData } from "@/lib/catalog";
import type { Locale } from "@/i18n/dictionaries";
import { getCatalogTexts } from "@/i18n/catalog";
import { CoverImage } from "./cover-image";

type Props = {
  service: ServiceCardData;
  locale: Locale;
};

export function ServiceCard({ service: s, locale }: Props) {
  const t = getCatalogTexts(locale);
  const gradient = categoryGradient(s.category_slug);
  const initials = (s.provider?.display_name ?? "P").slice(0, 2).toUpperCase();
  const rating = s.provider?.rating_avg ?? null;
  const ratingCount = s.provider?.rating_count ?? 0;

  return (
    <Link
      href={`/services/${s.id}`}
      className="group block overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background)] transition-all duration-200 hover:shadow-lg hover:shadow-black/[0.08] hover:-translate-y-0.5"
    >
      {/* ── Image de couverture ── */}
      <div className="relative w-full overflow-hidden" style={{ paddingBottom: "56.25%" }}>
        <CoverImage
          src={s.cover_url}
          alt={s.title}
          categorySlug={s.category_slug}
        />
      </div>

      {/* ── Contenu ── */}
      <div className="p-3">

        {/* Prestataire */}
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
            style={{ background: gradient }}
          >
            {initials}
          </span>
          <p className="truncate text-xs font-medium text-[var(--subtle)]">
            {s.provider?.display_name ?? t.provider}
            {s.provider?.country_code && (
              <span className="ml-1">· {s.provider.country_code}</span>
            )}
          </p>
        </div>

        {/* Titre du service */}
        <p className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-[var(--foreground)]">
          {s.title}
        </p>

        {/* Note */}
        {rating != null && ratingCount > 0 ? (
          <div className="mt-1.5 flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden>
              <path fill="#FFCB00" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" />
            </svg>
            <span className="text-xs font-bold text-amber-500">{rating.toFixed(1)}</span>
            <span className="text-xs text-[var(--subtle)]">({ratingCount})</span>
          </div>
        ) : (
          <div className="mt-1.5 h-[18px]" aria-hidden />
        )}

        {/* Séparateur */}
        <div className="mt-2.5 border-t border-[var(--border)]" />

        {/* Prix */}
        <div className="mt-2 flex items-end justify-between">
          <span className="text-[10px] text-[var(--subtle)]">
            {t.delivery} {s.delivery_days} {s.delivery_days > 1 ? t.days : t.day}
          </span>
          <div className="text-right">
            <p className="text-[10px] text-[var(--subtle)]">{t.from}</p>
            <p className="font-display text-base font-bold text-[var(--color-brand-600)]">
              {formatMoney(BigInt(s.price_minor), s.currency, locale)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
