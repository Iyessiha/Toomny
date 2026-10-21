import { describe, expect, it } from "vitest";
import { buildCsp } from "./proxy";

function directive(csp: string, name: string): string {
  return csp.split(";").map((d) => d.trim()).find((d) => d.startsWith(`${name} `)) ?? "";
}

describe("buildCsp", () => {
  it("autorise les scripts portant le nonce de la requête, et seulement celui-là", () => {
    const script = directive(buildCsp("abc123", false), "script-src");
    expect(script).toContain("'nonce-abc123'");
    expect(script).toContain("'strict-dynamic'");
  });

  it("n'autorise jamais 'unsafe-inline' ni 'unsafe-eval' pour les scripts en production", () => {
    const script = directive(buildCsp("n", false), "script-src");
    expect(script).not.toContain("'unsafe-inline'");
    expect(script).not.toContain("'unsafe-eval'");
  });

  it("n'ouvre 'unsafe-eval' qu'en développement, pour le rechargement à chaud", () => {
    expect(directive(buildCsp("n", true), "script-src")).toContain("'unsafe-eval'");
  });

  it("bloque les objets, les iframes tierces et le clickjacking", () => {
    const csp = buildCsp("n", false);
    expect(directive(csp, "object-src")).toBe("object-src 'none'");
    expect(directive(csp, "frame-ancestors")).toBe("frame-ancestors 'none'");
    expect(directive(csp, "frame-src")).toBe("frame-src https://challenges.cloudflare.com");
  });

  it("ne liste que Supabase, Turnstile et les plateformes de suivi comme origines externes", () => {
    const csp = buildCsp("n", false);
    const external = csp.match(/https?:\/\/[^\s;']+|wss:\/\/[^\s;']+/g) ?? [];
    const autorisees = new Set([
      "https://challenges.cloudflare.com",
      "https://*.supabase.co",
      "wss://*.supabase.co",
      "https://connect.facebook.net",
      "https://analytics.tiktok.com",
      "https://sc-static.net",
      "https://s.pinimg.com",
      "https://www.googletagmanager.com",
      "https://www.facebook.com",
      "https://tr.snapchat.com",
      "https://sc-logs.snapchat.com",
      "https://ct.pinterest.com",
      "https://www.google.com",
      "https://*.google-analytics.com",
      "https://*.analytics.google.com",
      "https://*.googletagmanager.com",
      "https://*.doubleclick.net",
    ]);
    for (const origin of new Set(external)) {
      expect(autorisees).toContain(origin);
    }
  });
});
