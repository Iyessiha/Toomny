import { describe, expect, it } from "vitest";
import { hostOf, validatePortfolioItem } from "./portfolio";

const base = { kind: "video", title: "Montage promo", description: "", url: "https://www.youtube.com/watch?v=abc123" };

describe("validatePortfolioItem", () => {
  it("accepte un lien https valide", () => {
    const r = validatePortfolioItem(base);
    expect(r.ok).toBe(true);
  });
  it("refuse http et les autres protocoles", () => {
    expect(validatePortfolioItem({ ...base, url: "http://exemple.com/video" })).toEqual({ ok: false, error: "url" });
    expect(validatePortfolioItem({ ...base, url: "javascript:alert(1)" })).toEqual({ ok: false, error: "url" });
  });
  it("refuse un type inconnu", () => {
    expect(validatePortfolioItem({ ...base, kind: "pdf" })).toEqual({ ok: false, error: "kind" });
  });
  it("refuse un titre vide ou trop long", () => {
    expect(validatePortfolioItem({ ...base, title: "  " })).toEqual({ ok: false, error: "title" });
    expect(validatePortfolioItem({ ...base, title: "x".repeat(81) })).toEqual({ ok: false, error: "title" });
  });
});

describe("hostOf", () => {
  it("affiche le nom du site sans www", () => {
    expect(hostOf("https://www.youtube.com/watch?v=abc")).toBe("youtube.com");
  });
});
