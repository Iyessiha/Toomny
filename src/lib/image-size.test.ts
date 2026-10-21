import { describe, expect, it } from "vitest";
import { isLandscapeBytes, readImageSize } from "./image-size";

// En-tête PNG minimal : signature + IHDR avec largeur et hauteur.
function pngHeader(width: number, height: number): Uint8Array {
  const b = new Uint8Array(24);
  b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  const view = new DataView(b.buffer);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return b;
}

describe("readImageSize", () => {
  it("lit les dimensions d'un PNG", () => {
    expect(readImageSize(pngHeader(1600, 900))).toEqual({ width: 1600, height: 900 });
  });

  it("accepte un paysage et refuse le portrait et le carré", () => {
    expect(isLandscapeBytes(pngHeader(1600, 900))).toBe(true);
    expect(isLandscapeBytes(pngHeader(900, 1600))).toBe(false);
    expect(isLandscapeBytes(pngHeader(1000, 1000))).toBe(false);
  });

  it("refuse un fichier dont les dimensions sont illisibles", () => {
    expect(isLandscapeBytes(new Uint8Array([1, 2, 3]))).toBe(false);
  });
});
