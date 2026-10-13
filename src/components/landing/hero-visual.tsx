import Image from "next/image";
import { getLanding } from "@/content/landing";
import type { Locale } from "@/i18n/dictionaries";

/** Star rating row */
function Stars({ n = 5 }: { n?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="11" height="11" viewBox="0 0 24 24" aria-hidden>
          <path
            fill={i < n ? "#FFCB00" : "#e2e8f0"}
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z"
          />
        </svg>
      ))}
    </div>
  );
}

export function HeroVisual({ locale = "fr" }: { locale?: Locale }) {
  const t = getLanding(locale).visual;

  return (
    <div className="relative select-none" aria-hidden>
      {/* ── Badge flottant haut-droite : identité vérifiée ── */}
      <div className="float-b absolute -right-4 -top-3 z-20 hidden items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 shadow-[var(--shadow-lg)] sm:flex">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-bold text-green-700">{t.verified}</p>
          <p className="text-[10px] text-[var(--subtle)]">KYC approuvé</p>
        </div>
      </div>

      {/* ── Carte service principale ── */}
      <div className="w-[300px] overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-xl)] sm:w-[340px]">

        {/* Cover photo réelle + overlay gradient */}
        <div className="relative flex h-36 items-end p-4">
          <Image
            src="/images/hero-provider.jpg"
            alt=""
            fill
            className="object-cover object-top"
            priority
            sizes="340px"
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: "linear-gradient(160deg, rgba(107,70,193,0.55) 0%, rgba(8,145,178,0.7) 100%)" }}
          />
          {/* Watermark SVG Toomny mark en fond */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-10">
            <svg viewBox="0 0 120 120" width="100" height="100" fill="none">
              <circle cx="43" cy="22" r="11.5" fill="white"/>
              <circle cx="77" cy="22" r="11.5" fill="white"/>
              <g fill="none" stroke="white" strokeWidth="9" strokeLinecap="butt">
                <path d="M74 50C62 34 32 37 29 58C26 79 47 87 54 100"/>
                <path d="M46 50C58 34 88 37 91 58C94 79 73 87 66 100"/>
              </g>
            </svg>
          </div>

          {/* Category pill */}
          <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 backdrop-blur-sm">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="13.5" cy="6.5" r="3.5"/><circle cx="6.5" cy="17.5" r="3.5"/><path d="m4 4 16 16"/>
            </svg>
            <span className="text-[10px] font-semibold text-white">Design graphique</span>
          </div>

          {/* Badge "En vedette" */}
          <div className="absolute right-4 top-4 rounded-full bg-[#FFCB00] px-2.5 py-0.5">
            <span className="text-[10px] font-bold text-amber-900">✦ Vedette</span>
          </div>

          {/* Title at bottom */}
          <div className="relative z-10">
            <p className="text-sm font-bold leading-tight text-white drop-shadow">{t.serviceTitle}</p>
          </div>
        </div>

        {/* Infos prestataire */}
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3.5">
          <div className="relative">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-[var(--background)]">
              <Image src="/images/hero-provider.jpg" alt="Awa Konaté" fill className="object-cover object-top" sizes="40px" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-[var(--background)] bg-green-500 text-[8px] text-white">✓</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-semibold">Awa Konaté</p>
              <span className="text-[11px]">🇨🇮</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Stars n={5} />
              <span className="text-[11px] text-[var(--subtle)]">4.9 · 47 avis</span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] text-[var(--subtle)]">Délai</p>
            <p className="text-xs font-bold">5 jours</p>
          </div>
        </div>

        {/* Prix + CTA */}
        <div className="flex items-center justify-between gap-3 px-4 py-3.5">
          <div>
            <p className="text-[10px] text-[var(--subtle)]">À partir de</p>
            <p className="font-display text-lg font-extrabold text-[var(--color-brand-600)]">
              150 000 <span className="text-sm font-semibold text-[var(--subtle)]">FCFA</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-[var(--color-brand-500)] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[var(--color-brand-500)]/25">
            Commander
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Escrow progress bar */}
        <div className="border-t border-[var(--border)] px-4 py-3">
          <div className="flex items-center justify-between text-[10px] text-[var(--subtle)] mb-1.5">
            <span className="flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              {t.escrowBadge}
            </span>
            <span className="font-semibold text-[var(--color-brand-600)]">{t.step}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface)]">
            <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[var(--color-brand-400)] to-[var(--color-brand-600)]" />
          </div>
        </div>
      </div>

      {/* ── Badge flottant bas-gauche : versement ── */}
      <div className="float-a absolute -bottom-4 -left-6 z-20 w-52 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-3.5 shadow-[var(--shadow-lg)] sm:-left-10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-500)] text-white shadow-md">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m5 13 4 4L19 7" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="font-display text-xs font-bold text-[var(--color-brand-700)]">{t.payoutTitle}</p>
            <p className="truncate text-[10px] text-[var(--subtle)]">{t.payoutMeta}</p>
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 rounded-xl bg-[var(--surface)] px-2.5 py-1.5">
          <span className="h-2 w-2 rounded-full bg-[#FF8A00]" />
          <span className="text-[10px] font-semibold text-[var(--subtle)]">Wave · Mobile Money</span>
        </div>
      </div>
    </div>
  );
}
