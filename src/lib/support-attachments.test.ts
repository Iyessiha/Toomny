import { describe, expect, it } from "vitest";
import {
  ATTACHMENT_MAX_BYTES,
  QUOTE_MAX_CHARS,
  attachmentStoragePath,
  parseAttachmentIds,
  quoteSnippet,
  validateAttachment,
} from "./support-attachments";

describe("validateAttachment", () => {
  it("accepte une capture PNG de taille normale", () => {
    expect(validateAttachment({ bytes: 120_000, mime: "image/png" })).toEqual({ ok: true });
  });

  it("refuse un format non image", () => {
    expect(validateAttachment({ bytes: 1000, mime: "application/pdf" })).toHaveProperty("error");
    expect(validateAttachment({ bytes: 1000, mime: null })).toHaveProperty("error");
  });

  it("refuse un fichier au-delà de 5 Mo, et un fichier vide", () => {
    expect(validateAttachment({ bytes: ATTACHMENT_MAX_BYTES + 1, mime: "image/jpeg" })).toHaveProperty("error");
    expect(validateAttachment({ bytes: 0, mime: "image/jpeg" })).toHaveProperty("error");
  });
});

describe("quoteSnippet", () => {
  it("garde un message court tel quel, sans sauts de ligne", () => {
    expect(quoteSnippet("Bonjour,\n  merci.")).toBe("Bonjour, merci.");
  });

  it("coupe un long message et ajoute une ellipse", () => {
    const out = quoteSnippet("a".repeat(QUOTE_MAX_CHARS + 50));
    expect(out.length).toBe(QUOTE_MAX_CHARS);
    expect(out.endsWith("…")).toBe(true);
  });
});

describe("attachmentStoragePath", () => {
  it("range chaque image dans le dossier de sa demande, nom aléatoire", () => {
    expect(attachmentStoragePath("req-1", "f0e1", "image/jpeg")).toBe("req-1/f0e1.jpg");
    expect(attachmentStoragePath("req-1", "f0e1", "image/webp")).toBe("req-1/f0e1.webp");
  });
});

describe("parseAttachmentIds", () => {
  const a = "11111111-1111-4111-8111-111111111111";
  const b = "22222222-2222-4222-8222-222222222222";

  it("garde les identifiants valides, sans doublon", () => {
    expect(parseAttachmentIds(`${a}, ${b}, ${a}`)).toEqual([a, b]);
  });

  it("ignore les valeurs qui ne sont pas des identifiants", () => {
    expect(parseAttachmentIds(`${a},<script>,../etc`)).toEqual([a]);
  });

  it("renvoie une liste vide pour une valeur absente", () => {
    expect(parseAttachmentIds(null)).toEqual([]);
    expect(parseAttachmentIds("")).toEqual([]);
  });
});
