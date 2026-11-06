import type { Metadata } from "next";
import { redirect } from "next/navigation";
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
  // Serveur d'aperçu uniquement : PREVIEW_GLASSY=1 renvoie la racine vers la
  // maquette « Aurora Glass », pour qu'elle soit visible dès l'ouverture de
  // l'aperçu sans avoir à taper /design-glassy. Jamais définie ailleurs.
  if (process.env.PREVIEW_GLASSY === "1") redirect("/design-glassy");

  const locale = await visitorLocale();
  const faqItems = getLanding(locale).faq.items;
  return (
    <>
      <FaqJsonLd items={faqItems} />
      <LandingPage locale={locale} />
    </>
  );
}
