import { headers } from "next/headers";
import localFont from "next/font/local";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { MotionProvider } from "@/components/motion-provider";
import { SwRegister } from "@/components/pwa/sw-register";
import { PwaInstallBanner } from "@/components/pwa/install-banner";
import type { Locale } from "@/i18n/dictionaries";
import { getPixelSettings } from "@/lib/pixels-server";
import { PixelScripts } from "@/components/analytics/pixel-scripts";
import { Analytics } from "@vercel/analytics/next";

// Polices auto-hébergées dans src/fonts (Plus Jakarta Sans, Inter, latin, SIL OFL).
// Pas de téléchargement depuis Google au build ni au runtime : le build Vercel
// échouait quand fonts.googleapis.com n'était pas joignable, et les réseaux lents
// de nos marchés ne subissent aucune requête externe.
const display = localFont({
  src: [
    { path: "../fonts/plus-jakarta-sans-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../fonts/plus-jakarta-sans-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../fonts/plus-jakarta-sans-latin-700-normal.woff2", weight: "700", style: "normal" },
    { path: "../fonts/plus-jakarta-sans-latin-800-normal.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
});

const text = localFont({
  src: [
    { path: "../fonts/inter-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/inter-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../fonts/inter-latin-600-normal.woff2", weight: "600", style: "normal" },
  ],
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
