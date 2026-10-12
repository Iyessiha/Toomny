import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://toomny.com";

// Vitrine statique uniquement : les espaces connectés sont exclus (voir robots.ts)
// et les fiches prestations restent découvrables via le catalogue /services.
const PAGES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/",                   changeFrequency: "weekly",  priority: 1.0 },
  { path: "/en",                 changeFrequency: "weekly",  priority: 0.9 },
  { path: "/services",           changeFrequency: "daily",   priority: 0.9 },
  { path: "/comment-ca-marche",  changeFrequency: "monthly", priority: 0.7 },
  { path: "/tarifs",             changeFrequency: "monthly", priority: 0.8 },
  { path: "/securite",           changeFrequency: "monthly", priority: 0.6 },
  { path: "/auth",               changeFrequency: "monthly", priority: 0.5 },
  { path: "/en/auth",            changeFrequency: "monthly", priority: 0.5 },
  { path: "/cgu",                changeFrequency: "yearly",  priority: 0.3 },
  { path: "/en/cgu",             changeFrequency: "yearly",  priority: 0.3 },
  { path: "/confidentialite",    changeFrequency: "yearly",  priority: 0.3 },
  { path: "/mentions-legales",   changeFrequency: "yearly",  priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return PAGES.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
