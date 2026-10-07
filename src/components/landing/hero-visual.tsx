import { Logo } from "@/components/ui/logo";
import { getLanding } from "@/content/landing";
import type { Locale } from "@/i18n/dictionaries";

/**
 * Visuel du hero : une composition de l'interface réelle du produit —
 * une commande sous séquestre et le versement qui suit.
 *
 * Volontairement construit en HTML et CSS plutôt qu'en image : c'est net sur
 * tout écran, ça pèse zéro octet de média sur une 3G, et ça ne montre aucune
 * fonctionnalité que le produit n'aura pas.
 */
export function HeroVisual({ locale = "fr" }: { locale?: Locale }) {
  const t = getLanding(locale).visual;
  return (
    <div className="relative select-none pb-20" aria-hidden>
      {/* Carte principale — une commande en cours */}
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-[0_24px_60px_-20px_rgba(10,23,16,0.18)]">
        <div className="flex items-center justify-between">
          <span className="text-[var(--color-brand-500)]">
            <Logo size={22} />
          </span>
          <span className="rounded-full bg-[var(--color-brand-50)] px-3 py-1 text-[11px] font-semibold text-[var(--color-brand-700)]">
            {t.escrowBadge}
          </span>
        </div>

        <div className="mt-6 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-100)] font-display text-sm font-bold text-[var(--color-brand-700)]">
            AK
          </div>
          <div className="min-w-0">
            <p className="font-display text-sm font-bold">{t.serviceTitle}</p>
            <p className="mt-0.5 text-xs text-[var(--subtle)]">
              {t.serviceMeta}
            </p>
          </div>
        </div>

        <dl className="mt-6 space-y-2.5 border-t border-[var(--border)] pt-5 text-sm">
          <div className="flex justify-between">
            <dt className="text-[var(--subtle)]">{t.amount}</dt>
            <dd className="font-semibold">{t.amountValue}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--subtle)]">{t.commission}</dt>
            <dd className="text-[var(--subtle)]">{t.commissionValue}</dd>
          </div>
          <div className="flex justify-between border-t border-[var(--border)] pt-2.5">
            <dt className="font-semibold">{t.net}</dt>
            <dd className="font-display font-bold text-[var(--color-brand-600)]">{t.netValue}</dd>
          </div>
        </dl>

        <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-strong)]">
          <div className="h-full w-2/3 rounded-full bg-[var(--color-brand-500)]" />
        </div>
        <p className="mt-2 text-[11px] text-[var(--subtle)]">
          {t.step}
        </p>
      </div>

      {/* Carte flottante — le versement */}
      <div className="absolute bottom-1 -left-6 w-[17rem] sm:-left-12 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4 shadow-[0_20px_44px_-18px_rgba(10,23,16,0.28)]">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-500)] text-white">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m5 13 4 4L19 7" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="font-display text-sm font-bold">{t.payoutTitle}</p>
            <p className="text-xs text-[var(--subtle)]">{t.payoutMeta}</p>
          </div>
        </div>
      </div>

      {/* Pastille flottante — la vérification */}
      <div className="absolute -right-3 -top-5 hidden items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] px-4 py-2 shadow-[0_14px_32px_-14px_rgba(10,23,16,0.25)] sm:flex">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--color-brand-500)]" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        </svg>
        <span className="text-xs font-semibold">{t.verified}</span>
      </div>
    </div>
  );
}
