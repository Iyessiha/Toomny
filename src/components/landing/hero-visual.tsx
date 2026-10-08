import { getLanding } from "@/content/landing";
import type { Locale } from "@/i18n/dictionaries";

export function HeroVisual({ locale = "fr" }: { locale?: Locale }) {
  const t = getLanding(locale).visual;
  return (
    <div className="relative select-none pb-20 pt-6" aria-hidden>
      {/* Badge flottant haut-droite : identité vérifiée */}
      <div className="float-b absolute -right-3 -top-2 hidden items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 shadow-[var(--shadow-md)] sm:flex">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-brand-50)] text-[var(--color-brand-600)]">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-bold">{t.verified}</p>
          <p className="text-[11px] text-[var(--subtle)]">KYC approuvé</p>
        </div>
      </div>

      {/* Carte principale — commande en séquestre */}
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-[var(--shadow-xl)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold">{t.serviceTitle}</p>
            <p className="mt-0.5 text-[11px] text-[var(--subtle)]">#TM-2024-0842</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-brand-50)] px-3 py-1 text-[11px] font-semibold text-[var(--color-brand-700)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand-500)]" />
            {t.escrowBadge}
          </span>
        </div>

        <div className="mt-5 flex items-center gap-3 rounded-xl bg-[var(--surface)] p-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-100)] font-display text-sm font-bold text-[var(--color-brand-700)]">
            AK
          </div>
          <div>
            <p className="text-sm font-semibold">{t.serviceMeta}</p>
            <p className="text-[11px] text-[var(--subtle)]">🇨🇮 Abidjan</p>
          </div>
        </div>

        <dl className="mt-5 space-y-2.5 border-t border-[var(--border)] pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-[var(--subtle)]">{t.amount}</dt>
            <dd className="font-semibold">{t.amountValue}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--subtle)]">{t.commission}</dt>
            <dd className="text-[var(--subtle)]">{t.commissionValue}</dd>
          </div>
          <div className="flex justify-between border-t border-[var(--border)] pt-2.5">
            <dt className="font-bold">{t.net}</dt>
            <dd className="font-display font-bold text-[var(--color-brand-600)]">{t.netValue}</dd>
          </div>
        </dl>

        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface)]">
          <div className="h-full w-2/3 rounded-full bg-[var(--color-brand-500)]" />
        </div>
        <p className="mt-1.5 text-[11px] text-[var(--subtle)]">{t.step}</p>
      </div>

      {/* Carte flottante bas-gauche : versement envoyé */}
      <div className="float-a absolute -bottom-2 -left-6 w-52 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4 shadow-[var(--shadow-lg)] sm:-left-12">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-500)] text-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m5 13 4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-display text-sm font-bold">{t.payoutTitle}</p>
            <p className="text-[11px] text-[var(--subtle)]">{t.payoutMeta}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
