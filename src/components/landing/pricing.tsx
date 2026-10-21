import Link from "next/link";
import type { CSSProperties } from "react";
import { getLanding } from "@/content/landing";
import type { Locale } from "@/i18n/dictionaries";
import { formatMoney, splitOrderAmount } from "@/lib/money";

const CheckIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/** Ce que touche le prestataire sur une commande de 100 000 FCFA, frais compris. */
function providerNetLabel(commission: string, locale: Locale): string {
  const bps = Math.round(parseFloat(commission.replace(",", ".")) * 100);
  const { providerNetMinor } = splitOrderAmount(100_000n, bps);
  return formatMoney(providerNetMinor, "XOF", locale);
}

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

        {/* Client banner: the generous message, first */}
        <section
          data-reveal
          aria-labelledby="client-title"
          className="relative mt-10 grid items-center gap-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#ff5f6d] via-[#ff8a3d] to-[#ffb547] px-6 py-8 text-[#1a0a05] shadow-[0_30px_70px_-28px_rgba(255,95,109,0.6)] sm:grid-cols-[auto_1fr] sm:gap-8 sm:px-9"
        >
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-32 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.35),transparent_65%)]" />
          <p className="relative font-display text-[clamp(96px,16vw,152px)] font-black leading-[0.9] tracking-[-0.05em] text-white [text-shadow:0_10px_30px_rgba(120,20,0,0.35)] tabular-nums">
            0<span className="ml-1 align-top text-[0.42em]">%</span>
          </p>
          <div className="relative">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#5a1a00]">{t.clientKicker}</p>
            <h3 id="client-title" className="mt-1.5 text-balance text-2xl font-extrabold leading-tight tracking-[-0.02em] sm:text-3xl">
              {t.clientTitle}
            </h3>
            <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-[#3b1505]">{t.clientBody}</p>
          </div>
        </section>

        {/* Ladder: the path a provider climbs */}
        <nav aria-label={t.levelWord} data-reveal className="relative mt-14 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
          <div aria-hidden className="absolute left-2 right-2 top-[7px] hidden h-0.5 bg-gradient-to-r from-slate-400 via-emerald-400 to-amber-300 opacity-50 sm:block" />
          {t.levels.map((label, i) => (
            <div key={label} className={`tier-t${i + 1} relative pt-7 text-sm text-[var(--subtle)]`}>
              <span aria-hidden className="absolute left-0 top-0 h-4 w-4 rounded-full bg-[var(--c1)] shadow-[0_0_0_4px_var(--surface),0_0_22px_var(--plate-glow)]" />
              <b className="block text-base text-[var(--foreground)]">{label}</b>
              {t.levelWord} {i + 1} · {t.plans[i].name}
            </div>
          ))}
        </nav>

        {/* Plates: each level rises toward the viewer */}
        <div className="tier-scene mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-[18px]">
          {t.plans.map((plan, i) => {
            return (
              <div
                key={plan.name}
                className={`tier-slot tier-t${i + 1}`}
                style={{ "--i": i } as CSSProperties}
              >
                <article className="tier-plate">
                  {plan.badge && <span className="tier-badge">{plan.badge}</span>}
                  {i === 3 && <div aria-hidden className="tier-sheen" />}
                  <div className="tier-layer">
                    <span className="tier-level">
                      {t.levelWord} {i + 1} · {t.levels[i]}
                    </span>
                    <p className="mt-2 font-display text-2xl font-extrabold tracking-tight text-white">{plan.name}</p>
                    <p className="tier-tag">{t.taglines[i]}</p>

                    <div className="mt-[18px] font-display text-[26px] font-extrabold tabular-nums text-white">
                      {plan.price}
                      {plan.priceNote && (
                        <span className="ml-1.5 text-[13px] font-medium text-[#94a3b8]">{plan.priceNote}</span>
                      )}
                    </div>

                    <hr className="my-5 border-[rgba(148,163,184,0.18)]" />

                    <ul className="flex-1 space-y-2.5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm leading-snug text-[#e2e8f0]">
                          <span
                            aria-hidden
                            className="mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full text-[var(--ink)]"
                            style={{ background: "var(--c1)" }}
                          >
                            <CheckIcon />
                          </span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <p className="tier-fee">
                      <b>
                        {t.feeLabel} : {plan.commission} {t.perOrder}.
                      </b>{" "}
                      {t.receiveLabel} <strong>{providerNetLabel(plan.commission, locale)}</strong>.
                    </p>

                    <Link href={plan.href} className="tier-cta">
                      {plan.cta}
                    </Link>
                  </div>
                </article>
              </div>
            );
          })}
        </div>

        {/* How the commission works, in plain words */}
        <section data-reveal className="mt-16 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 sm:p-7">
          <h3 className="font-display text-lg font-bold">{t.howTitle}</h3>
          <ol className="mt-4 grid list-decimal gap-2.5 pl-5 text-sm leading-relaxed text-[var(--subtle)] marker:font-semibold marker:text-[var(--color-brand-600)]">
            {t.howSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

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
