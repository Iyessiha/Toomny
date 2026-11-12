import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";
import { FaqJsonLd } from "@/components/seo/json-ld";
import { getLanding } from "@/content/landing";
import { visitorLocale } from "@/i18n/server-locale";
import { getPublicPageTexts } from "@/i18n/public-pages";

export async function generateMetadata(): Promise<Metadata> {
  const t = getPublicPageTexts(await visitorLocale()).site;
  return {
    title: t.title,
    description: t.description,
    alternates: { canonical: "/" },
  };
}

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
    languages: { "fr-FR": "/", "en-US": "/en", "x-default": "/" },
  },
};

export default async function Home() {
  const locale = await visitorLocale();
  const faqItems = getLanding(locale).faq.items;
  return (
    <>
      <FaqJsonLd items={faqItems} />
      <LandingPage locale={locale} />
    </>
  );
}
