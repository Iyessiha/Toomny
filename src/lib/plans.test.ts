import { describe, expect, it } from "vitest";
import {
  DEFAULT_PLAN,
  PAID_PLAN_TIERS,
  PLAN_TIERS,
  PLANS,
  commissionBpsForPlan,
  effectivePlan,
  isPaidPlanTier,
  isPlanTier,
  nextPeriodEnd,
} from "./plans";

describe("plans", () => {
  it("expose le plan gratuit et les 3 plans payants", () => {
    expect(DEFAULT_PLAN).toBe("debutant");
    expect(PLAN_TIERS).toEqual(["debutant", "essentiel", "pro", "expert"]);
    expect(PAID_PLAN_TIERS).toEqual(["essentiel", "pro", "expert"]);
    expect(PLANS.debutant).toMatchObject({
      priceMinor: 0n,
      currency: "XOF",
      commissionBps: 1000,
      commissionPercent: 10,
    });
    expect(PLANS.essentiel).toMatchObject({ priceMinor: 10_000n, commissionBps: 800, commissionPercent: 8 });
    expect(PLANS.pro).toMatchObject({ priceMinor: 15_000n, commissionBps: 500, commissionPercent: 5 });
    expect(PLANS.expert).toMatchObject({ priceMinor: 25_000n, commissionBps: 300, commissionPercent: 3 });
  });

  it("valide uniquement les identifiants de plan connus", () => {
    expect(isPlanTier("debutant")).toBe(true);
    expect(isPlanTier("essentiel")).toBe(true);
    expect(isPlanTier("pro")).toBe(true);
    expect(isPlanTier("expert")).toBe(true);
    expect(isPlanTier("free")).toBe(false);
    expect(isPlanTier(null)).toBe(false);

    expect(isPaidPlanTier("essentiel")).toBe(true);
    expect(isPaidPlanTier("pro")).toBe(true);
    expect(isPaidPlanTier("expert")).toBe(true);
    expect(isPaidPlanTier("debutant")).toBe(false);
    expect(isPaidPlanTier(null)).toBe(false);
  });

  it("calcule la commission de chaque plan et retombe sur 1000 bps par défaut", () => {
    expect(commissionBpsForPlan("debutant")).toBe(1000);
    expect(commissionBpsForPlan("essentiel")).toBe(800);
    expect(commissionBpsForPlan("pro")).toBe(500);
    expect(commissionBpsForPlan("expert")).toBe(300);
    expect(commissionBpsForPlan(undefined)).toBe(1000);
    expect(commissionBpsForPlan("inconnu")).toBe(1000);
    expect(commissionBpsForPlan("pro", null)).toBe(1000);
  });

  it("n'active un plan payé sans date que si celle-ci est undefined", () => {
    const now = new Date("2026-10-12T12:00:00Z");
    expect(effectivePlan("pro", undefined, now)).toBe("pro");
    expect(effectivePlan("pro", null, now)).toBe("debutant");
    expect(effectivePlan("pro", null, now)).toBe(DEFAULT_PLAN);
    expect(commissionBpsForPlan("essentiel", null, now)).toBe(1000);
  });

  it("ramène un plan expiré ou invalide au plan Débutant", () => {
    const now = new Date("2026-10-12T12:00:00Z");
    expect(effectivePlan("expert", "2026-10-20T00:00:00Z", now)).toBe("expert");
    expect(effectivePlan("expert", "2026-10-12T12:00:00Z", now)).toBe("debutant");
    expect(effectivePlan("expert", "2026-10-01T00:00:00Z", now)).toBe("debutant");
    expect(effectivePlan("expert", "date invalide", now)).toBe("debutant");
    expect(commissionBpsForPlan("pro", "2026-10-01T00:00:00Z", now)).toBe(1000);
  });

  it("garde Débutant comme plan effectif quelle que soit son échéance", () => {
    const now = new Date("2026-10-12T12:00:00Z");
    expect(effectivePlan("debutant", "2026-10-20T00:00:00Z", now)).toBe("debutant");
    expect(commissionBpsForPlan("debutant", "2026-10-20T00:00:00Z", now)).toBe(1000);
  });

  it("calcule une période de 30 jours exacts", () => {
    const start = new Date("2026-10-01T00:00:00.000Z");
    expect(nextPeriodEnd(start).toISOString()).toBe("2026-10-31T00:00:00.000Z");
  });
});
