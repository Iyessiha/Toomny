import { describe, expect, it } from "vitest";
import { parsePackages } from "./packages";

const valid = { tier: 1, name: "Basique", description: "Inclus", price_minor: 5000, delivery_days: 3 };

describe("parsePackages", () => {
  it("accepte une liste vide", () => {
    expect(parsePackages([])).toEqual([]);
  });

  it("accepte des forfaits valides et nettoie les chaînes", () => {
    expect(parsePackages([{ ...valid, name: "  Basique  ", description: "  " }])).toEqual([
      { tier: 1, name: "Basique", description: null, price_minor: 5000, delivery_days: 3 },
    ]);
  });

  it("refuse ce qui n'est pas un tableau", () => {
    expect(parsePackages(null)).toBeNull();
    expect(parsePackages({})).toBeNull();
    expect(parsePackages("x")).toBeNull();
  });

  it("refuse plus de 3 forfaits et les doublons de palier", () => {
    expect(parsePackages([valid, valid, valid, valid])).toBeNull();
    expect(parsePackages([valid, { ...valid }])).toBeNull();
    expect(parsePackages([{ ...valid, tier: 4 }])).toBeNull();
    expect(parsePackages([{ ...valid, tier: "1" }])).toBeNull();
  });

  it("refuse les noms manquants ou vides au lieu de lever", () => {
    expect(parsePackages([{ ...valid, name: undefined }])).toBeNull();
    expect(parsePackages([{ ...valid, name: "   " }])).toBeNull();
    expect(parsePackages([{ ...valid, name: 42 }])).toBeNull();
  });

  it("refuse les prix non entiers, NaN, null ou hors bornes", () => {
    for (const price of [NaN, null, "5000", 999, 10_000_001, 12.5, -100]) {
      expect(parsePackages([{ ...valid, price_minor: price }]), `prix ${price}`).toBeNull();
    }
    // JSON.stringify(NaN) donne null : le cas du formulaire est couvert ci-dessus.
    expect(JSON.parse(JSON.stringify({ v: NaN })).v).toBeNull();
  });

  it("refuse les délais hors bornes", () => {
    expect(parsePackages([{ ...valid, delivery_days: 0 }])).toBeNull();
    expect(parsePackages([{ ...valid, delivery_days: 366 }])).toBeNull();
    expect(parsePackages([{ ...valid, delivery_days: 2.5 }])).toBeNull();
  });

  it("refuse les descriptions non textuelles", () => {
    expect(parsePackages([{ ...valid, description: 42 }])).toBeNull();
  });
});
