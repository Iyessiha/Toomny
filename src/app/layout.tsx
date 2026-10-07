import type { Metadata, Viewport } from "next";
import { LanguageProvider } from "@/i18n/LanguageContext";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Toomny — Le talent africain, payé chez lui",
    template: "%s · Toomny",
  },
  description:
    "Toomny connecte les PME d'Afrique de l'Ouest aux prestataires du continent. Paiement en mobile money, fonds sécurisés jusqu'à la livraison, versement sous 24 h.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://toomny.com"),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f8f5f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
