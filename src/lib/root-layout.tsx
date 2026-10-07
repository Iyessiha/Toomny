import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { MotionProvider } from "@/components/motion-provider";
import type { Locale } from "@/i18n/dictionaries";

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
export function RootShell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    <html lang={locale} className={`${display.variable} ${text.variable}`}>
      <body>
        {/* Premier élément du corps : s'exécute avant que le reste du document
            ne soit analysé. On masque les blocs à révéler uniquement si le JS
            tourne ET que l'utilisateur accepte les animations. Sans JS, la
            classe n'est jamais posée et tout reste visible. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(matchMedia('(prefers-reduced-motion: no-preference)').matches)document.documentElement.classList.add('js')}catch(e){}",
          }}
        />
        <LanguageProvider initialLocale={locale}>{children}</LanguageProvider>
        <MotionProvider />
      </body>
    </html>
  );
}
