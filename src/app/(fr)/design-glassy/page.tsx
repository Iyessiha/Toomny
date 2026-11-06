import type { Metadata } from "next";
import { visitorLocale } from "@/i18n/server-locale";
import { GlassyLanding } from "./glassy-landing";

/**
 * Page de comparaison : proposition « Aurora Glass ».
 *
 * Elle vit hors de la landing de production (`/`), pour comparer les deux
 * directions sans rien casser. `noindex` : c'est une maquette navigable,
 * pas un contenu public.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Proposition de design — Aurora Glass",
  robots: { index: false, follow: false },
};

export default async function DesignGlassyPage() {
  const locale = await visitorLocale();
  return <GlassyLanding locale={locale} />;
}
