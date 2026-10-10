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
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-brand-300)] hover:shadow-xl hover:shadow-black/[0.06]"
    >
      {/* Cover — rapport fixe 16:9 */}
      <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden">
        {s.cover_url ? (
          <Image
            src={s.cover_url}
            alt={s.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
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

      {/* Body — flex-col avec hauteurs fixes pour homogénéité */}
      <div className="flex flex-1 flex-col p-4">

        {/* Prestataire — hauteur fixe 36px */}
        <div className="flex h-9 items-center gap-2">
          <span
            aria-hidden
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
            style={{ background: gradient }}
          >
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold leading-tight">
              {s.provider?.display_name ?? t.provider}
              {s.provider?.country_code ? (
                <span className="ml-1 font-normal text-[var(--subtle)]">· {s.provider.country_code}</span>
              ) : null}
            </p>
            {/* Rating ou spacer — même hauteur dans les deux cas */}
            {s.provider?.rating_avg != null && s.provider.rating_count > 0 ? (
              <StarRating value={s.provider.rating_avg} count={s.provider.rating_count} />
            ) : (
              <span className="block h-4" aria-hidden />
            )}
          </div>
        </div>

        {/* Titre — toujours 2 lignes (line-clamp) avec hauteur min garantie */}
        <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug">
          {s.title}
        </p>

        {/* Tags — zone de hauteur fixe (28px), 3 tags max, ou vide */}
        <div className="mt-2 flex h-7 items-center gap-1 overflow-hidden">
          {s.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="shrink-0 rounded-full bg-[var(--surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--subtle)]"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Footer prix + délai — toujours en bas grâce à mt-auto */}
        <div className="mt-auto flex items-end justify-between border-t border-[var(--border)] pt-3">
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
