import { getServices } from "@/lib/catalog";
import { ProvidersCarouselTrack } from "./providers-carousel";
import type { Locale } from "@/i18n/dictionaries";

const LABELS = {
  fr: {
    title: "Nos prestataires",
    subtitle: "Des talents vérifiés, prêts à travailler pour vous",
    cta: "Voir tous les prestataires →",
  },
  en: {
    title: "Our providers",
    subtitle: "Verified talent, ready to work for you",
    cta: "View all providers →",
  },
};

export async function ProvidersCarousel({ locale }: { locale: Locale }) {
  const services = await getServices({ sort: "recent" });
  if (services.length === 0) return null;

  const t = LABELS[locale];

  return (
    <ProvidersCarouselTrack
      services={services}
      locale={locale}
      title={t.title}
      subtitle={t.subtitle}
      ctaLabel={t.cta}
    />
  );
}
