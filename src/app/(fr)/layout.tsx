import type { Metadata, Viewport } from "next";
import { RootShell } from "@/lib/root-layout";
import "../globals.css";

export const metadata: Metadata = {
  title: {
    default: "Toomny — Recrutez les meilleurs talents d'Afrique de l'Ouest",
    template: "%s · Toomny",
  },
  description:
    "Toomny connecte les entreprises d'Afrique de l'Ouest aux prestataires du continent. Paiement en mobile money, fonds sécurisés jusqu'à la livraison, versement sous 24 h. 10 % de commission, 0 % pour le client.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://toomny.com"),
  alternates: { canonical: "/", languages: { "fr-FR": "/", "en-US": "/en" } },
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

export default function FrLayout({ children }: { children: React.ReactNode }) {
  return <RootShell locale="fr">{children}</RootShell>;
}
