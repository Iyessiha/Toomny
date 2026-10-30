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
  tags: string[];
  boosted: boolean;
  provider: {
    id: string;
    display_name: string | null;
    country_code: string | null;
    rating_avg: number | null;
    rating_count: number;
    verified?: boolean;
    /** Présence récente, lue dans la vue `online_providers`. */
    is_online?: boolean;
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

export type FeaturedProvider = {
  id: string;
  display_name: string | null;
  country_code: string | null;
  avatar_url: string | null;
  headline: string | null;
  rating_avg: number | null;
  rating_count: number;
  completed_orders: number;
  skills: string[];
};

export async function getFeaturedProviders(): Promise<FeaturedProvider[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: boosts } = await supabase
    .from("boosts")
    .select("provider_id")
    .eq("status", "active")
    .eq("tier", "elite")
    .gt("period_end", now)
    .limit(8);

  const ids = ((boosts ?? []) as { provider_id: string }[]).map((b) => b.provider_id);
  if (ids.length === 0) return [];

  const [dirs, profs] = await Promise.all([
    supabase
      .from("provider_directory")
      .select("id, display_name, country_code")
      .in("id", ids),
    supabase
      .from("provider_profiles")
      .select("profile_id, avatar_url, headline, rating_avg, rating_count, completed_orders, skills")
      .in("profile_id", ids),
  ]);

  const dirById = new Map(
    ((dirs.data ?? []) as { id: string; display_name: string | null; country_code: string | null }[]).map((d) => [d.id, d]),
  );
  const profById = new Map(
    ((profs.data ?? []) as {
      profile_id: string;
      avatar_url: string | null;
      headline: string | null;
      rating_avg: number | null;
      rating_count: number;
      completed_orders: number;
      skills: string[] | null;
    }[]).map((p) => [p.profile_id, p]),
  );

  return ids
    .map((id) => {
      const dir = dirById.get(id);
      const prof = profById.get(id);
      if (!dir) return null;
      return {
        id,
        display_name: dir.display_name,
        country_code: dir.country_code,
        avatar_url: prof?.avatar_url ?? null,
        headline: prof?.headline ?? null,
        rating_avg: prof?.rating_avg != null ? Number(prof.rating_avg) : null,
        rating_count: prof?.rating_count ?? 0,
        completed_orders: prof?.completed_orders ?? 0,
        skills: (prof?.skills ?? []).slice(0, 3),
      };
    })
    .filter(Boolean) as FeaturedProvider[];
}

export type BoostedProvider = {
  id: string;
  display_name: string | null;
  country_code: string | null;
  headline: string | null;
  rating_avg: number | null;
  skills: string[];
  tier: string;
};

export async function getBoostedProviders(): Promise<BoostedProvider[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: boosts } = await supabase
    .from("boosts")
    .select("provider_id, tier")
    .eq("status", "active")
    .gt("period_end", now)
    .limit(20);

  const rows = (boosts ?? []) as { provider_id: string; tier: string }[];
  if (rows.length === 0) return [];

  const ids = rows.map((b) => b.provider_id);
  const tierById = new Map(rows.map((b) => [b.provider_id, b.tier]));

  const [dirs, profs] = await Promise.all([
    supabase.from("provider_directory").select("id, display_name, country_code").in("id", ids),
    supabase.from("provider_profiles").select("profile_id, headline, rating_avg, skills").in("profile_id", ids),
  ]);

  const dirById = new Map(
    ((dirs.data ?? []) as { id: string; display_name: string | null; country_code: string | null }[]).map((d) => [d.id, d]),
  );
  const profById = new Map(
    ((profs.data ?? []) as { profile_id: string; headline: string | null; rating_avg: number | null; skills: string[] | null }[]).map((p) => [p.profile_id, p]),
  );

  return ids
    .map((id) => {
      const dir = dirById.get(id);
      const prof = profById.get(id);
      if (!dir) return null;
      return {
        id,
        display_name: dir.display_name,
        country_code: dir.country_code,
        headline: prof?.headline ?? null,
        rating_avg: prof?.rating_avg != null ? Number(prof.rating_avg) : null,
        skills: (prof?.skills ?? []).slice(0, 2),
        tier: tierById.get(id) ?? "pro",
      };
    })
    .filter(Boolean) as BoostedProvider[];
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
    .select("id, title, description, price_minor, currency, delivery_days, category_id, cover_url, tags, provider_id")
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

  const rows = (data ?? []) as (Omit<ServiceCard, "provider" | "category_slug" | "boosted"> & { provider_id: string })[];
  if (rows.length === 0) return [];

  const providerIds = [...new Set(rows.map((r) => r.provider_id))];
  const now = new Date().toISOString();

  const [allCategories, providers, profiles, boosts, online] = await Promise.all([
    supabase.from("categories").select("id, slug"),
    supabase
      .from("provider_directory")
      .select("id, display_name, country_code, verification_status")
      .in("id", providerIds),
    supabase
      .from("provider_profiles")
      .select("profile_id, rating_avg, rating_count")
      .in("profile_id", providerIds),
    supabase
      .from("boosts")
      .select("provider_id")
      .eq("status", "active")
      .gt("period_end", now)
      .in("provider_id", providerIds),
    supabase.from("online_providers").select("id").in("id", providerIds),
  ]);

  const catById = new Map(((allCategories.data ?? []) as { id: string; slug: string }[]).map((c) => [c.id, c.slug]));
  const dirById = new Map(((providers.data ?? []) as { id: string; display_name: string | null; country_code: string | null; verification_status: string | null }[]).map((p) => [p.id, p]));
  const profById = new Map(((profiles.data ?? []) as { profile_id: string; rating_avg: number | null; rating_count: number }[]).map((p) => [p.profile_id, p]));
  const boostedProviders = new Set(((boosts.data ?? []) as { provider_id: string }[]).map((b) => b.provider_id));
  const onlineProviders = new Set(((online.data ?? []) as { id: string }[]).map((p) => p.id));

  const mapped = rows.map(({ provider_id, ...r }) => {
    const dir = dirById.get(provider_id);
    const prof = profById.get(provider_id);
    return {
      ...r,
      boosted: boostedProviders.has(provider_id),
      category_slug: catById.get(r.category_id) ?? null,
      provider: dir
        ? {
            id: provider_id,
            display_name: dir.display_name,
            country_code: dir.country_code,
            rating_avg: prof?.rating_avg != null ? Number(prof.rating_avg) : null,
            rating_count: prof?.rating_count ?? 0,
            verified: dir.verification_status === "verified",
            is_online: onlineProviders.has(provider_id),
          }
        : null,
    };
  });

  // Les services boostés remontent en tête
  return mapped.sort((a, b) => (b.boosted ? 1 : 0) - (a.boosted ? 1 : 0));
}

