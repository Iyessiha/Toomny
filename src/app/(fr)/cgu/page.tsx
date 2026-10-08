import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CguBody } from "@/components/legal/cgu-body";
import { getPublicPageTexts } from "@/i18n/public-pages";
import { visitorLocale } from "@/i18n/server-locale";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getPublicPageTexts("fr").cgu.metaTitle };
}

/**
 * Page provisoire : les CGU doivent être rédigées et validées par un juriste
 * avant publication (point ouvert du README). Le lien d'inscription pointe ici.
 * Un visiteur anglophone est envoyé sur /en/cgu, servi sous le bon `lang`.
 */
export default async function CguPage() {
  if ((await visitorLocale()) === "en") redirect("/en/cgu");
  return <CguBody t={getPublicPageTexts("fr").cgu} />;
}
