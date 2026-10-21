import type { Metadata, Viewport } from "next";
import { RootShell } from "@/lib/root-layout";
import { getPublicPageTexts } from "@/i18n/public-pages";
import { visitorLocale } from "@/i18n/server-locale";
import { OrganizationJsonLd } from "@/components/seo/json-ld";
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
    openGraph: {
      type: "website",
      locale: "fr_FR",
      siteName: "Toomny",
      title: t.ogTitle,
      description: t.ogDescription,
    },
    twitter: {
      card: "summary_large_image",
      site: "@toomny",
      title: t.ogTitle,
      description: t.ogDescription,
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "Toomny",
      startupImage: "/icons/apple-touch-icon.png",
    },
    applicationName: "Toomny",
    manifest: "/manifest.webmanifest",
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#108043",
};

export default async function FrLayout({ children }: { children: React.ReactNode }) {
  return (
    <RootShell locale={await visitorLocale()}>
      <OrganizationJsonLd />
      {children}
    </RootShell>
  );
}
