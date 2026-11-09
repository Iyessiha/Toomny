import { describe, expect, it } from "vitest";
import { hasTitlePrefix, stripTitlePrefix, TITLE_REST_MAX, withTitlePrefix } from "./service-title";

describe("withTitlePrefix", () => {
  it("ajoute la phrase fixe", () => {
    expect(withTitlePrefix("développer une application Android")).toBe("Je vais développer une application Android");
  });
  it("ne la duplique pas si elle est déjà là", () => {
    expect(withTitlePrefix("Je vais développer une application")).toBe("Je vais développer une application");
    expect(withTitlePrefix("je vais développer une application")).toBe("Je vais développer une application");
  });
});

describe("stripTitlePrefix", () => {
  it("retire la phrase fixe pour pré-remplir le champ", () => {
    expect(stripTitlePrefix("Je vais créer un logo")).toBe("créer un logo");
  });
  it("laisse un titre sans phrase fixe intact", () => {
    expect(stripTitlePrefix("Créer un logo")).toBe("Créer un logo");
  });
});

describe("hasTitlePrefix", () => {
  it("détecte la phrase fixe", () => {
    expect(hasTitlePrefix("Je vais traduire")).toBe(true);
    expect(hasTitlePrefix("Traduire")).toBe(false);
  });
});

describe("TITLE_REST_MAX", () => {
  it("laisse la place de la phrase fixe dans les 120 caractères", () => {
    expect(TITLE_REST_MAX).toBe(120 - "Je vais ".length);
  });
});
