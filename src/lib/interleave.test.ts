import { describe, expect, it } from "vitest";
import { interleaveByProvider } from "./interleave";

const by = (x: { p: string }) => x.p;

describe("interleaveByProvider", () => {
  it("n'aligne jamais deux prestations du même prestataire quand d'autres existent", () => {
    const items = [
      { id: 1, p: "A" }, { id: 2, p: "A" }, { id: 3, p: "A" },
      { id: 4, p: "B" }, { id: 5, p: "C" },
    ];
    const out = interleaveByProvider(items, by);
    expect(out).toHaveLength(5);
    for (let i = 1; i < out.length; i++) {
      expect(out[i].p).not.toBe(out[i - 1].p);
    }
  });

  it("garde l'ordre interne de chaque prestataire", () => {
    const items = [{ id: 1, p: "A" }, { id: 2, p: "A" }, { id: 3, p: "B" }, { id: 4, p: "B" }];
    const out = interleaveByProvider(items, by).map((x) => x.id);
    expect(out.filter((id) => id <= 2)).toEqual([1, 2]);
    expect(out.filter((id) => id >= 3)).toEqual([3, 4]);
  });

  it("ne change rien quand un seul prestataire est présent", () => {
    const items = [{ id: 1, p: "A" }, { id: 2, p: "A" }];
    expect(interleaveByProvider(items, by)).toEqual(items);
  });

  it("gère une liste vide", () => {
    expect(interleaveByProvider([], by)).toEqual([]);
  });
});
