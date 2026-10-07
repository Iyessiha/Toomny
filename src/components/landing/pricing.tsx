import { getLanding } from "@/content/landing";
import type { Locale } from "@/i18n/dictionaries";

export function Pricing({ locale = "fr" }: { locale?: Locale }) {
  const t = getLanding(locale).pricing;
  const ROWS = t.rows;

  return (
    <section id="tarifs" className="border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div data-reveal className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-brand-600)]">
            {t.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
            {t.title}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-[var(--subtle)]">{t.lead}</p>
        </div>

        {/* Desktop : tableau. Mobile : cartes empilées, car un tableau à quatre
            colonnes est illisible sur 390 px. */}
        <div data-reveal className="mt-12 hidden overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] lg:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-6 py-5 font-medium text-[var(--subtle)]"> </th>
                <th className="px-6 py-5 font-display text-base font-bold">Fiverr</th>
                <th className="px-6 py-5 font-display text-base font-bold">Upwork</th>
                <th className="bg-[var(--color-brand-500)] px-6 py-5 font-display text-base font-bold text-white">
                  Toomny
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r, i) => (
                <tr key={r.label} className={i < ROWS.length - 1 ? "border-b border-[var(--border)]" : ""}>
                  <td className="px-6 py-5 font-medium">{r.label}</td>
                  <td className="px-6 py-5 text-[var(--subtle)]">{r.fiverr}</td>
                  <td className="px-6 py-5 text-[var(--subtle)]">{r.upwork}</td>
                  <td className="bg-[var(--color-brand-50)] px-6 py-5 font-semibold text-[var(--color-brand-700)]">
                    {r.toomny}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-10 grid gap-4 lg:hidden">
          {ROWS.map((r) => (
            <div key={r.label} data-reveal className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
              <p className="font-display font-bold">{r.label}</p>
              <dl className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--subtle)]">Fiverr</dt>
                  <dd className="text-right text-[var(--subtle)]">{r.fiverr}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--subtle)]">Upwork</dt>
                  <dd className="text-right text-[var(--subtle)]">{r.upwork}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-[var(--border)] pt-1.5">
                  <dt className="font-semibold text-[var(--color-brand-700)]">Toomny</dt>
                  <dd className="text-right font-semibold text-[var(--color-brand-700)]">{r.toomny}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>

        <p data-reveal className="mt-6 text-xs leading-relaxed text-[var(--subtle)]">
          {t.sourcesPrefix}
          <a href="https://www.jobbers.io/?p=53038" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
            {t.sourceA}
          </a>
          {t.sourcesMid}
          <a href="https://vaultleap.com/blog/payoneer-fees-explained-2026" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
            {t.sourceB}
          </a>
          {t.sourcesSuffix}
        </p>
      </div>
    </section>
  );
}
