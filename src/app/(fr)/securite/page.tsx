import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { getLanding } from "@/content/landing";
import { visitorLocale } from "@/i18n/server-locale";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Sécurité — Toomny",
    description:
      "Votre paiement est conservé par un établissement agréé. Identité vérifiée, litige arbitré en français, versement automatique sous 72 h.",
  };
}

export default async function SecurityPage() {
  const locale = await visitorLocale();
  const t = getLanding(locale);
  const s = t.security;

  const flowIcons = ["💳", "🔒", "📦", "✅"];

  return (
    <>
      <Header locale={locale} />
      <main>
        {/* Hero */}
        <section className="border-b border-[var(--border)] bg-[var(--surface)] py-16 text-center">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-brand-500)]">
              {s.eyebrow}
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold leading-tight sm:text-5xl">
              {s.title}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[var(--subtle)]">{s.lead}</p>
          </div>
        </section>

        {/* Payment flow */}
        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <h2 className="text-center font-display text-2xl font-bold">{s.flowTitle}</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {s.flow.map((step, i) => (
              <div key={i} className="relative flex flex-col items-center rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 text-center">
                <span className="text-3xl" aria-hidden>{flowIcons[i]}</span>
                <span className="mt-1 text-xs font-bold text-[var(--color-brand-500)]">
                  {i + 1}
                </span>
                <p className="mt-3 text-sm font-medium leading-snug">{step}</p>
                {i < s.flow.length - 1 && (
                  <span
                    className="absolute -right-2.5 top-1/2 hidden -translate-y-1/2 text-xl text-[var(--border)] lg:block"
                    aria-hidden
                  >
                    →
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Guarantees */}
        <section className="border-t border-[var(--border)] bg-[var(--surface)] py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="grid gap-6 sm:grid-cols-2">
              {s.guarantees.map((g, i) => {
                const icons = ["🏦", "🪪", "⚖️", "⏱️"];
                return (
                  <div
                    key={i}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6"
                  >
                    <span className="text-2xl" aria-hidden>{icons[i]}</span>
                    <h3 className="mt-3 font-display text-lg font-bold">{g.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--subtle)]">{g.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ excerpt */}
        <section className="py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="font-display text-2xl font-bold">{t.faq.title}</h2>
            <dl className="mt-8 divide-y divide-[var(--border)]">
              {t.faq.items.slice(2, 6).map((item) => (
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
                href="/auth"
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
