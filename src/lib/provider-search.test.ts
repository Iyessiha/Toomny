import { describe, expect, it } from "vitest";
import { filterProviders, normalizeSearch, type ProviderCardData } from "./provider-search";

const base: ProviderCardData = {
  id: "1", name: "Fousseni Coulibaly", verified: true, country: "CI", avatar: null, headline: "Graphiste logo",
  city: "Abidjan", skills: "Design, Logo", rating: null, ratingCount: 0, received: 0, services: 1, boosted: false, businessType: "individual", companyName: null, fromPriceMinor: null,
};

describe("normalizeSearch", () => {
  it("ignore la casse et les accents", () => {
    expect(normalizeSearch("Éléctricité")).toBe("electricite");
  });
});

describe("filterProviders", () => {
  it("trouve par ville, métier ou compétence", () => {
    expect(filterProviders([base], "abidjan")).toHaveLength(1);
    expect(filterProviders([base], "LOGO")).toHaveLength(1);
    expect(filterProviders([base], "plombier")).toHaveLength(0);
  });
  it("garde tout quand la recherche est vide", () => {
    expect(filterProviders([base], "  ")).toHaveLength(1);
  });
});
