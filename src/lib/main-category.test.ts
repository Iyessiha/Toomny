import { describe, expect, it } from "vitest";
import { CATEGORY_ILLUSTRATIONS, mainCategory } from "@/lib/provider-search";

describe("mainCategory", () => {
  it("retient la catégorie la plus fréquente", () => {
    expect(mainCategory(["montage-video", "photographie", "montage-video"])).toBe("montage-video");
  });

  it("ignore les valeurs vides et renvoie null sans catégorie", () => {
    expect(mainCategory([null, undefined, ""])).toBeNull();
    expect(mainCategory([])).toBeNull();
  });

  it("à égalité, garde la première rencontrée", () => {
    expect(mainCategory(["immobilier", "bien-etre-sante"])).toBe("immobilier");
  });
});

describe("CATEGORY_ILLUSTRATIONS", () => {
  it("couvre les 23 catégories du catalogue", () => {
    expect(CATEGORY_ILLUSTRATIONS.size).toBe(23);
  });
});
