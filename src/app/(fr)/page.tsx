import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";
import { FaqJsonLd } from "@/components/seo/json-ld";
import { getLanding } from "@/content/landing";
import { visitorLocale } from "@/i18n/server-locale";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
    languages: { "fr-FR": "/", "en-US": "/en", "x-default": "/" },
  },
};

export default async function Home() {
  // La maquette « Aurora Glass » n'est plus une destination : son identité est
  // désormais celle du produit (voir la section Aurora de globals.css). La
  // racine sert donc la vraie landing.
  const locale = await visitorLocale();
  const faqItems = getLanding(locale).faq.items;
  return (
    <>
      <FaqJsonLd items={faqItems} />
      <LandingPage locale={locale} />
    </>
  );
}
