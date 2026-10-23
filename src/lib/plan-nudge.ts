// Bandeau d'abonnement du tableau de bord prestataire. Fonction pure : le
// plan effectif, la consommation et le palier suivant, sans lecture en base.
import { PAID_PLAN_TIERS, PLANS, effectivePlan, normalizePlan, type PaidPlanTier, type PlanTier } from "@/lib/plans";

/** Au-delà de cette part du quota, on propose le palier supérieur. */
export const NEAR_LIMIT_RATIO = 0.8;

export type PlanNudge = {
  activeTier: PlanTier;
  /** Vrai quand le plan enregistré est payé mais a expiré : le prestataire est revenu en Débutant. */
  expired: boolean;
  activeServices: number;
  maxServices: number;
  atLimit: boolean;
  nearLimit: boolean;
  /** Palier proposé, ou null si le prestataire est déjà au plus haut. */
  nextTier: PaidPlanTier | null;
};

export function planNudge(input: {
  plan: unknown;
  expiresAt?: string | null;
  activeServices: number;
  now?: Date;
}): PlanNudge {
  const now = input.now ?? new Date();
  const activeTier = effectivePlan(input.plan, input.expiresAt ?? null, now);
  const storedTier = normalizePlan(input.plan);
  const maxServices = PLANS[activeTier].maxServices;
  const atLimit = input.activeServices >= maxServices;
  const nearLimit = !atLimit && input.activeServices >= Math.ceil(maxServices * NEAR_LIMIT_RATIO);

  let nextTier: PaidPlanTier | null = null;
  if (activeTier === "debutant") nextTier = PAID_PLAN_TIERS[0];
  else {
    const index = PAID_PLAN_TIERS.indexOf(activeTier);
    nextTier = index >= 0 && index < PAID_PLAN_TIERS.length - 1 ? PAID_PLAN_TIERS[index + 1] : null;
  }

  return {
    activeTier,
    expired: storedTier !== "debutant" && activeTier === "debutant",
    activeServices: input.activeServices,
    maxServices,
    atLimit,
    nearLimit,
    nextTier,
  };
}
