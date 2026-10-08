import type { Metadata, Viewport } from "next";
import { RootShell } from "@/lib/root-layout";
import "../globals.css";

export const metadata: Metadata = {
  title: {
    default: "Toomny — Recrutez les meilleurs talents d'Afrique de l'Ouest",
    template: "%s · Toomny",
  },
  description:
    "Toomny connecte les entreprises d'Afrique de l'Ouest aux prestataires du continent. Paiement en mobile money, paiement conservé jusqu'à la livraison. 10 % de commission côté prestataire, 0 % côté client.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://toomny.com"),
  alternates: { canonical: "/", languages: { "fr-FR": "/", "en-US": "/en" } },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Toomny",
    title: "Toomny — Travailler ensemble, grandir ensemble",
    description:
      "La marketplace de talents d'Afrique de l'Ouest. Paiement mobile money, conservé jusqu'à la livraison.",
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
