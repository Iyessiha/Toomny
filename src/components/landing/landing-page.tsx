import { Header } from "./header";
import { Hero } from "./hero";
import { TrustBar } from "./trust-bar";
import { TalentStrip } from "./talent-strip";
import { Categories } from "./categories";
import { FeaturedServices } from "./featured-services";
import { HowItWorks } from "./how-it-works";
import { BoostSection } from "./boost-section";
import { MarketingPopup } from "./marketing-popup";
import { Pricing } from "./pricing";
import { Security } from "./security";
import { ProvidersPreview } from "./providers-preview";
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
        <TrustBar locale={locale} />
        <TalentStrip locale={locale} />
        <Categories locale={locale} />
        <FeaturedServices locale={locale} />
        <HowItWorks locale={locale} />
        <BoostSection locale={locale} />
        <Pricing locale={locale} />
        <Security locale={locale} />
        <ProvidersPreview locale={locale} />
        <Faq locale={locale} />
        <FinalCta locale={locale} />
      </main>
      <Footer locale={locale} />
      <MarketingPopup locale={locale} />
    </>
  );
}
