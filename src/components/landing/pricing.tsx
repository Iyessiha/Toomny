import Link from "next/link";
import { getLanding } from "@/content/landing";
import type { Locale } from "@/i18n/dictionaries";

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export function Pricing({ locale = "fr" }: { locale?: Locale }) {
  const t = getLanding(locale).pricing;

  return (
    <section id="tarifs" className="border-t border-[rgba(34,197,94,0.06)] bg-[var(--surface)]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">

        {/* Header */}
        <div data-reveal className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-brand-600)]">
            {t.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">{t.title}</h2>
          <p className="mt-4 text-lg leading-relaxed text-[var(--subtle)]">{t.lead}</p>
        </div>

        {/* Client note — always free */}
        <div
          data-reveal
          className="mt-8 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 dark:border-emerald-900 dark:bg-emerald-950/30"
        >
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <div>
            <p className="font-semibold text-emerald-800 dark:text-emerald-200">{t.clientNote}</p>
            <p className="mt-0.5 text-sm text-emerald-700 dark:text-emerald-300">{t.clientNoteDetail}</p>
          </div>
        </div>

        {/* Provider plans */}
        <p data-reveal className="mb-5 mt-14 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--subtle)]">
          {t.plansFor}
        </p>
        <div className="pricing-scene grid gap-5 sm:grid-cols-3">
          {t.plans.map((plan) => (
            <div
              key={plan.name}
              data-reveal
              className={`pricing-card-gloss relative flex flex-col rounded-2xl p-6 ${
                plan.highlight
                  ? "pricing-card-hl border border-[var(--color-brand-300)] bg-[var(--color-brand-50)] shadow-[0_0_0_1px_var(--color-brand-200),0_20px_60px_rgba(0,0,0,0.15)]"
                  : "pricing-card border border-[var(--border)] bg-[var(--background)] shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-[var(--color-brand-600)] to-[var(--color-brand-500)] px-3.5 py-1 text-xs font-bold text-white shadow-[0_4px_16px_rgba(16,128,67,0.4)]">
                  {plan.badge}
                </span>
              )}

              {/* Plan name */}
              <p className={`font-display text-lg font-bold ${plan.highlight ? "text-[var(--color-brand-700)]" : ""}`}>
                {plan.name}
              </p>

              {/* Commission pill */}
              <div
                className={`mt-4 inline-flex w-fit items-center gap-2 rounded-xl px-3 py-2 ${
                  plan.highlight ? "bg-[var(--color-brand-100)] border border-[var(--color-brand-200)]" : "bg-[var(--surface)] border border-[var(--border)]"
                }`}
              >
                <span className="font-display text-2xl font-bold text-[var(--color-brand-600)]">
                  {plan.commission}
                </span>
                <span className="text-sm text-[var(--subtle)]">commission</span>
              </div>

              {/* Price */}
              <div className="mt-5">
                <span className="font-display text-2xl font-bold">{plan.price}</span>
                <span className="ml-1.5 text-sm text-[var(--subtle)]">{plan.priceNote}</span>
              </div>

              {/* Separator */}
              <hr className="my-5 border-white/[0.06]" />

              {/* Features */}
              <ul className="flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <span className="shrink-0 font-bold text-[var(--color-brand-500)]"><CheckIcon /></span>
                    <span className={plan.highlight ? "text-[var(--foreground)]" : "text-[var(--subtle)]"}>{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={plan.href}
                className={`relative z-[2] mt-7 block rounded-full px-4 py-3 text-center text-sm font-semibold transition-all duration-150 ${
                  plan.highlight
                    ? "bg-gradient-to-r from-[var(--color-brand-600)] to-[var(--color-brand-500)] text-white shadow-[0_4px_16px_rgba(16,128,67,0.35),0_1px_0_rgba(255,255,255,0.15)_inset] hover:opacity-90 hover:-translate-y-px"
                    : "border border-[var(--color-brand-300)] text-[var(--color-brand-600)] hover:bg-[var(--color-brand-50)]"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <div className="mt-20">
          <p data-reveal className="mb-6 text-base font-bold">{t.compareTitle}</p>

          {/* Desktop */}
          <div
            data-reveal
            className="hidden overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] lg:block"
          >
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-6 py-4 font-medium text-[var(--subtle)]"></th>
                  <th className="px-6 py-4 font-display text-sm font-bold">Fiverr</th>
                  <th className="px-6 py-4 font-display text-sm font-bold">Upwork</th>
                  <th className="bg-[var(--color-brand-500)] px-6 py-4 font-display text-sm font-bold text-white">
                    Toomny
                  </th>
                </tr>
              </thead>
              <tbody>
                {t.rows.map((r, i) => (
                  <tr
                    key={r.label}
                    className={i < t.rows.length - 1 ? "border-b border-[var(--border)]" : ""}
                  >
                    <td className="px-6 py-4 font-medium">{r.label}</td>
                    <td className="px-6 py-4 text-[var(--subtle)]">{r.fiverr}</td>
                    <td className="px-6 py-4 text-[var(--subtle)]">{r.upwork as string}</td>
                    <td className="bg-[var(--color-brand-50)] px-6 py-4 font-semibold text-[var(--color-brand-700)]">
                      {r.toomny}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="mt-4 grid gap-3 lg:hidden">
            {t.rows.map((r) => (
              <div
                key={r.label}
                data-reveal
                className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4"
              >
                <p className="text-sm font-semibold">{r.label}</p>
                <dl className="mt-2.5 space-y-1 text-xs">
                  <div className="flex justify-between gap-4">
                    <dt className="text-[var(--subtle)]">Fiverr</dt>
                    <dd className="text-right text-[var(--subtle)]">{r.fiverr}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[var(--subtle)]">Upwork</dt>
                    <dd className="text-right text-[var(--subtle)]">{r.upwork as string}</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-[var(--border)] pt-1">
                    <dt className="font-semibold text-[var(--color-brand-700)]">Toomny</dt>
                    <dd className="text-right font-semibold text-[var(--color-brand-700)]">
                      {r.toomny}
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </div>

        <p data-reveal className="mt-6 text-xs leading-relaxed text-[var(--subtle)]">
          {t.sourcesPrefix}
          {t.sourceA}
          {t.sourcesMid}
          {t.sourceB}
          {t.sourcesSuffix}
        </p>
      </div>
    </section>
  );
}
