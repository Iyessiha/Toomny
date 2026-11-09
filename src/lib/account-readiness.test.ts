import { describe, expect, it } from "vitest";
import { accountReadiness, readinessSummary } from "./account-readiness";

const full = {
  headline: "Graphiste logo et identité visuelle",
  bio: "Je crée des identités visuelles pour les PME depuis cinq ans, de la recherche au fichier livré.",
  city: "Abidjan",
  skills: "logo, affiche",
  avatarUrl: "https://example.com/a.png",
};

describe("accountReadiness", () => {
  it("bloque la publication sans e-mail confirmé, même si le profil est complet", () => {
    const r = accountReadiness({ emailConfirmed: false, verificationStatus: "verified", role: "provider", profile: full });
    expect(r.canPublish).toBe(false);
    expect(r.profileComplete).toBe(true);
    expect(r.checks.find((c) => c.key === "email")?.ok).toBe(false);
  });

  it("bloque la publication sans identité vérifiée, même avec un e-mail confirmé", () => {
    const r = accountReadiness({ emailConfirmed: true, verificationStatus: "pending", role: "provider", profile: full });
    expect(r.canPublish).toBe(false);
    expect(r.checks.find((c) => c.key === "identity")?.ok).toBe(false);
  });

  it("autorise la publication avec les deux prérequis, même si le profil est incomplet", () => {
    const r = accountReadiness({
      emailConfirmed: true,
      verificationStatus: "verified",
      role: "both",
      profile: { ...full, bio: "trop court", avatarUrl: null },
    });
    expect(r.canPublish).toBe(true);
    expect(r.profileComplete).toBe(false);
    expect(r.missing.map((c) => c.key)).toEqual(["bio", "avatar"]);
  });

  it("ne déclare jamais publiable un compte client", () => {
    const r = accountReadiness({ emailConfirmed: true, verificationStatus: "verified", role: "client", profile: full });
    expect(r.canPublish).toBe(false);
  });

  it("gère un profil absent", () => {
    const r = accountReadiness({ emailConfirmed: true, verificationStatus: "verified", role: "provider", profile: null });
    expect(r.canPublish).toBe(true);
    expect(r.profileComplete).toBe(false);
    expect(r.missing.length).toBe(5);
  });

  it("compte les compétences en ignorant les vides", () => {
    const r = accountReadiness({
      emailConfirmed: true,
      verificationStatus: "verified",
      role: "provider",
      profile: { ...full, skills: "logo, , ," },
    });
    expect(r.checks.find((c) => c.key === "skills")?.ok).toBe(false);
  });
});

describe("readinessSummary", () => {
  it("indique clairement ce qui bloque", () => {
    const r = accountReadiness({ emailConfirmed: false, verificationStatus: "unverified", role: "provider", profile: null });
    const text = readinessSummary(r);
    expect(text).toContain("Peut publier une prestation : non");
    expect(text).toContain("Adresse e-mail confirmée (bloquant");
  });
});
