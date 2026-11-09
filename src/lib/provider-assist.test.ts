import { describe, expect, it } from "vitest";
import {
  SERVICE_LIMITS,
  hasAiAccess,
  mergeProfileDraft,
  sanitizeProfileDraft,
  sanitizeServiceDrafts,
} from "./provider-assist";

const CATS = [
  { id: "c1", slug: "design" },
  { id: "c2", slug: "dev" },
];
const LONG = "Description suffisamment longue pour passer la validation minimale.";

describe("sanitizeProfileDraft", () => {
  it("rejette une sortie qui n'est pas un objet", () => {
    expect(sanitizeProfileDraft(null)).toBeNull();
    expect(sanitizeProfileDraft("texte")).toBeNull();
  });

  it("rejette un profil sans titre ni bio", () => {
    expect(sanitizeProfileDraft({ headline: "", bio: "  " })).toBeNull();
  });

  it("borne les longueurs et ignore les listes mal formées", () => {
    const draft = sanitizeProfileDraft({
      headline: "x".repeat(500),
      bio: "Bio",
      city: "Abidjan",
      skills: ["a", 3, "  ", "b"],
      spokenLanguages: "fr",
    });
    expect(draft?.headline).toHaveLength(120);
    expect(draft?.skills).toEqual(["a", "b"]);
    expect(draft?.spokenLanguages).toEqual([]);
  });
});

describe("sanitizeServiceDrafts", () => {
  it("garde seulement les catégories existantes", () => {
    const out = sanitizeServiceDrafts(
      {
        services: [
          { title: "Logo", description: LONG, categorySlug: "design", priceXof: 20000, deliveryDays: 3, tags: ["logo"] },
          { title: "Hack", description: LONG, categorySlug: "inconnue", priceXof: 20000, deliveryDays: 3, tags: [] },
        ],
      },
      CATS,
      5,
    );
    expect(out).toHaveLength(1);
    expect(out[0].categoryId).toBe("c1");
  });

  it("rejette les descriptions trop courtes", () => {
    const out = sanitizeServiceDrafts(
      { services: [{ title: "T", description: "court", categorySlug: "dev", priceXof: 9000, deliveryDays: 2, tags: [] }] },
      CATS,
      5,
    );
    expect(out).toEqual([]);
  });

  it("borne le prix dans la fourchette autorisée et le délai", () => {
    const [low, high] = sanitizeServiceDrafts(
      {
        services: [
          { title: "A", description: LONG, categorySlug: "dev", priceXof: 10, deliveryDays: 0, tags: [] },
          { title: "B", description: LONG, categorySlug: "dev", priceXof: 99_999_999, deliveryDays: 900, tags: [] },
        ],
      },
      CATS,
      5,
    );
    expect(low.priceXof).toBe(SERVICE_LIMITS.minPriceXof);
    expect(low.deliveryDays).toBe(1);
    expect(high.priceXof).toBe(SERVICE_LIMITS.maxPriceXof);
    expect(high.deliveryDays).toBe(365);
  });

  it("respecte le maximum demandé", () => {
    const item = { title: "A", description: LONG, categorySlug: "dev", priceXof: 9000, deliveryDays: 2, tags: [] };
    expect(sanitizeServiceDrafts({ services: [item, item, item] }, CATS, 2)).toHaveLength(2);
  });
});

describe("mergeProfileDraft", () => {
  it("ne remplit que les champs vides", () => {
    const merged = mergeProfileDraft(
      { headline: "Mon titre", bio: "", city: "", skills: "", spokenLanguages: "fr" },
      { headline: "Titre IA", bio: "Bio IA", city: "Abidjan", skills: ["logo"], spokenLanguages: ["en"] },
    );
    expect(merged).toEqual({
      headline: "Mon titre",
      bio: "Bio IA",
      city: "Abidjan",
      skills: "logo",
      spokenLanguages: "fr",
    });
  });
});

describe("hasAiAccess", () => {
  const now = new Date("2026-10-23T12:00:00Z");
  it("refuse le plan Débutant", () => {
    expect(hasAiAccess("debutant", null, now)).toBe(false);
  });
  it("accepte un plan payé actif", () => {
    expect(hasAiAccess("pro", "2026-11-01T00:00:00Z", now)).toBe(true);
  });
  it("refuse un plan payé expiré", () => {
    expect(hasAiAccess("expert", "2026-10-01T00:00:00Z", now)).toBe(false);
  });
});
