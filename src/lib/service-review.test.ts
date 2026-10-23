import { describe, expect, it } from "vitest";
import { deterministicPoints, mergePoints, parseAiPoints, pointsAsNotes, reviewVerdict, type ServiceForReview } from "./service-review";

const good: ServiceForReview = {
  title: "Création de logo professionnel",
  description: "Je crée votre logo en trois propositions, avec deux révisions incluses. Livraison des fichiers vectoriels et des formats web. ".repeat(2),
  priceMinor: 25000,
  deliveryDays: 5,
  categoryId: "cat-1",
  coverUrl: "https://example.com/c.jpg",
  galleryUrls: ["https://example.com/g.jpg"],
  packagesCount: 0,
};

describe("deterministicPoints", () => {
  it("ne relève aucun point sur une prestation conforme", () => {
    expect(deterministicPoints(good)).toEqual([]);
  });

  it("relève une couverture manquante et une description courte", () => {
    const points = deterministicPoints({ ...good, coverUrl: null, description: "Trop court." });
    expect(points.map((p) => p.reason)).toEqual(["cover_missing", "description_short"]);
  });

  it("relève des coordonnées dans la description", () => {
    const points = deterministicPoints({ ...good, description: good.description + " Appelez le +225 07 12 34 56 78." });
    expect(points.map((p) => p.reason)).toContain("contact_in_text");
  });

  it("relève un prix hors fourchette et un titre trop court", () => {
    const points = deterministicPoints({ ...good, priceMinor: 100, title: "Logo" });
    expect(points.map((p) => p.reason)).toEqual(["title_unclear", "price_unclear"]);
  });
});

describe("parseAiPoints", () => {
  it("ne garde que les motifs connus et des messages non vides", () => {
    const points = parseAiPoints({
      issues: [
        { reason: "wrong_category", message: "Catégorie à revoir." },
        { reason: "inventé", message: "x" },
        { reason: "other", message: "   " },
      ],
    });
    expect(points).toEqual([{ reason: "wrong_category", message: "Catégorie à revoir." }]);
  });

  it("renvoie une liste vide pour une sortie inutilisable", () => {
    expect(parseAiPoints(null)).toEqual([]);
    expect(parseAiPoints({ issues: "non" })).toEqual([]);
  });
});

describe("reviewVerdict", () => {
  it("valide seulement sans aucun point", () => {
    expect(reviewVerdict([]).verdict).toBe("approve");
    expect(reviewVerdict([{ reason: "other", message: "x" }]).verdict).toBe("reject");
  });
});

describe("mergePoints et pointsAsNotes", () => {
  it("fusionne par motif sans doublon", () => {
    const merged = mergePoints(
      [{ reason: "cover_missing", message: "A" }],
      [{ reason: "cover_missing", message: "B" }, { reason: "other", message: "C" }],
    );
    expect(merged.map((p) => p.message)).toEqual(["A", "C"]);
  });

  it("numérote les points pour le prestataire", () => {
    expect(pointsAsNotes([{ reason: "other", message: "A" }, { reason: "other", message: "B" }])).toBe("1. A\n2. B");
  });
});
