import type { Metadata } from "next";
import { LegalPageView } from "@/components/legal/legal-page";
import { getLegalTexts } from "@/content/legal";
import { getPublicPageTexts } from "@/i18n/public-pages";
import { visitorLocale } from "@/i18n/server-locale";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getLegalTexts(await visitorLocale()).legalNotice.metaTitle };
}

export default async function LegalNoticePage() {
  const locale = await visitorLocale();
  return <LegalPageView page={getLegalTexts(locale).legalNotice} homeLabel={getPublicPageTexts(locale).notFound.home} />;
}
