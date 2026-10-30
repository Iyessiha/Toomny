import Link from "next/link";
import Image from "next/image";
import { formatMoney } from "@/lib/money";
import { getCatalogTexts } from "@/i18n/catalog";
import type { Locale } from "@/i18n/dictionaries";
import type { ProviderCardData } from "@/lib/provider-search";

/**
 * Carte prestataire : bande de couverture, photo qui ne chevauche jamais le texte, statut,
 * note, commandes, compétences et tarif alignés en bas. Utilisée sur la landing et /prestataires.
 */
export function ProviderCard({ p, locale }: { p: ProviderCardData; locale: Locale }) {
  const t = getCatalogTexts(locale);
  const initials = p.name.slice(0, 2).toUpperCase();
  const place = [p.city, p.country].filter(Boolean).join(", ");
  const skills = p.skills.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 3);
  const statusLabel = p.businessType === "company" ? t.cardCompany : t.cardIndividual;

  return (
    <Link
      href={`/prestataires/${p.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/[0.06]"
    >
      <div className="relative h-24 bg-gradient-to-br from-[#dff3e7] to-[#bfe6cf]">
        {p.boosted && (
          <span className="absolute right-3 top-3 rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-950">
            ★ {t.featured}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 px-5 pb-5">
        <div className="-mt-9 flex items-end gap-3">
          {p.avatar ? (
            <Image src={p.avatar} alt={p.name} width={72} height={72} className="h-[72px] w-[72px] flex-none rounded-full border-4 border-[var(--surface)] object-cover" />
          ) : (
            <span aria-hidden className="flex h-[72px] w-[72px] flex-none items-center justify-center rounded-full border-4 border-[var(--surface)] bg-[var(--color-brand-500)] text-xl font-bold text-white">
              {initials}
            </span>
          )}
          <div className="min-w-0 pb-1">
            <p className="truncate text-base font-bold">{p.name}</p>
            <p className="truncate text-xs text-[var(--subtle)]">{place}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-[var(--color-brand-600)]">
          {p.verified && <span title={t.cardVerified}>✓ {t.cardVerified} ·</span>}
          <span className="text-[var(--subtle)]">{statusLabel}</span>
        </div>

        {(p.headline || p.companyName) && (
          <p className="line-clamp-2 text-sm leading-relaxed text-[var(--foreground)]">
            {p.headline ?? p.companyName}
          </p>
        )}

        <p className="text-sm font-semibold">
          {p.rating !== null ? `★ ${p.rating.toFixed(1)}` : `★ ${t.cardNew}`}
          {p.ratingCount > 0 && <span className="font-medium text-[var(--subtle)]"> ({p.ratingCount} {t.cardReviews})</span>}
          <span className="text-[var(--subtle)]"> · {p.received} {t.cardOrders}</span>
        </p>

        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {skills.map((skill) => (
              <span key={skill} className="rounded-full bg-[var(--background)] px-2.5 py-1 text-xs text-[var(--foreground)]">
                {skill}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-[var(--border)] pt-4">
          <div>
            {p.fromPriceMinor !== null && (
              <>
                <p className="text-[10px] uppercase tracking-wide text-[var(--subtle)]">{t.cardFrom}</p>
                <p className="font-display text-base font-extrabold">{formatMoney(BigInt(p.fromPriceMinor), "XOF", locale)}</p>
              </>
            )}
          </div>
          <span className="rounded-full bg-[var(--color-brand-500)] px-4 py-2 text-sm font-semibold text-white">{t.viewProfile}</span>
        </div>
      </div>
    </Link>
  );
}
