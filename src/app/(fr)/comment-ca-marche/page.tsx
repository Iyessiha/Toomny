import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { getLanding } from "@/content/landing";
import { visitorLocale } from "@/i18n/server-locale";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Comment ça marche — Toomny",
    description:
      "Trois étapes pour recruter un prestataire ou vendre vos services en toute confiance, avec paiement en mobile money et séquestre automatique.",
  };
}

export default async function HowItWorksPage() {
  const locale = await visitorLocale();
  const t = getLanding(locale);
  const h = t.how;

  return (
    <>
      <Header locale={locale} />
      <main>
        {/* Hero */}
        <section className="border-b border-[var(--border)] bg-[var(--surface)] py-16 text-center">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-brand-500)]">
              {h.eyebrow}
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold leading-tight sm:text-5xl">
              {h.title}
            </h1>
          </div>
        </section>

        {/* Client steps */}
        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <h2 className="text-center font-display text-2xl font-bold sm:text-3xl">
            {h.tabs.client}
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {h.client.map((step, i) => (
              <div key={i} className="relative rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-brand-100)] text-sm font-bold text-[var(--color-brand-700)]"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <h3 className="mt-4 font-display text-lg font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--subtle)]">{step.body}</p>
                {i < h.client.length - 1 && (
                  <span className="absolute -right-4 top-10 hidden text-2xl text-[var(--border)] sm:block" aria-hidden>
                    →
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        <div className="border-t border-[var(--border)]" />

        {/* Provider steps */}
        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <h2 className="text-center font-display text-2xl font-bold sm:text-3xl">
            {h.tabs.provider}
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {h.provider.map((step, i) => (
              <div key={i} className="relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-brand-500)] text-sm font-bold text-white"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <h3 className="mt-4 font-display text-lg font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--subtle)]">{step.body}</p>
                {i < h.provider.length - 1 && (
                  <span className="absolute -right-4 top-10 hidden text-2xl text-[var(--border)] sm:block" aria-hidden>
                    →
                  </span>
                )}
              </div>
            ))}
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
