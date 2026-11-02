import { headers } from "next/headers";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { MotionProvider } from "@/components/motion-provider";
import { SwRegister } from "@/components/pwa/sw-register";
import { PwaInstallBanner } from "@/components/pwa/install-banner";
import type { Locale } from "@/i18n/dictionaries";
import { getPixelSettings } from "@/lib/pixels-server";
import { PixelScripts } from "@/components/analytics/pixel-scripts";
import { Analytics } from "@vercel/analytics/next";

// next/font héberge les fichiers au build : zéro requête vers Google au
// runtime, ce qui compte sur les réseaux lents de nos marchés.
const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const text = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-text",
  display: "swap",
});

/**
 * Corps commun aux deux layouts racine.
 *
 * Le français et l'anglais ont chacun leur groupe de routes, donc chacun son
 * `<html lang>` correct dès le HTML servi — un attribut de langue faux fait
 * lire la page avec les règles de prononciation de l'autre langue par un
 * lecteur d'écran, et brouille l'indexation.
 */
export async function RootShell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  // Nonce posé par le proxy pour la CSP : il autorise le script inline ci-dessous.
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang={locale} className={`${display.variable} ${text.variable}`} suppressHydrationWarning>
      <body>
        {/* Premier élément du corps : s'exécute avant que le reste du document
            ne soit analysé. On masque les blocs à révéler uniquement si le JS
            tourne ET que l'utilisateur accepte les animations. Sans JS, la
            classe n'est jamais posée et tout reste visible. */}
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html:
              "try{if(matchMedia('(prefers-reduced-motion: no-preference)').matches)document.documentElement.classList.add('js')}catch(e){}",
          }}
        />
        <LanguageProvider initialLocale={locale}>{children}</LanguageProvider>
        <MotionProvider />
        <SwRegister />
        <PwaInstallBanner />
        {/* Pixels publicitaires, configurés dans l'admin (/admin/pixels). */}
        <PixelScripts settings={await getPixelSettings()} />
        <Analytics />
      </body>
    </html>
  );
}
