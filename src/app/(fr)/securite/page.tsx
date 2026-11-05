import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { FeatureCards } from "@/components/features/feature-cards";
import { getLanding } from "@/content/landing";
import { visitorLocale } from "@/i18n/server-locale";
import { getPublicPageTexts } from "@/i18n/public-pages";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

export async function generateMetadata(): Promise<Metadata> {
  const t = getPublicPageTexts(await visitorLocale()).titles;
  return { title: t.security, description: t.securityDescription };
}

export default async function SecurityPage() {
  const locale = await visitorLocale();
  const t = getLanding(locale);
  const s = t.security;

  const flowIcons = ["💳", "🔒", "📦", "✅"];

  const breadcrumb =
    locale === "en"
      ? [{ name: "Home", href: "/en" }, { name: "Security", href: "/securite" }]
      : [{ name: "Accueil", href: "/" }, { name: "Sécurité", href: "/securite" }];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumb} />
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
          <div className="mt-10">
            <FeatureCards
              cards={s.flow.map((step, i) => ({
                title: `${i + 1}`,
                body: step,
                icon: flowIcons[i],
                index: undefined,
              }))}
              columns={4}
              showArrows
              variant="colorful"
            />
          </div>
        </section>

        {/* Guarantees */}
        <section className="border-t border-[var(--border)] bg-[var(--surface)] py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <FeatureCards
              cards={s.guarantees.map((g) => ({
                title: g.title,
                body: g.body,
                icon: ['🏦', '🪪', '⚖️', '⏱️'][s.guarantees.indexOf(g)],
              }))}
              columns={2}
              showArrows={false}
              variant="colorful"
            />
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
