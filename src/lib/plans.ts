import { randomUUID } from "node:crypto";

// ---------------------------------------------------------------------------
// Plans d'abonnement prestataire (mensuels, sans engagement).
//
// Les montants et taux de commission font foi côté serveur : aucune route ni
// action ne fait confiance à un prix ou un taux envoyé par le navigateur.
// ---------------------------------------------------------------------------

export const PLAN_TIERS = ["essentiel", "pro", "expert"] as const;

export type PlanTier = (typeof PLAN_TIERS)[number];

export const DEFAULT_PLAN: PlanTier = "essentiel";

/** Durée d'une période d'abonnement payée : 30 jours. */
export const SUBSCRIPTION_PERIOD_DAYS = 30;
export const SUBSCRIPTION_PERIOD_MS = SUBSCRIPTION_PERIOD_DAYS * 86_400_000;

export type PlanSpec = {
  tier: PlanTier;
  priceMinor: bigint;
  currency: "XOF";
  commissionBps: number;
  commissionPercent: number;
};

export const PLANS: Record<PlanTier, PlanSpec> = {
  essentiel: {
    tier: "essentiel",
    priceMinor: 10_000n,
    currency: "XOF",
    commissionBps: 800,
    commissionPercent: 8,
  },
  pro: {
    tier: "pro",
    priceMinor: 15_000n,
    currency: "XOF",
    commissionBps: 500,
    commissionPercent: 5,
  },
  expert: {
    tier: "expert",
    priceMinor: 25_000n,
    currency: "XOF",
    commissionBps: 300,
    commissionPercent: 3,
  },
};

export function isPlanTier(value: unknown): value is PlanTier {
  return typeof value === "string" && (PLAN_TIERS as readonly string[]).includes(value);
}

export function normalizePlan(value: unknown): PlanTier {
  return isPlanTier(value) ? value : DEFAULT_PLAN;
}

/**
 * Renvoie le plan réellement actif à l'instant `now`. Un plan payant dont la
 * date d'expiration est dépassée retombe sur le plan Essentiel (8 %).
 */
export function effectivePlan(
  plan: unknown,
  expiresAt?: Date | string | null,
  now: Date = new Date(),
): PlanTier {
  const tier = normalizePlan(plan);
  if (tier === DEFAULT_PLAN || !expiresAt) return tier;
  const exp = typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
  if (Number.isNaN(exp.getTime()) || exp.getTime() <= now.getTime()) {
    return DEFAULT_PLAN;
  }
  return tier;
}

/** Commission en points de base (100 bps = 1 %) selon le plan du prestataire. */
export function commissionBpsForPlan(
  plan: unknown,
  expiresAt?: Date | string | null,
  now: Date = new Date(),
): number {
  const tier = effectivePlan(plan, expiresAt, now);
  return PLANS[tier].commissionBps;
}

export function priceMinorForPlan(tier: PlanTier): bigint {
  return PLANS[tier].priceMinor;
}

export function nextPeriodEnd(from: Date = new Date()): Date {
  return new Date(from.getTime() + SUBSCRIPTION_PERIOD_MS);
}

/** Référence lisible d'une souscription, ex. SUB-2026-4A9F1C2D. */
export function subscriptionReference(now: Date = new Date()): string {
  return `SUB-${now.getUTCFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
}
