import type { Metadata } from "next";
import { GlassyLanding } from "@/app/(fr)/design-glassy/glassy-landing";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Design proposal — Aurora Glass",
  robots: { index: false, follow: false },
};

export default async function EnDesignGlassyPage() {
  return <GlassyLanding locale="en" />;
}
