import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { MotionProvider } from "@/components/motion-provider";
import "./globals.css";

// next/font héberge les fichiers au build : zéro requête vers Google au runtime,
// ce qui compte sur les réseaux lents de nos marchés.
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

export const metadata: Metadata = {
  title: {
    default: "Toomny — Recrutez les meilleurs talents d'Afrique de l'Ouest",
    template: "%s · Toomny",
  },
  description:
    "Toomny connecte les entreprises d'Afrique de l'Ouest aux prestataires du continent. Paiement en mobile money, fonds sécurisés jusqu'à la livraison, versement sous 24 h. 10 % de commission, 0 % pour le client.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://toomny.com"),
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Toomny",
    title: "Toomny — Travailler ensemble, grandir ensemble",
    description:
      "La marketplace de talents d'Afrique de l'Ouest. Paiement mobile money, fonds sécurisés, versement sous 24 h.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#108043",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${display.variable} ${text.variable}`}>
      <head>
        {/* Avant le premier rendu : on masque les blocs à révéler uniquement si
            le JS tourne ET que l'utilisateur accepte les animations. Sans JS,
            la classe n'est jamais posée et tout reste visible. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(matchMedia('(prefers-reduced-motion: no-preference)').matches)document.documentElement.classList.add('js')}catch(e){}",
          }}
        />
      </head>
      <body>
        <LanguageProvider>{children}</LanguageProvider>
        <MotionProvider />
      </body>
    </html>
  );
}