/** Récupère un lot de services par leurs IDs (pour la wishlist). */
export async function getServicesByIds(ids: string[]): Promise<ServiceCard[]> {
  if (ids.length === 0) return [];
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("services")
    .select("id, title, description, price_minor, currency, delivery_days, category_id, cover_url, tags, provider_id")
    .eq("status", "active")
    .in("id", ids);

  if (error || !data || data.length === 0) return [];

  const rows = data as (Omit<ServiceCard, "provider" | "category_slug" | "boosted"> & { provider_id: string })[];
  const providerIds = [...new Set(rows.map((r) => r.provider_id))];
  const now = new Date().toISOString();

  const [allCategories, providers, profiles, boosts, online] = await Promise.all([
    supabase.from("categories").select("id, slug"),
    supabase.from("provider_directory").select("id, display_name, country_code, verification_status").in("id", providerIds),
    supabase.from("provider_profiles").select("profile_id, rating_avg, rating_count").in("profile_id", providerIds),
    supabase.from("boosts").select("provider_id").eq("status", "active").gt("period_end", now).in("provider_id", providerIds),
    supabase.from("online_providers").select("id").in("id", providerIds),
  ]);

  const catById = new Map(((allCategories.data ?? []) as { id: string; slug: string }[]).map((c) => [c.id, c.slug]));
  const dirById = new Map(((providers.data ?? []) as { id: string; display_name: string | null; country_code: string | null; verification_status: string | null }[]).map((p) => [p.id, p]));
  const profById = new Map(((profiles.data ?? []) as { profile_id: string; rating_avg: number | null; rating_count: number }[]).map((p) => [p.profile_id, p]));
  const boostedProviders = new Set(((boosts.data ?? []) as { provider_id: string }[]).map((b) => b.provider_id));
  const onlineProviders = new Set(((online.data ?? []) as { id: string }[]).map((p) => p.id));

  return rows.map(({ provider_id, ...r }) => {
    const dir = dirById.get(provider_id);
    const prof = profById.get(provider_id);
    return {
      ...r,
      boosted: boostedProviders.has(provider_id),
      category_slug: catById.get(r.category_id) ?? null,
      provider: dir
        ? { id: provider_id, display_name: dir.display_name, country_code: dir.country_code, rating_avg: prof?.rating_avg != null ? Number(prof.rating_avg) : null, rating_count: prof?.rating_count ?? 0, verified: dir.verification_status === "verified", is_online: onlineProviders.has(provider_id) }
        : null,
    };
  });
}

const BOOST_RANK: Record<string, number> = { elite: 0, pro: 1, starter: 2 };

/**
 * Prestations « En vedette » : celles des prestataires ayant un boost actif. Les formules
 * les plus hautes passent d'abord ; chaque prestataire apporte au plus deux prestations.
 */
export async function getBoostedServices(limit = 4): Promise<ServiceCard[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: boosts } = await supabase
    .from("boosts")
    .select("provider_id, tier")
    .eq("status", "active")
    .gt("period_end", now)
    .limit(100);
  const rows = (boosts ?? []) as { provider_id: string; tier: string }[];
  if (rows.length === 0) return [];

  const providerIds = [...new Set(rows.sort((a, b) => (BOOST_RANK[a.tier] ?? 9) - (BOOST_RANK[b.tier] ?? 9)).map((b) => b.provider_id))];

  const { data: services } = await supabase
    .from("services")
    .select("id, provider_id")
    .eq("status", "active")
    .in("provider_id", providerIds)
    .order("created_at", { ascending: false })
    .limit(200);

  const chosen: string[] = [];
  for (const providerId of providerIds) {
    const own = ((services ?? []) as { id: string; provider_id: string }[]).filter((s) => s.provider_id === providerId);
    for (const s of own.slice(0, 2)) {
      if (chosen.length >= limit) break;
      chosen.push(s.id);
    }
    if (chosen.length >= limit) break;
  }
  if (chosen.length === 0) return [];

  const cards = await getServicesByIds(chosen);
  const order = new Map(chosen.map((id, i) => [id, i]));
  return cards.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}
