import { describe, expect, it } from "vitest";
import { checkListing, containsContact } from "./listing-checks";

describe("containsContact", () => {
  it("détecte un téléphone, un e-mail et un lien", () => {
    expect(containsContact("Appelez le +225 07 49 19 49 52")).toBe(true);
    expect(containsContact("écrivez à moi : jean@mail.com")).toBe(true);
    expect(containsContact("voir www.monsite.ci")).toBe(true);
  });

  it("ne signale pas une description normale", () => {
    expect(containsContact("Je livre une vidéo de 30 secondes en 48 h, avec deux révisions.")).toBe(false);
  });
});

describe("checkListing", () => {
  it("valide une annonce complète", () => {
    const checks = checkListing({
      description: "x".repeat(120),
      coverUrl: "https://example.supabase.co/c.jpg",
      galleryUrls: ["https://example.supabase.co/g.jpg"],
    });
    expect(checks.every((c) => c.ok)).toBe(true);
  });

  it("signale l'absence de couverture et de galerie et une description trop courte", () => {
    const checks = checkListing({ description: "Trop court", coverUrl: null, galleryUrls: [] });
    expect(checks.find((c) => c.key === "cover")?.ok).toBe(false);
    expect(checks.find((c) => c.key === "gallery")?.ok).toBe(false);
    expect(checks.find((c) => c.key === "description")?.ok).toBe(false);
  });
});
