import type { Metadata, Viewport } from "next";
import { RootShell } from "@/lib/root-layout";
import { OrganizationJsonLd } from "@/components/seo/json-ld";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: "Toomny — Hire the best talent in West Africa", template: "%s · Toomny" },
  description:
    "Toomny connects West African businesses with providers across the continent. Mobile money payments, held until delivery. From 3% commission, 0% for buyers.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://toomny.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Toomny",
    title: "Toomny — Work together, grow together",
    description:
      "The talent marketplace for West Africa. Mobile money payments, held until delivery.",
  },
  twitter: {
    card: "summary_large_image",
    site: "@toomny",
    title: "Toomny — Work together, grow together",
    description: "The talent marketplace for West Africa. Mobile money payments, held until delivery.",
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#108043",
};

export default function EnLayout({ children }: { children: React.ReactNode }) {
  return (
    <RootShell locale="en">
      <OrganizationJsonLd />
      {children}
    </RootShell>
  );
}
