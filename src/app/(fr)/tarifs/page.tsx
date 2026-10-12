import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { getLanding } from "@/content/landing";
import { visitorLocale } from "@/i18n/server-locale";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Tarifs — Toomny",
    description:
      "Dès 5 % de commission côté prestataire, 0 % côté client. Plans Essentiel, Pro et Expert. Versement direct en mobile money.",
  };
}

export default async function PricingPage() {
  const locale = await visitorLocale();
  const t = getLanding(locale);
  const p = t.pricing;
  const faqItems = t.faq.items.filter((_, i) => i === 3 || i === 0 || i === 1 || i === 2);

  const highlights =
    locale === "en"
      ? [
          { value: "From 5%", label: "Commission on the provider side" },
          { value: "0%", label: "Fees on the client side" },
          { value: "Free", label: "Listing and applying" },
          { value: "Direct", label: "Payout to your mobile money" },
        ]
      : [
          { value: "Dès 5 %", label: "Commission côté prestataire" },
          { value: "0 %", label: "Frais côté client" },
          { value: "Gratuit", label: "Publication et candidature" },
          { value: "Direct", label: "Versement sur votre mobile money" },
        ];

  return (
    <>
      <Header locale={locale} />
      <main>
        {/* Hero */}
        <section className="border-b border-[var(--border)] bg-[var(--surface)] py-16 text-center">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-brand-500)]">
              {p.eyebrow}
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold leading-tight sm:text-5xl">
              {p.title}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[var(--subtle)]">{p.lead}</p>
          </div>
        </section>

        {/* Key numbers */}
        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {highlights.map((h) => (
              <div
                key={h.label}
                className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 text-center"
              >
                <p className="font-display text-4xl font-bold text-[var(--color-brand-500)]">
                  {h.value}
                </p>
                <p className="mt-1 text-sm text-[var(--subtle)]">{h.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Comparison table */}
        <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
          <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
                  <th className="px-5 py-4 text-left font-semibold">&nbsp;</th>
                  <th className="px-5 py-4 text-center font-semibold text-[var(--subtle)]">Fiverr</th>
                  <th className="px-5 py-4 text-center font-semibold text-[var(--subtle)]">ComeUp</th>
                  <th className="px-5 py-4 text-center font-bold text-[var(--color-brand-600)]">
                    Toomny
                  </th>
                </tr>
              </thead>
              <tbody>
                {p.rows.map((row, i) => (
                  <tr
                    key={row.label}
                    className={`border-b border-[var(--border)] last:border-0 ${i % 2 === 0 ? "" : "bg-[var(--surface)]"}`}
                  >
                    <td className="px-5 py-4 font-medium">{row.label}</td>
                    <td className="px-5 py-4 text-center text-[var(--subtle)]">{row.fiverr}</td>
                    <td className="px-5 py-4 text-center text-[var(--subtle)]">{row.upwork}</td>
                    <td className="px-5 py-4 text-center font-semibold text-[var(--color-brand-600)]">
                      {row.toomny}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-[var(--subtle)]">
            {p.sourcesPrefix}
            <span className="italic">{p.sourceA}</span>
            {p.sourcesMid}
            <span className="italic">{p.sourceB}</span>
            {p.sourcesSuffix}
          </p>
        </section>

        {/* FAQ excerpt */}
        <section className="border-t border-[var(--border)] bg-[var(--surface)] py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="font-display text-2xl font-bold">{t.faq.title}</h2>
            <dl className="mt-8 divide-y divide-[var(--border)]">
              {faqItems.map((item) => (
                <div key={item.q} className="py-5">
                  <dt className="font-semibold">{item.q}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-[var(--subtle)]">{item.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-[var(--border)] bg-[var(--color-brand-50)] py-16 text-center">
          <div className="mx-auto max-w-xl px-4 sm:px-6">
            <h2 className="font-display text-2xl font-bold">{t.cta.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--subtle)]">{t.cta.lead}</p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/auth?role=provider"
                className="rounded-full bg-[var(--color-brand-500)] px-8 py-3.5 text-sm font-semibold text-white transition-transform hover:scale-[1.03]"
              >
                {t.cta.primary}
              </Link>
              <Link
                href="/services"
                className="rounded-full border border-[var(--border)] px-8 py-3.5 text-sm font-semibold transition-colors hover:border-[var(--color-brand-400)]"
              >
                {t.cta.secondary}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </>
  );
}
