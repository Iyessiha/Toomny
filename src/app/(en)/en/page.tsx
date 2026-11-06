import type { Metadata } from "next";
import { getBoostedServices, getServices } from "@/lib/catalog";
import { interleaveByProvider } from "@/lib/interleave";
import { listPublicProviders } from "@/lib/provider-cards";
import { GlassyLanding } from "../../(fr)/design-glassy/glassy-landing";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: {
    canonical: "/en",
    languages: { "fr-FR": "/", "en-US": "/en", "x-default": "/" },
  },
};

export default async function HomeEn() {
  const [boosted, all, providers] = await Promise.all([
    getBoostedServices(4).catch(() => []),
    getServices({ sort: "recent" }).catch(() => []),
    listPublicProviders("Toomny").catch(() => []),
  ]);

  const services = interleaveByProvider(
    all.filter((s) => !boosted.some((b) => b.id === s.id)),
    (s) => s.provider?.id ?? s.id,
  ).slice(0, 6);

  return (
    <GlassyLanding locale="en" mode="production" services={services} providers={providers} />
  );
}
