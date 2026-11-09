import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Pricing } from "@/components/landing/pricing";
import { getLanding } from "@/content/landing";
import { visitorLocale } from "@/i18n/server-locale";
import { getPublicPageTexts } from "@/i18n/public-pages";
import { FaqJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";

export async function generateMetadata(): Promise<Metadata> {
  const t = getPublicPageTexts(await visitorLocale()).titles;
  return { title: t.pricing, description: t.pricingDescription };
}

export default async function PricingPage() {
  const locale = await visitorLocale();
  const t = getLanding(locale);
  const faqItems = t.faq.items.filter((_, i) => i === 3 || i === 0 || i === 1 || i === 2);

  const highlights =
    locale === "en"
      ? [
          { value: "From 3%", label: "Commission on the provider side" },
          { value: "0%", label: "Fees on the client side" },
          { value: "Free", label: "Listing and applying" },
          { value: "Direct", label: "Payout to your mobile money" },
        ]
      : [
          { value: "Dès 3 %", label: "Commission côté prestataire" },
          { value: "0 %", label: "Frais côté client" },
          { value: "Gratuit", label: "Publication et candidature" },
          { value: "Direct", label: "Versement sur votre mobile money" },
        ];

  const breadcrumb =
    locale === "en"
      ? [{ name: "Home", href: "/en" }, { name: "Pricing", href: "/tarifs" }]
      : [{ name: "Accueil", href: "/" }, { name: "Tarifs", href: "/tarifs" }];

  return (
    <>
      <FaqJsonLd items={faqItems} />
      <BreadcrumbJsonLd items={breadcrumb} />
      <Header locale={locale} />
      <main>
        {/* Tarifs complets : bandeau client, paliers, prestataires, commission, comparatif */}
        <Pricing locale={locale} />

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
                className="rounded-full btn-fill px-8 py-3.5 text-sm font-semibold text-white transition-transform hover:scale-[1.03]"
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
