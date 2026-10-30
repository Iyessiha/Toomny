import Link from "next/link";
import Image from "next/image";
import type { ProviderCardData } from "@/lib/provider-search";

type Labels = {
  profile: string;
  verified: string;
  featured: string;
  rating: string;
  ordersReceived: string;
  services: string;
};

/** Carte d'un prestataire : photo, nom, métier, notes et commandes. Même rendu partout. */
export function ProviderCard({ p, labels }: { p: ProviderCardData; labels: Labels }) {
  const initials = p.name.slice(0, 2).toUpperCase();
  const place = [p.city, p.country].filter(Boolean).join(" · ");

  return (
    <Link
      href={`/prestataires/${p.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-brand-300)] hover:shadow-xl hover:shadow-black/[0.06]"
    >
      <div className="relative h-16 bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-700,#0b5d30)]">
        {p.boosted && (
          <span className="absolute right-3 top-3 rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-950">
            ★ {labels.featured}
          </span>
        )}
      </div>

      <div className="-mt-9 flex flex-1 flex-col gap-3 px-5 pb-5">
        <div className="flex items-end gap-3">
          {p.avatar ? (
            <Image src={p.avatar} alt={p.name} width={72} height={72} className="h-18 w-18 rounded-2xl border-4 border-[var(--surface)] object-cover shadow-md" />
          ) : (
            <span
              aria-hidden
              className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl border-4 border-[var(--surface)] bg-[var(--color-brand-100)] text-xl font-extrabold text-[var(--color-brand-700)] shadow-md"
            >
              {initials}
            </span>
          )}
          <div className="min-w-0 pb-1">
            <p className="flex items-center gap-1.5 truncate font-display text-base font-bold">
              {p.name}
              {p.verified && (
                <span title={labels.verified} className="flex h-4 w-4 flex-none items-center justify-center rounded-full bg-[var(--color-brand-500)] text-[9px] font-bold text-white">✓</span>
              )}
            </p>
            <p className="truncate text-xs text-[var(--subtle)]">{place}</p>
          </div>
        </div>

        {p.headline && <p className="line-clamp-2 text-sm leading-relaxed text-[var(--subtle)]">{p.headline}</p>}

        <dl className="mt-auto grid grid-cols-3 gap-2 rounded-2xl bg-[var(--background)] p-3 text-center">
          <div>
            <dt className="text-[10px] uppercase tracking-wide text-[var(--subtle)]">{labels.rating}</dt>
            <dd className="font-display text-sm font-extrabold">{p.rating !== null ? `★ ${p.rating.toFixed(1)}` : "—"}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wide text-[var(--subtle)]">{labels.ordersReceived}</dt>
            <dd className="font-display text-sm font-extrabold">{p.received}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wide text-[var(--subtle)]">{labels.services}</dt>
            <dd className="font-display text-sm font-extrabold">{p.services}</dd>
          </div>
        </dl>

        <span className="text-sm font-semibold text-[var(--color-brand-600)] group-hover:underline">{labels.profile} →</span>
      </div>
    </Link>
  );
}
