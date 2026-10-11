import type { Metadata } from "next";
import { LegalPageView } from "@/components/legal/legal-page";
import { getLegalTexts } from "@/content/legal";
import { getPublicPageTexts } from "@/i18n/public-pages";

export function generateMetadata(): Metadata {
  return { title: getLegalTexts("en").cgu.metaTitle };
}

export default function CguPageEn() {
  const locale = "en";
  return (
    <LegalPageView
      page={getLegalTexts(locale).cgu}
      homeLabel={getPublicPageTexts(locale).notFound.home}
    />
  );
}
