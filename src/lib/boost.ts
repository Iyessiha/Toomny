import { randomUUID } from "node:crypto";

// ---------------------------------------------------------------------------
// Service Boost — visibilité payante (add-on indépendant du plan de base)
// ---------------------------------------------------------------------------

export const BOOST_TIERS = ["starter", "pro", "elite"] as const;
export type BoostTier = (typeof BOOST_TIERS)[number];

export type BoostSpec = {
  tier: BoostTier;
  priceMinor: bigint;
  currency: "XOF";
  placements: string[];
};

export const BOOSTS: Record<BoostTier, BoostSpec> = {
  starter: {
    tier: "starter",
    priceMinor: 5_000n,
    currency: "XOF",
    placements: ["catalogue_badge", "catalogue_sort"],
  },
  pro: {
    tier: "pro",
    priceMinor: 10_000n,
    currency: "XOF",
    placements: ["catalogue_badge", "catalogue_sort", "search_sponsored"],
  },
  elite: {
    tier: "elite",
    priceMinor: 18_000n,
    currency: "XOF",
    placements: ["catalogue_badge", "catalogue_sort", "search_sponsored", "homepage_featured"],
  },
};

export const BOOST_PERIOD_DAYS = 30;
export const BOOST_PERIOD_MS = BOOST_PERIOD_DAYS * 86_400_000;

export function isBoostTier(v: unknown): v is BoostTier {
  return BOOST_TIERS.includes(v as BoostTier);
}

export function boostReference(): string {
  return `BST-${randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`;
}
