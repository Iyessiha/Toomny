import { LandingPage } from "@/components/landing/landing-page";
import { FaqJsonLd } from "@/components/seo/json-ld";
import { getLanding } from "@/content/landing";
import { visitorLocale } from "@/i18n/server-locale";

export const dynamic = "force-dynamic";

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
