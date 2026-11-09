import { randomUUID } from "node:crypto";

// ---------------------------------------------------------------------------
// Plans d'abonnement prestataire (mensuels, sans engagement).
//
// Le plan Débutant est gratuit et sert de plan de base. Les montants et taux
// de commission font foi côté serveur : aucune route ni action ne fait
// confiance à un prix ou un taux envoyé par le navigateur.
// ---------------------------------------------------------------------------

export const PAID_PLAN_TIERS = ["essentiel", "pro", "expert"] as const;

export type PaidPlanTier = (typeof PAID_PLAN_TIERS)[number];

export const PLAN_TIERS = ["debutant", ...PAID_PLAN_TIERS] as const;

export type PlanTier = (typeof PLAN_TIERS)[number];

export const DEFAULT_PLAN: PlanTier = "debutant";

/** Durée d'une période d'abonnement payée : 30 jours. */
export const SUBSCRIPTION_PERIOD_DAYS = 30;
export const SUBSCRIPTION_PERIOD_MS = SUBSCRIPTION_PERIOD_DAYS * 86_400_000;

export type PlanSpec = {
  tier: PlanTier;
  priceMinor: bigint;
  currency: "XOF";
  commissionBps: number;
  commissionPercent: number;
  /** Nombre maximum de prestations actives (non retirées) simultanément. */
  maxServices: number;
};

export const PLANS: Record<PlanTier, PlanSpec> = {
  debutant: {
    tier: "debutant",
    priceMinor: 0n,
    currency: "XOF",
    commissionBps: 1000,
    commissionPercent: 10,
    maxServices: 2,
  },
  essentiel: {
    tier: "essentiel",
    priceMinor: 10_000n,
    currency: "XOF",
    commissionBps: 800,
    commissionPercent: 8,
    maxServices: 8,
  },
  pro: {
    tier: "pro",
    priceMinor: 15_000n,
    currency: "XOF",
    commissionBps: 500,
    commissionPercent: 5,
    maxServices: 20,
  },
  expert: {
    tier: "expert",
    priceMinor: 25_000n,
    currency: "XOF",
    commissionBps: 300,
    commissionPercent: 3,
    maxServices: 50,
  },
};

export function isPlanTier(value: unknown): value is PlanTier {
  return typeof value === "string" && (PLAN_TIERS as readonly string[]).includes(value);
}

export function isPaidPlanTier(value: unknown): value is PaidPlanTier {
  return typeof value === "string" && (PAID_PLAN_TIERS as readonly string[]).includes(value);
}

export function normalizePlan(value: unknown): PlanTier {
  return isPlanTier(value) ? value : DEFAULT_PLAN;
}

/**
 * Renvoie le plan réellement actif à l'instant `now`. Le plan Débutant est
 * gratuit et sans échéance ; un plan payé sans date d'expiration reste accepté
 * seulement lorsque cette absence est explicitement `undefined`.
 */
export function effectivePlan(
  plan: unknown,
  expiresAt?: Date | string | null,
  now: Date = new Date(),
): PlanTier {
  const tier = normalizePlan(plan);
  if (tier === DEFAULT_PLAN || expiresAt === null) return DEFAULT_PLAN;
  if (expiresAt === undefined) return tier;

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

/** Nombre maximum de prestations actives pour le plan effectif au moment `now`. */
export function maxServicesForPlan(
  plan: unknown,
  expiresAt?: Date | string | null,
  now: Date = new Date(),
): number {
  const tier = effectivePlan(plan, expiresAt, now);
  return PLANS[tier].maxServices;
}

export function nextPeriodEnd(from: Date = new Date()): Date {
  return new Date(from.getTime() + SUBSCRIPTION_PERIOD_MS);
}

/** Référence lisible d'une souscription, ex. SUB-2026-4A9F1C2D. */
export function subscriptionReference(now: Date = new Date()): string {
  return `SUB-${now.getUTCFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

/** true si le prestataire a un plan payant en cours (Essentiel, Pro ou Expert). */
export function hasPaidPlan(plan: unknown, expiresAt?: Date | string | null, now: Date = new Date()): boolean {
  return effectivePlan(plan, expiresAt, now) !== DEFAULT_PLAN;
}
