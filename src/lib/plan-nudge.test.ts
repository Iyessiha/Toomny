import { describe, expect, it } from "vitest";
import { planNudge } from "./plan-nudge";

const now = new Date("2026-10-23T12:00:00Z");

describe("planNudge", () => {
  it("propose Essentiel au Débutant, avec la limite de 2 prestations", () => {
    const n = planNudge({ plan: "debutant", activeServices: 0, now });
    expect(n.activeTier).toBe("debutant");
    expect(n.maxServices).toBe(2);
    expect(n.nextTier).toBe("essentiel");
    expect(n.expired).toBe(false);
  });

  it("signale l'atteinte de la limite du Débutant", () => {
    const n = planNudge({ plan: "debutant", activeServices: 2, now });
    expect(n.atLimit).toBe(true);
    expect(n.nearLimit).toBe(false);
  });

  it("signale l'approche de la limite à 80 %", () => {
    // Essentiel : 8 prestations, seuil 80 % = 7 (arrondi supérieur).
    const n = planNudge({ plan: "essentiel", expiresAt: "2026-11-01T00:00:00Z", activeServices: 7, now });
    expect(n.nearLimit).toBe(true);
    expect(n.atLimit).toBe(false);
    expect(n.nextTier).toBe("pro");
  });

  it("détecte un abonnement expiré et propose de le renouveler", () => {
    const n = planNudge({ plan: "pro", expiresAt: "2026-10-01T00:00:00Z", activeServices: 1, now });
    expect(n.expired).toBe(true);
    expect(n.activeTier).toBe("debutant");
    expect(n.nextTier).toBe("essentiel");
  });

  it("n'a pas de palier supérieur pour Expert", () => {
    const n = planNudge({ plan: "expert", expiresAt: "2026-11-01T00:00:00Z", activeServices: 10, now });
    expect(n.nextTier).toBeNull();
    expect(n.maxServices).toBe(50);
  });
});
