import { describe, expect, it } from "vitest";
import {
  PLANS,
  commissionBpsForPlan,
  effectivePlan,
  isPlanTier,
  nextPeriodEnd,
} from "./plans";

describe("plans", () => {
  it("expose les 3 plans avec prix FCFA et commissions (800 / 500 / 300 bps)", () => {
    expect(PLANS.essentiel).toMatchObject({ priceMinor: 10_000n, commissionBps: 800, commissionPercent: 8 });
    expect(PLANS.pro).toMatchObject({ priceMinor: 15_000n, commissionBps: 500, commissionPercent: 5 });
    expect(PLANS.expert).toMatchObject({ priceMinor: 25_000n, commissionBps: 300, commissionPercent: 3 });
  });

  it("valide uniquement les identifiants de plan connus", () => {
    expect(isPlanTier("essentiel")).toBe(true);
    expect(isPlanTier("pro")).toBe(true);
    expect(isPlanTier("expert")).toBe(true);
    expect(isPlanTier("free")).toBe(false);
    expect(isPlanTier(null)).toBe(false);
  });

  it("calcule la commission par plan et retombe sur 800 bps par défaut", () => {
    expect(commissionBpsForPlan("essentiel")).toBe(800);
    expect(commissionBpsForPlan("pro")).toBe(500);
    expect(commissionBpsForPlan("expert")).toBe(300);
    expect(commissionBpsForPlan(undefined)).toBe(800);
    expect(commissionBpsForPlan("inconnu")).toBe(800);
  });

  it("ramène un plan expiré au plan essentiel", () => {
    const now = new Date("2026-10-12T12:00:00Z");
    expect(effectivePlan("expert", "2026-10-20T00:00:00Z", now)).toBe("expert");
    expect(effectivePlan("expert", "2026-10-01T00:00:00Z", now)).toBe("essentiel");
    expect(commissionBpsForPlan("pro", "2026-10-01T00:00:00Z", now)).toBe(800);
  });

  it("calcule une période de 30 jours exacts", () => {
    const start = new Date("2026-10-01T00:00:00.000Z");
    expect(nextPeriodEnd(start).toISOString()).toBe("2026-10-31T00:00:00.000Z");
  });
});
