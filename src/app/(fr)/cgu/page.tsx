import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LegalPageView } from "@/components/legal/legal-page";
import { getLegalTexts } from "@/content/legal";
import { getPublicPageTexts } from "@/i18n/public-pages";
import { visitorLocale } from "@/i18n/server-locale";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getLegalTexts("fr").cgu.metaTitle };
}

export default async function CguPage() {
  if ((await visitorLocale()) === "en") redirect("/en/cgu");
  const locale = "fr";
  return (
    <LegalPageView
      page={getLegalTexts(locale).cgu}
      homeLabel={getPublicPageTexts(locale).notFound.home}
    />
  );
}
