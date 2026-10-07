import { Header } from "./header";
import { Hero } from "./hero";
import { Pricing } from "./pricing";
import { HowItWorks } from "./how-it-works";
import { Categories } from "./categories";
import { Security } from "./security";
import { Faq } from "./faq";
import { FinalCta } from "./cta";
import { Footer } from "./footer";
import type { Locale } from "@/i18n/dictionaries";

/** Une seule composition, deux langues : aucun risque de divergence. */
export function LandingPage({ locale }: { locale: Locale }) {
  return (
    <>
      <Header locale={locale} />
      <main>
        <Hero locale={locale} />
        <HowItWorks locale={locale} />
        <Pricing locale={locale} />
        <Categories locale={locale} />
        <Security locale={locale} />
        <Faq locale={locale} />
        <FinalCta locale={locale} />
      </main>
      <Footer locale={locale} />
    </>
  );
}
