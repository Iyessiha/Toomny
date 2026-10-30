import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ProviderCardData } from "@/lib/provider-search";

const MAX_PROVIDERS = 200;

/**
 * Prestataires visibles : ceux qui ont au moins une prestation publiée.
 * Ordre : boostés d'abord, puis avec photo, puis mieux notés, puis plus de commandes reçues.
 */
export async function listPublicProviders(fallbackName: string): Promise<ProviderCardData[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: active } = await supabase.from("services").select("provider_id").eq("status", "active").limit(2000);
  const ids = [...new Set((active ?? []).map((s) => s.provider_id as string))].slice(0, MAX_PROVIDERS);
  if (ids.length === 0) return [];

  const [dirs, profs, stats, counts, boosts] = await Promise.all([
    supabase.from("provider_directory").select("id, display_name, country_code, verification_status").in("id", ids),
    supabase.from("provider_profiles").select("profile_id, avatar_url, headline, city, skills, rating_avg, rating_count").in("profile_id", ids),
    supabase.from("provider_order_stats").select("provider_id, orders_received").in("provider_id", ids),
    supabase.from("services").select("provider_id").eq("status", "active").in("provider_id", ids),
    supabase.from("boosts").select("provider_id").eq("status", "active").gt("period_end", now).in("provider_id", ids),
  ]);

  const dirById = new Map((dirs.data ?? []).map((d) => [d.id as string, d]));
  const profById = new Map((profs.data ?? []).map((p) => [p.profile_id as string, p]));
  const statById = new Map((stats.data ?? []).map((s) => [s.provider_id as string, Number(s.orders_received ?? 0)]));
  const boostedIds = new Set((boosts.data ?? []).map((b) => b.provider_id as string));
  const countById = new Map<string, number>();
  for (const row of counts.data ?? []) {
    const id = row.provider_id as string;
    countById.set(id, (countById.get(id) ?? 0) + 1);
  }

  const rows = ids
    .map((id): ProviderCardData | null => {
      const d = dirById.get(id);
      if (!d) return null;
      const p = profById.get(id);
      return {
        id,
        name: (d.display_name as string | null) ?? fallbackName,
        verified: d.verification_status === "verified",
        country: (d.country_code as string | null) ?? null,
        avatar: (p?.avatar_url as string | null) ?? null,
        headline: (p?.headline as string | null) ?? null,
        city: (p?.city as string | null) ?? null,
        skills: (p?.skills as string | null) ?? "",
        rating: p?.rating_avg ? Number(p.rating_avg) : null,
        ratingCount: Number(p?.rating_count ?? 0),
        received: statById.get(id) ?? 0,
        services: countById.get(id) ?? 0,
        boosted: boostedIds.has(id),
      };
    })
    .filter((r): r is ProviderCardData => r !== null);

  return rows.sort((a, b) => {
    if (a.boosted !== b.boosted) return a.boosted ? -1 : 1;
    if (Boolean(a.avatar) !== Boolean(b.avatar)) return a.avatar ? -1 : 1;
    if ((b.rating ?? 0) !== (a.rating ?? 0)) return (b.rating ?? 0) - (a.rating ?? 0);
    return b.received - a.received;
  });
}
