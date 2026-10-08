import { describe, expect, it } from "vitest";
import { isValidAdultDob, matchesMagicBytes } from "./kyc";

const NOW = new Date("2026-10-08T12:00:00Z");

describe("matchesMagicBytes", () => {
  it("reconnaît les vraies signatures des formats acceptés", () => {
    expect(matchesMagicBytes(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]), "image/jpeg")).toBe(true);
    expect(matchesMagicBytes(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), "image/png")).toBe(true);
    expect(matchesMagicBytes(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]), "application/pdf")).toBe(true);
  });

  it("rejette un fichier dont le contenu ne correspond pas au type déclaré", () => {
    // Un exécutable ou du HTML renommé en .jpg ne passe pas.
    expect(matchesMagicBytes(new TextEncoder().encode("<html>"), "image/jpeg")).toBe(false);
    expect(matchesMagicBytes(new Uint8Array([0x25, 0x50, 0x44, 0x46]), "image/png")).toBe(false);
  });

  it("vérifie le motif WEBP à l'offset 8", () => {
    const riffOnly = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x41, 0x56, 0x49, 0x20]);
    const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
    expect(matchesMagicBytes(riffOnly, "image/webp")).toBe(false);
    expect(matchesMagicBytes(webp, "image/webp")).toBe(true);
  });

  it("refuse un type MIME absent de la liste", () => {
    expect(matchesMagicBytes(new Uint8Array([0xff, 0xd8, 0xff]), "image/gif")).toBe(false);
  });
});

describe("isValidAdultDob", () => {
  it("accepte une personne de 18 ans révolus", () => {
    expect(isValidAdultDob("2008-10-08", NOW)).toBe(true);
    expect(isValidAdultDob("1990-01-01", NOW)).toBe(true);
  });

  it("refuse une personne qui n'a pas encore 18 ans", () => {
    expect(isValidAdultDob("2008-10-09", NOW)).toBe(false);
    expect(isValidAdultDob("2015-06-01", NOW)).toBe(false);
  });

  it("refuse les dates inexistantes et les formats inattendus", () => {
    expect(isValidAdultDob("1990-02-30", NOW)).toBe(false);
    expect(isValidAdultDob("01/01/1990", NOW)).toBe(false);
    expect(isValidAdultDob("", NOW)).toBe(false);
  });

  it("refuse les dates antérieures à 1900", () => {
    expect(isValidAdultDob("1850-01-01", NOW)).toBe(false);
  });
});
