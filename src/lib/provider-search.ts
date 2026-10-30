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
};

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
