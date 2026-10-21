import { describe, expect, it } from "vitest";
import { detectLanguage } from "./detect-language";

describe("detectLanguage", () => {
  it("reconnaît l'anglais", () => {
    expect(detectLanguage("I will design your logo with clean lines and deliver the files within three days.")).toBe("en");
  });

  it("reconnaît le français", () => {
    expect(detectLanguage("Je vais créer votre logo avec des lignes nettes et livrer les fichiers dans les trois jours.")).toBe("fr");
  });

  it("renvoie null pour un texte trop court ou ambigu", () => {
    expect(detectLanguage("Logo design")).toBeNull();
    expect(detectLanguage("")).toBeNull();
  });
});
