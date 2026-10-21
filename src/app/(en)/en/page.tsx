import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/en",
    languages: { "fr-FR": "/", "en-US": "/en", "x-default": "/" },
  },
};

export default function HomeEn() {
  return <LandingPage locale="en" />;
}
