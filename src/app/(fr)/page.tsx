import type { Metadata } from "next";
import { FaqJsonLd } from "@/components/seo/json-ld";
import { getLanding } from "@/content/landing";
import { visitorLocale } from "@/i18n/server-locale";
import { getBoostedServices, getServices } from "@/lib/catalog";
import { interleaveByProvider } from "@/lib/interleave";
import { listPublicProviders } from "@/lib/provider-cards";
import { GlassyLanding } from "./design-glassy/glassy-landing";

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

  // Prestations et prestataires réels : la landing est la vitrine du site, pas
  // une démonstration. Les lectures échouent proprement hors ligne (bac à sable,
  // base en maintenance) et la page garde alors ses exemples.
  const [boosted, all, providers] = await Promise.all([
    getBoostedServices(4).catch(() => []),
    getServices({ sort: "recent" }).catch(() => []),
    listPublicProviders("Toomny").catch(() => []),
  ]);

  const services = interleaveByProvider(
    all.filter((s) => !boosted.some((b) => b.id === s.id)),
    (s) => s.provider?.id ?? s.id,
  ).slice(0, 6);

  return (
    <>
      <FaqJsonLd items={faqItems} />
      <GlassyLanding
        locale={locale}
        mode="production"
        services={services}
        providers={providers}
      />
    </>
  );
}
