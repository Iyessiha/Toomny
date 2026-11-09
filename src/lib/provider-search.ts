/** Une carte prestataire, prête à être affichée sur la landing et sur /prestataires. */
export type ProviderCardData = {
  id: string;
  name: string;
  verified: boolean;
  country: string | null;
  avatar: string | null;
  headline: string | null;
  city: string | null;
  skills: string;
  rating: number | null;
  ratingCount: number;
  received: number;
  services: number;
  boosted: boolean;
  businessType: "individual" | "company";
  companyName: string | null;
  /** Prix le plus bas parmi les prestations actives, en unités mineures XOF. */
  fromPriceMinor: number | null;
  /** Catégorie la plus fréquente parmi les prestations actives (illustration de repli). */
  categorySlug?: string | null;
};

/** Catégories qui ont une illustration PNG dans public/images/categories. */
export const CATEGORY_ILLUSTRATIONS = new Set([
  "design-graphique",
  "developpement-web",
  "community-management",
  "montage-video",
  "redaction-traduction",
  "marketing-digital",
  "comptabilite-admin",
  "photographie",
]);

/** Mots de la recherche, normalisés : insensibles à la casse et aux accents. */
export function normalizeSearch(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Filtre une liste de prestataires par une recherche (nom, métier, ville, compétence). */
export function filterProviders(rows: ProviderCardData[], query: string): ProviderCardData[] {
  const q = normalizeSearch(query.trim());
  if (!q) return rows;
  return rows.filter((r) => normalizeSearch([r.name, r.headline ?? "", r.city ?? "", r.skills].join(" ")).includes(q));
}
