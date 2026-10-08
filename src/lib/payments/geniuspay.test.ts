import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GeniusPayProvider } from "./geniuspay";

const SECRET = "whsec_test_secret";
const body = JSON.stringify({ event: "payment.completed", data: { reference: "PAY-1" } });

function sign(payload: string, timestamp: string): string {
  return createHmac("sha256", SECRET).update(`${timestamp}.${payload}`).digest("hex");
}

describe("GeniusPayProvider.parseWebhook", () => {
  const provider = new GeniusPayProvider();
  let now: number;

  beforeEach(() => {
    vi.stubEnv("GENIUSPAY_WEBHOOK_SECRET", SECRET);
    now = Date.parse("2026-10-08T12:00:00Z");
    vi.spyOn(Date, "now").mockImplementation(() => now);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("accepte une signature valide dans la fenêtre de 5 minutes", () => {
    const ts = String(now / 1000);
    const event = provider.parseWebhook(body, sign(body, ts), ts);
    expect(event).toBeDefined();
  });

  it("rejette une signature falsifiée", () => {
    const ts = String(now / 1000);
    expect(() => provider.parseWebhook(body, sign(body + " ", ts), ts)).toThrow(/invalide/);
  });

  it("rejette un corps modifié après signature", () => {
    const ts = String(now / 1000);
    const forged = body.replace("PAY-1", "PAY-2");
    expect(() => provider.parseWebhook(forged, sign(body, ts), ts)).toThrow(/invalide/);
  });

  it("rejette une signature rejouée au-delà de 300 secondes", () => {
    const ts = String(now / 1000 - 301);
    expect(() => provider.parseWebhook(body, sign(body, ts), ts)).toThrow(/fenêtre/);
  });

  it("rejette une requête sans signature ou sans horodatage", () => {
    expect(() => provider.parseWebhook(body, null, "1")).toThrow(/signature/);
    expect(() => provider.parseWebhook(body, "abc")).toThrow(/horodatage/);
  });

  it("rejette sans secret configuré plutôt que de valider à vide", () => {
    vi.stubEnv("GENIUSPAY_WEBHOOK_SECRET", "");
    const ts = String(now / 1000);
    expect(() => provider.parseWebhook(body, sign(body, ts), ts)).toThrow(/manquante/);
  });
});
