import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/i18n/dictionaries";

/**
 * Lecture du catalogue public.
 *
 * On passe par supabase-js et la clé anonyme plutôt que par Drizzle : les
 * politiques RLS et les droits colonne par colonne définis en base sont alors
 * la seule autorité sur ce qui sort. Aucun mot de passe de base n'est requis,
 * et une erreur de code ici ne peut pas exposer un numéro mobile money.
 */

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
  provider: { display_name: string | null; country_code: string | null } | null;
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

export async function getServices(categorySlug?: string): Promise<ServiceCard[]> {
  const supabase = await createClient();

  let query = supabase
    .from("services")
    .select("id, title, description, price_minor, currency, delivery_days, category_id, provider_id")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(48);

  if (categorySlug) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .maybeSingle();

    if (!cat) return [];
    query = query.eq("category_id", cat.id);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getServices:", error.message);
    return [];
  }

  const rows = (data ?? []) as (Omit<ServiceCard, "provider"> & { provider_id: string })[];
  if (rows.length === 0) return [];

  // Vue publique : seuls le nom affiché et le pays des prestataires sont exposés,
  // jamais leur téléphone ni leur e-mail.
  const providerIds = [...new Set(rows.map((r) => r.provider_id))];
  const { data: providers } = await supabase
    .from("provider_directory")
    .select("id, display_name, country_code")
    .in("id", providerIds);

  const byId = new Map((providers ?? []).map((p) => [p.id as string, p]));

  return rows.map(({ provider_id, ...r }) => {
    const p = byId.get(provider_id);
    return {
      ...r,
      provider: p ? { display_name: p.display_name, country_code: p.country_code } : null,
    };
  });
}
