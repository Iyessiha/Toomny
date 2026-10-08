import type { Metadata } from "next";
import { CguBody } from "@/components/legal/cgu-body";
import { getPublicPageTexts } from "@/i18n/public-pages";

export function generateMetadata(): Metadata {
  return { title: getPublicPageTexts("en").cgu.metaTitle };
}

/** Provisional terms, English. Not reviewed by a lawyer yet. */
export default function CguPageEn() {
  return <CguBody t={getPublicPageTexts("en").cgu} />;
}
