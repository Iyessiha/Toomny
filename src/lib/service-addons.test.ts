import { describe, expect, it } from "vitest";
import { hasPaidPlan } from "./plans";
import { MAX_ADDONS_PER_SERVICE, orderTotals, validateAddon } from "./service-addons";

const future = new Date(Date.now() + 86_400_000 * 10);
const past = new Date(Date.now() - 86_400_000);

describe("hasPaidPlan", () => {
  it("refuse le plan débutant", () => {
    expect(hasPaidPlan("debutant")).toBe(false);
  });
  it("accepte un plan payant en cours", () => {
    expect(hasPaidPlan("essentiel", future)).toBe(true);
  });
  it("refuse un plan payant expiré", () => {
    expect(hasPaidPlan("pro", past)).toBe(false);
  });
});

describe("validateAddon", () => {
  const base = { title: "Livraison express", description: "", priceRaw: "5000", extraDays: 0 };

  it("accepte un supplément valide", () => {
    const r = validateAddon(base);
    expect(r).toEqual({ ok: true, value: { title: "Livraison express", description: null, priceMinor: 5000n, extraDays: 0 } });
  });
  it("refuse un titre vide", () => {
    expect(validateAddon({ ...base, title: "   " })).toEqual({ ok: false, error: "title" });
  });
  it("refuse un prix sous le minimum", () => {
    expect(validateAddon({ ...base, priceRaw: "500" })).toEqual({ ok: false, error: "price" });
  });
  it("refuse un prix non numérique", () => {
    expect(validateAddon({ ...base, priceRaw: "abc" })).toEqual({ ok: false, error: "price" });
  });
  it("refuse plus de 60 jours supplémentaires", () => {
    expect(validateAddon({ ...base, extraDays: 61 })).toEqual({ ok: false, error: "days" });
  });
  it("garde la limite de suppléments par prestation", () => {
    expect(MAX_ADDONS_PER_SERVICE).toBe(5);
  });
});

describe("orderTotals", () => {
  it("additionne prix et délais des suppléments", () => {
    const totals = orderTotals(25000n, 3, [
      { price_minor: "5000", extra_delivery_days: 1 },
      { price_minor: 2000, extra_delivery_days: 0 },
    ]);
    expect(totals).toEqual({ priceMinor: 32000n, deliveryDays: 4 });
  });
  it("sans supplément, garde le prix et le délai de base", () => {
    expect(orderTotals(25000n, 3, [])).toEqual({ priceMinor: 25000n, deliveryDays: 3 });
  });
});
