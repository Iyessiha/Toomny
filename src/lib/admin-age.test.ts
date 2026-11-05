import { describe, expect, it } from "vitest";
import { ageLabel, isStale } from "./admin-age";

const now = new Date("2026-10-30T12:00:00Z");

describe("ageLabel", () => {
  it("affiche les minutes", () => {
    expect(ageLabel("2026-10-30T11:45:00Z", now)).toBe("15 min");
  });
  it("affiche les heures", () => {
    expect(ageLabel("2026-10-30T07:00:00Z", now)).toBe("5 h");
  });
  it("affiche les jours au-delà de 48 h", () => {
    expect(ageLabel("2026-10-26T12:00:00Z", now)).toBe("4 j");
  });
});

describe("isStale", () => {
  it("n'est pas en retard sous 48 h", () => {
    expect(isStale("2026-10-29T13:00:00Z", now)).toBe(false);
  });
  it("est en retard au-delà de 48 h", () => {
    expect(isStale("2026-10-28T11:00:00Z", now)).toBe(true);
  });
});
