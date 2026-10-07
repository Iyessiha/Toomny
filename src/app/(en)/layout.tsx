import type { Metadata, Viewport } from "next";
import { RootShell } from "@/lib/root-layout";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: "Toomny — Hire the best talent in West Africa", template: "%s · Toomny" },
  description:
    "Toomny connects West African businesses with providers across the continent. Mobile money payments, funds secured until delivery, paid within 24 hours. 10% commission, 0% for buyers.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://toomny.com"),
  alternates: { canonical: "/en", languages: { "fr-FR": "/", "en-US": "/en" } },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Toomny",
    title: "Toomny — Work together, grow together",
    description:
      "The talent marketplace for West Africa. Mobile money payments, funds secured, paid within 24 hours.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#108043",
};

export default function EnLayout({ children }: { children: React.ReactNode }) {
  return <RootShell locale="en">{children}</RootShell>;
}
