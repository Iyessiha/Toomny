import Link from "next/link";
import Image from "next/image";
import { formatMoney } from "@/lib/money";
import { InitialsAvatar } from "@/components/providers/initials-avatar";
import { getCatalogTexts } from "@/i18n/catalog";
import type { Locale } from "@/i18n/dictionaries";
import { CATEGORY_ILLUSTRATIONS, type ProviderCardData } from "@/lib/provider-search";

/** Carte prestataire sobre : photo, nom, métier, indicateurs, compétences et tarif. */
export function ProviderCard({ p, locale }: { p: ProviderCardData; locale: Locale }) {
  const t = getCatalogTexts(locale);
  const place = [p.city, p.country].filter(Boolean).join(", ");
  const skills = p.skills.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4);

  return (
    <article className="flex h-full flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-start gap-4">
        {p.avatar ? (
          <Image src={p.avatar} alt={p.name} width={56} height={56} className="h-14 w-14 flex-none rounded-full object-cover" />
        ) : p.categorySlug && CATEGORY_ILLUSTRATIONS.has(p.categorySlug) ? (
          <Image
            src={`/images/categories/${p.categorySlug}.png`}
            alt=""
            width={56}
            height={56}
            className="h-14 w-14 flex-none rounded-xl"
          />
        ) : (
          <InitialsAvatar name={p.name} size={56} />
        )}
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate text-[15px] font-semibold">
            {p.name}
            {p.verified && <span title={t.cardVerified} aria-label={t.cardVerified} className="text-[var(--color-brand-600)]">✓</span>}
          </p>
          <p className="mt-0.5 line-clamp-2 text-sm text-[var(--foreground)]">{p.headline ?? p.companyName ?? ""}</p>
          {place && <p className="mt-0.5 truncate text-xs text-[var(--subtle)]">{place}</p>}
        </div>
      </div>

      <p className="flex flex-wrap items-center gap-x-2 text-xs text-[var(--subtle)]">
        <span className="font-semibold text-[var(--foreground)]">{p.rating !== null ? `★ ${p.rating.toFixed(1)}` : t.cardNew}</span>
        {p.ratingCount > 0 && <span>({p.ratingCount} {t.cardReviews})</span>}
        <span aria-hidden>·</span>
        <span>{p.received} {t.cardOrders}</span>
        <span aria-hidden>·</span>
        <span>{p.businessType === "company" ? t.cardCompany : t.cardIndividual}</span>
      </p>

      {skills.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {skills.map((skill) => (
            <li key={skill} className="rounded-md bg-[var(--background)] px-2 py-1 text-xs text-[var(--foreground)]">
              {skill}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
        <p className="text-sm">
          {p.fromPriceMinor !== null && (
            <>
              <span className="text-[var(--subtle)]">{t.cardFrom} </span>
              <span className="font-semibold">{formatMoney(BigInt(p.fromPriceMinor), "XOF", locale)}</span>
            </>
          )}
        </p>
        <Link
          href={`/prestataires/${p.id}`}
          className="flex-none rounded-full border border-[var(--color-brand-500)] px-4 py-1.5 text-sm font-semibold text-[var(--color-brand-700)] hover:bg-[var(--color-brand-50)]"
        >
          {t.viewProfile}
        </Link>
      </div>
    </article>
  );
}
