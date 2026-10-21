import { describe, expect, it } from "vitest";
import { isLandscape } from "./resize-image";

describe("isLandscape", () => {
  it("accepte le paysage 16:9 et 4:3", () => {
    expect(isLandscape(1920, 1080)).toBe(true);
    expect(isLandscape(1600, 1200)).toBe(true);
  });

  it("refuse le carré et le portrait", () => {
    expect(isLandscape(1000, 1000)).toBe(false);
    expect(isLandscape(900, 1600)).toBe(false);
  });

  it("refuse une image à peine plus large que haute", () => {
    expect(isLandscape(1100, 1000)).toBe(false);
  });

  it("refuse une hauteur nulle", () => {
    expect(isLandscape(1000, 0)).toBe(false);
  });
});
