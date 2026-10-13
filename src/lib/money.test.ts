import { describe, expect, it } from "vitest";
import { splitOrderAmount, toMinor, DEFAULT_COMMISSION_BPS } from "./money";

describe("toMinor", () => {
  it("lit le XOF sans décimale, espaces de milliers compris", () => {
    expect(toMinor("1 500", "XOF")).toBe(1500n);
    expect(toMinor(25000, "XOF")).toBe(25000n);
  });

  it("refuse les décimales en XOF, qui n'a pas de subdivision", () => {
    expect(() => toMinor("12.50", "XOF")).toThrow();
  });

  it("accepte la virgule décimale pour les devises à 2 décimales", () => {
    expect(toMinor("12,5", "USD")).toBe(1250n);
    expect(toMinor("12.50", "USD")).toBe(1250n);
  });

  it("refuse les saisies non numériques et les devises inconnues", () => {
    expect(() => toMinor("abc", "XOF")).toThrow();
    expect(() => toMinor("10", "BTC")).toThrow();
  });
});

describe("splitOrderAmount", () => {
  it("commission + net égalent toujours le montant, sans centime perdu", () => {
    for (const amount of [1n, 7n, 999n, 12_345n, 1_000_003n]) {
      const s = splitOrderAmount(amount);
      expect(s.commissionMinor + s.providerNetMinor).toBe(amount);
    }
  });

  it("arrondit la commission vers le bas : le prestataire ne perd jamais", () => {
    // 7 FCFA à 10 % = 0,7 FCFA : la commission tombe à 0, le prestataire garde 7.
    const s = splitOrderAmount(7n);
    expect(s.commissionMinor).toBe(0n);
    expect(s.providerNetMinor).toBe(7n);
  });

  it("applique la commission par défaut de 1000 bps", () => {
    const s = splitOrderAmount(50_000n);
    expect(s.commissionRateBps).toBe(DEFAULT_COMMISSION_BPS);
    expect(s.commissionMinor).toBe(5_000n);
    expect(s.providerNetMinor).toBe(45_000n);
  });

  it("rejette un montant nul ou négatif", () => {
    expect(() => splitOrderAmount(0n)).toThrow();
    expect(() => splitOrderAmount(-1n)).toThrow();
  });

  it("rejette un taux hors de 0 à 10000 bps", () => {
    expect(() => splitOrderAmount(100n, -1)).toThrow();
    expect(() => splitOrderAmount(100n, 10_001)).toThrow();
  });
});
