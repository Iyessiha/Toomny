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
    .select(
      "id, title, description, price_minor, currency, delivery_days, category_id, provider:profiles!services_provider_id_profiles_id_fk(display_name, country_code)",
    )
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

  // La jointure revient en tableau ou en objet selon la cardinalité : on normalise.
  return (data ?? []).map((row) => {
    const r = row as unknown as Omit<ServiceCard, "provider"> & {
      provider: ServiceCard["provider"] | ServiceCard["provider"][] | null;
    };
    return { ...r, provider: Array.isArray(r.provider) ? (r.provider[0] ?? null) : r.provider };
  });
}
