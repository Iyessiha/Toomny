import { describe, expect, it } from "vitest";
import { PURGED_BODY, SUPPORT_TEXT_RETENTION_DAYS, retentionCutoff } from "./support-retention";

describe("retentionCutoff", () => {
  it("recule exactement de la durée de rétention", () => {
    const now = new Date("2026-10-23T12:00:00Z");
    const cutoff = new Date(retentionCutoff(now));
    expect((now.getTime() - cutoff.getTime()) / 86_400_000).toBe(SUPPORT_TEXT_RETENTION_DAYS);
  });

  it("indique la durée dans le texte de remplacement", () => {
    expect(PURGED_BODY).toContain("90 jours");
  });
});
