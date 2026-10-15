import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://toomny.com";

const STATIC_PAGES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/",                  changeFrequency: "weekly",  priority: 1.0 },
  { path: "/en",                changeFrequency: "weekly",  priority: 0.9 },
  { path: "/services",          changeFrequency: "daily",   priority: 0.9 },
  { path: "/comment-ca-marche", changeFrequency: "monthly", priority: 0.7 },
  { path: "/tarifs",            changeFrequency: "monthly", priority: 0.8 },
  { path: "/securite",          changeFrequency: "monthly", priority: 0.6 },
  { path: "/cgu",               changeFrequency: "yearly",  priority: 0.3 },
  { path: "/en/cgu",            changeFrequency: "yearly",  priority: 0.3 },
  { path: "/confidentialite",   changeFrequency: "yearly",  priority: 0.3 },
  { path: "/mentions-legales",  changeFrequency: "yearly",  priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const db = createAdminClient();

  const [{ data: services }, { data: providers }] = await Promise.all([
    db
      .from("services")
      .select("id, created_at")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(10000),
    db
      .from("provider_profiles")
      .select("profile_id, created_at")
      .order("created_at", { ascending: false })
      .limit(10000),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));

  const serviceEntries: MetadataRoute.Sitemap = (services ?? []).map((s) => ({
    url: `${SITE_URL}/services/${s.id}`,
    lastModified: new Date(s.created_at),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const providerEntries: MetadataRoute.Sitemap = (providers ?? []).map((p) => ({
    url: `${SITE_URL}/prestataires/${p.profile_id}`,
    lastModified: new Date(p.created_at),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticEntries, ...serviceEntries, ...providerEntries];
}
