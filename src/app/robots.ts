import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://toomny.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          "/dashboard/",
          "/orders/",
          "/messages/",
          "/disputes/",
          "/demandes/",
          "/notifications/",
          "/admin/",
          "/api/",
          "/auth/",
          "/en/auth/",
          // Formulaires de contact — aucun intérêt SEO, évite le crawl inutile
          "/prestataires/*/contact",
          "/services/*/contact",
          // Page de démo interne (404 en production)
          "/charte",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
