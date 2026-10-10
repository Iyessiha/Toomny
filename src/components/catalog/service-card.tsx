import Link from "next/link";
import Image from "next/image";
import { categoryMeta, categoryGradient } from "@/lib/categories";
import { formatMoney } from "@/lib/money";
import type { ServiceCard as ServiceCardData } from "@/lib/catalog";
import type { Locale } from "@/i18n/dictionaries";
import { getCatalogTexts } from "@/i18n/catalog";

type Props = {
  service: ServiceCardData;
  locale: Locale;
};

function StarRating({ value, count }: { value: number; count: number }) {
  const full = Math.round(value);
  return (
    <span className="flex items-center gap-1 text-xs">
      <span className="text-amber-400">
        {"★".repeat(Math.min(full, 5))}{"☆".repeat(Math.max(0, 5 - full))}
      </span>
      <span className="font-semibold text-amber-600">{value.toFixed(1)}</span>
      <span className="text-[var(--subtle)]">({count})</span>
    </span>
  );
}

export function ServiceCard({ service: s, locale }: Props) {
  const t = getCatalogTexts(locale);
  const gradient = categoryGradient(s.category_slug);
  const meta = categoryMeta(s.category_slug ?? "");
  const Icon = meta?.icon;
  const initials = (s.provider?.display_name ?? "P").slice(0, 2).toUpperCase();

  return (
    <Link
      href={`/services/${s.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-brand-300)] hover:shadow-xl hover:shadow-black/[0.06]"
    >
      {/* Cover */}
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        {s.cover_url ? (
          <Image
            src={s.cover_url}
            alt={s.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ background: gradient }}
            aria-hidden
          >
            {Icon ? (
              <Icon className="h-12 w-12 text-white/80" />
            ) : (
              <span className="text-4xl font-bold text-white/60">{initials}</span>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        {/* Provider row */}
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
            style={{ background: gradient }}
          >
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold leading-tight">
              {s.provider?.display_name ?? t.provider}
              {s.provider?.country_code ? (
                <span className="ml-1 font-normal text-[var(--subtle)]">· {s.provider.country_code}</span>
              ) : null}
            </p>
            {s.provider?.rating_avg != null && s.provider.rating_count > 0 ? (
              <StarRating value={s.provider.rating_avg} count={s.provider.rating_count} />
            ) : null}
          </div>
        </div>

        {/* Title */}
        <p className="mt-3 line-clamp-2 flex-1 text-sm font-semibold leading-snug">
          {s.title}
        </p>

        {/* Price + delivery */}
        <div className="mt-3 flex items-end justify-between border-t border-[var(--border)] pt-3">
          <p className="text-[10px] text-[var(--subtle)]">
            {t.delivery} {s.delivery_days} {s.delivery_days > 1 ? t.days : t.day}
          </p>
          <p className="text-right">
            <span className="block text-[10px] font-normal text-[var(--subtle)]">{t.from}</span>
            <span className="font-display text-sm font-bold text-[var(--color-brand-600)]">
              {formatMoney(BigInt(s.price_minor), s.currency, locale)}
            </span>
          </p>
        </div>
      </div>
    </Link>
  );
}
