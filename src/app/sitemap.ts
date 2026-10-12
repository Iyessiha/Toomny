import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://toomny.com";

// Vitrine statique uniquement : les espaces connectés sont exclus (voir robots.ts)
// et les fiches prestations restent découvrables via le catalogue /services.
const PATHS = [
  "/",
  "/en",
  "/services",
  "/comment-ca-marche",
  "/tarifs",
  "/securite",
  "/auth",
  "/en/auth",
  "/cgu",
  "/en/cgu",
  "/confidentialite",
  "/mentions-legales",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly" as const,
  }));
}
