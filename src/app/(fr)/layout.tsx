import type { Metadata, Viewport } from "next";
import { RootShell } from "@/lib/root-layout";
import { getPublicPageTexts } from "@/i18n/public-pages";
import { visitorLocale } from "@/i18n/server-locale";
import "../globals.css";

/**
 * Le groupe (fr) sert les deux langues selon le cookie du visiteur : `lang` et
 * les métadonnées suivent la langue réelle de la page, et non un libellé figé.
 * Les URL /en restent dans le groupe (en).
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = getPublicPageTexts(await visitorLocale()).site;
  return {
    title: { default: t.title, template: "%s · Toomny" },
    description: t.description,
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://toomny.com"),
    alternates: { canonical: "/", languages: { "fr-FR": "/", "en-US": "/en" } },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      siteName: "Toomny",
      title: t.ogTitle,
      description: t.ogDescription,
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#108043",
};

export default async function FrLayout({ children }: { children: React.ReactNode }) {
  return <RootShell locale={await visitorLocale()}>{children}</RootShell>;
}
