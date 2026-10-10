import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/i18n/dictionaries";

export type Category = {
  id: string;
  slug: string;
  name_fr: string;
  name_en: string;
  position: number;
};

export type ServiceCard = {
  id: string;
  title: string;
  description: string;
  price_minor: number;
  currency: string;
  delivery_days: number;
  category_id: string;
  category_slug: string | null;
  cover_url: string | null;
  provider: {
    id: string;
    display_name: string | null;
    country_code: string | null;
    rating_avg: number | null;
    rating_count: number;
  } | null;
};

export const CATALOG_PAGE_SIZE = 12;

export type ServiceFilters = {
  categorySlug?: string;
  q?: string;
  maxPrice?: number;
  maxDays?: number;
  sort?: "recent" | "rating";
  page?: number;
};

export function categoryName(c: Category, locale: Locale): string {
  return locale === "en" ? c.name_en : c.name_fr;
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name_fr, name_en, position")
    .order("position");

  if (error) {
    console.error("getCategories:", error.message);
    return [];
  }
  return (data ?? []) as Category[];
}

export async function getServices(filters: ServiceFilters = {}): Promise<ServiceCard[]> {
  const { categorySlug, q, maxPrice, maxDays, sort = "recent", page = 1 } = filters;
  const supabase = await createClient();
  const offset = (Math.max(1, page) - 1) * CATALOG_PAGE_SIZE;

  let query = supabase
    .from("services")
    .select("id, title, description, price_minor, currency, delivery_days, category_id, cover_url, provider_id")
    .eq("status", "active")
    .range(offset, offset + CATALOG_PAGE_SIZE); // fetch PAGE_SIZE+1 to detect hasMore

  if (categorySlug) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .maybeSingle();
    if (!cat) return [];
    query = query.eq("category_id", cat.id);
  }

  if (q) {
    query = query.ilike("title", `%${q}%`);
  }

  if (maxPrice) {
    query = query.lte("price_minor", maxPrice);
  }

  if (maxDays) {
    query = query.lte("delivery_days", maxDays);
  }

  if (sort === "recent") {
    query = query.order("created_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;
  if (error) {
    console.error("getServices:", error.message);
    return [];
  }

  const rows = (data ?? []) as (Omit<ServiceCard, "provider" | "category_slug"> & { provider_id: string })[];
  if (rows.length === 0) return [];

  const [allCategories, providers, profiles] = await Promise.all([
    supabase.from("categories").select("id, slug"),
    supabase
      .from("provider_directory")
      .select("id, display_name, country_code")
      .in("id", [...new Set(rows.map((r) => r.provider_id))]),
    supabase
      .from("provider_profiles")
      .select("profile_id, rating_avg, rating_count")
      .in("profile_id", [...new Set(rows.map((r) => r.provider_id))]),
  ]);

  const catById = new Map(((allCategories.data ?? []) as { id: string; slug: string }[]).map((c) => [c.id, c.slug]));
  const dirById = new Map(((providers.data ?? []) as { id: string; display_name: string | null; country_code: string | null }[]).map((p) => [p.id, p]));
  const profById = new Map(((profiles.data ?? []) as { profile_id: string; rating_avg: number | null; rating_count: number }[]).map((p) => [p.profile_id, p]));

  return rows.map(({ provider_id, ...r }) => {
    const dir = dirById.get(provider_id);
    const prof = profById.get(provider_id);
    return {
      ...r,
      category_slug: catById.get(r.category_id) ?? null,
      provider: dir
        ? {
            id: provider_id,
            display_name: dir.display_name,
            country_code: dir.country_code,
            rating_avg: prof?.rating_avg != null ? Number(prof.rating_avg) : null,
            rating_count: prof?.rating_count ?? 0,
          }
        : null,
    };
  });
}
