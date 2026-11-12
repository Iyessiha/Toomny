import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CguBody } from "@/components/legal/cgu-body";
import { visitorLocale } from "@/i18n/server-locale";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Conditions Générales d'Utilisation — Toomny",
    alternates: { canonical: "/cgu", languages: { "fr-FR": "/cgu", "en-US": "/en/cgu" } },
  };
}

export default async function CguPage() {
  if ((await visitorLocale()) === "en") redirect("/en/cgu");
  return <CguBody locale="fr" />;
}
