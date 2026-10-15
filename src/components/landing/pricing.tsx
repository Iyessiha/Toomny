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
        <div className="grid gap-5 sm:grid-cols-3">
          {t.plans.map((plan) => (
            <div
              key={plan.name}
              data-reveal
              className={`relative flex flex-col rounded-2xl p-6 text-white transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/30 ${
                plan.highlight
                  ? "border border-[rgba(34,197,94,0.35)] bg-[linear-gradient(160deg,rgba(22,163,74,0.22)_0%,rgba(11,25,18,0.92)_60%)] shadow-[0_0_0_1px_rgba(34,197,94,0.15),0_24px_56px_rgba(0,0,0,0.35)]"
                  : "border border-[rgba(255,255,255,0.07)] bg-[rgba(11,25,18,0.85)]"
              }`}
            >
              {plan.badge && (
                <span
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#22c55e] px-3.5 py-1 text-xs font-bold text-white shadow-[0_4px_16px_rgba(34,197,94,0.4)]"
                >
                  {plan.badge}
                </span>
              )}

              {/* Plan name */}
              <p className={`font-display text-lg font-bold ${plan.highlight ? "text-[#4ade80]" : "text-white"}`}>
                {plan.name}
              </p>

              {/* Commission pill */}
              <div
                className={`mt-4 inline-flex w-fit items-center gap-2 rounded-xl px-3 py-2 ${
                  plan.highlight ? "bg-[rgba(34,197,94,0.15)]" : "bg-[rgba(34,197,94,0.07)]"
                }`}
              >
                <span className="font-display text-2xl font-bold text-[#22c55e]">
                  {plan.commission}
                </span>
                <span className="text-sm text-white/60">
                  commission
                </span>
              </div>

              {/* Price */}
              <div className="mt-5">
                <span className="font-display text-2xl font-bold text-white">
                  {plan.price}
                </span>
                <span className="ml-1.5 text-sm text-white/55">
                  {plan.priceNote}
                </span>
              </div>

              {/* Features */}
              <ul className="mt-5 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <span className="shrink-0 font-bold text-[#22c55e]">
                      <CheckIcon />
                    </span>
                    <span className="text-white/70">{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={plan.href}
                className={`mt-7 block rounded-full px-4 py-3 text-center text-sm font-semibold transition-all duration-150 ${
                  plan.highlight
                    ? "bg-[#22c55e] text-white shadow-[0_4px_16px_rgba(34,197,94,0.35)] hover:bg-[#16a34a] hover:-translate-y-px"
                    : "border border-[rgba(34,197,94,0.3)] text-[#22c55e] hover:bg-[rgba(34,197,94,0.08)]"
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
                  <th className="px-6 py-4 font-display text-sm font-bold">ComeUp</th>
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
                    <dt className="text-[var(--subtle)]">ComeUp</dt>
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
          <a
            href="https://www.jobbers.io/?p=53038"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            {t.sourceA}
          </a>
          {t.sourcesMid}
          <a
            href="https://vaultleap.com/blog/payoneer-fees-explained-2026"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            {t.sourceB}
          </a>
          {t.sourcesSuffix}
        </p>
      </div>
    </section>
  );
}
