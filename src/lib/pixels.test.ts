import { describe, expect, it } from "vitest";
import { PIXEL_SETTINGS_EMPTY, parsePixelSettings, pixelScripts } from "./pixels";

const saisie = (valeurs: Record<string, string>) => (name: string) => valeurs[name] ?? "";

describe("parsePixelSettings", () => {
  it("accepte des identifiants valides et normalise les espaces", () => {
    const res = parsePixelSettings(saisie({ meta_pixel_id: " 123456789012345 ", google_ads_id: "AW-536531182" }));
    expect(res).toEqual({
      ok: true,
      values: { ...PIXEL_SETTINGS_EMPTY, meta_pixel_id: "123456789012345", google_ads_id: "AW-536531182" },
    });
  });

  it("traite un champ vide comme pixel désactivé", () => {
    const res = parsePixelSettings(saisie({ tiktok_pixel_id: "   " }));
    expect(res).toEqual({ ok: true, values: PIXEL_SETTINGS_EMPTY });
  });

  it("refuse tout identifiant qui sortirait d'une chaîne JavaScript", () => {
    const res = parsePixelSettings(saisie({ meta_pixel_id: "1');alert(1);//" }));
    expect(res).toEqual({ ok: false, field: "meta_pixel_id" });
  });

  it("refuse un identifiant Google Ads sans préfixe AW-", () => {
    expect(parsePixelSettings(saisie({ google_ads_id: "536531182" }))).toEqual({ ok: false, field: "google_ads_id" });
  });

  it("signale le premier champ invalide", () => {
    const res = parsePixelSettings(saisie({ ga4_measurement_id: "XX", pinterest_tag_id: "abc" }));
    expect(res).toEqual({ ok: false, field: "ga4_measurement_id" });
  });
});

describe("pixelScripts", () => {
  it("ne produit aucun script sans identifiant", () => {
    expect(pixelScripts(PIXEL_SETTINGS_EMPTY)).toEqual([]);
  });

  it("injecte l'identifiant Meta dans le script d'initialisation", () => {
    const scripts = pixelScripts({ ...PIXEL_SETTINGS_EMPTY, meta_pixel_id: "123456789012345" });
    expect(scripts).toHaveLength(1);
    expect(scripts[0].code).toContain("fbq('init','123456789012345')");
  });

  it("charge gtag.js une seule fois pour Google Ads et GA4", () => {
    const scripts = pixelScripts({
      ...PIXEL_SETTINGS_EMPTY,
      google_ads_id: "AW-536531182",
      ga4_measurement_id: "G-ABC123",
    });
    const libs = scripts.filter((s) => s.src);
    expect(libs).toHaveLength(1);
    expect(libs[0].src).toBe("https://www.googletagmanager.com/gtag/js?id=AW-536531182");
    const init = scripts.find((s) => s.id === "gtag-init")?.code ?? "";
    expect(init).toContain("gtag('config','AW-536531182');");
    expect(init).toContain("gtag('config','G-ABC123');");
  });

  it("produit un script par plateforme configurée", () => {
    const scripts = pixelScripts({
      ...PIXEL_SETTINGS_EMPTY,
      tiktok_pixel_id: "C6JABCDEFGHIJKLMNOPQ",
      snapchat_pixel_id: "12345678-1234-1234-1234-123456789abc",
      pinterest_tag_id: "1234567890123",
    });
    expect(scripts.map((s) => s.id)).toEqual(["tiktok", "snapchat", "pinterest"]);
  });
});
