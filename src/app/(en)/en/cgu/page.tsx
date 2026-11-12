import type { Metadata } from "next";
import { CguBody } from "@/components/legal/cgu-body";

export function generateMetadata(): Metadata {
  return {
    title: "Terms of Use — Toomny",
    alternates: { canonical: "/en/cgu", languages: { "fr-FR": "/cgu", "en-US": "/en/cgu" } },
  };
}

export default function CguPageEn() {
  return <CguBody locale="en" />;
}
