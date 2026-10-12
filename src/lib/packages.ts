// ---------------------------------------------------------------------------
// Forfaits d'une prestation (Basic / Standard / Premium).
//
// Le navigateur envoie les forfaits en JSON : tout est revalidé ici avant
// écriture. Sans ce contrôle, un prix `NaN` devient `null` après JSON, un
// champ manquant fait lever `.trim()`, et la base refuse l'insert — en
// silence côté création. Les bornes reprennent les CHECK de 0018, plus le
// plafond produit de 10 000 000 FCFA (comme le prix de base).
// ---------------------------------------------------------------------------

export const PACKAGE_TIERS = [1, 2, 3] as const;
export type PackageTier = (typeof PACKAGE_TIERS)[number];

export const PACKAGE_MIN_PRICE_MINOR = 1000;
export const PACKAGE_MAX_PRICE_MINOR = 10_000_000;
export const PACKAGE_MAX_DELIVERY_DAYS = 365;
export const PACKAGE_MAX_NAME = 60;
export const PACKAGE_MAX_DESCRIPTION = 500;

export type ValidPackage = {
  tier: PackageTier;
  name: string;
  description: string | null;
  price_minor: number;
  delivery_days: number;
};

/**
 * Valide une liste de forfaits venue du navigateur. Renvoie les lignes prêtes
 * à insérer, ou null si quoi que ce soit est invalide : on ne devine jamais.
 */
export function parsePackages(input: unknown): ValidPackage[] | null {
  if (!Array.isArray(input)) return null;
  if (input.length > 3) return null;

  const seen = new Set<number>();
  const out: ValidPackage[] = [];

  for (const raw of input) {
    if (typeof raw !== "object" || raw === null) return null;
    const p = raw as Record<string, unknown>;

    const tier = p.tier;
    if (tier !== 1 && tier !== 2 && tier !== 3) return null;
    if (seen.has(tier)) return null;
    seen.add(tier);

    if (typeof p.name !== "string") return null;
    const name = p.name.trim().slice(0, PACKAGE_MAX_NAME);
    if (name.length < 1) return null;

    let description: string | null = null;
    if (p.description !== undefined && p.description !== null) {
      if (typeof p.description !== "string") return null;
      description = p.description.trim().slice(0, PACKAGE_MAX_DESCRIPTION) || null;
    }

    const price = p.price_minor;
    if (
      typeof price !== "number" ||
      !Number.isInteger(price) ||
      price < PACKAGE_MIN_PRICE_MINOR ||
      price > PACKAGE_MAX_PRICE_MINOR
    ) {
      return null;
    }

    const days = p.delivery_days;
    if (
      typeof days !== "number" ||
      !Number.isInteger(days) ||
      days < 1 ||
      days > PACKAGE_MAX_DELIVERY_DAYS
    ) {
      return null;
    }

    out.push({ tier, name, description, price_minor: price, delivery_days: days });
  }

  return out;
}
