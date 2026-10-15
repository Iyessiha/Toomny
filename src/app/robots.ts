import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://toomny.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/services", "/prestataires"],
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
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
