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
  "musique-audio",
  "mode-textile-artisanat",
  "evenementiel",
  "formation-coaching",
  "intelligence-artificielle",
  "business-conseil",
  "traduction-interpretation",
  "voix-off-podcast",
  "animation-motion",
  "developpement-mobile",
  "maintenance-reparation",
  "cours-soutien-scolaire",
  "gastronomie-traiteur",
  "bien-etre-sante",
  "immobilier",
]);

/** Catégorie la plus fréquente parmi des prestations ; à égalité, la première rencontrée. */
export function mainCategory(slugs: Array<string | null | undefined>): string | null {
  const counts = new Map<string, number>();
  for (const slug of slugs) {
    if (slug) counts.set(slug, (counts.get(slug) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [slug, n] of counts) {
    if (n > bestCount) {
      best = slug;
      bestCount = n;
    }
  }
  return best;
}

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
