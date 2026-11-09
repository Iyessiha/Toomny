import { describe, expect, it } from "vitest";
import { countInRange, sha1Upper } from "./password-leak";

describe("sha1Upper", () => {
  it("calcule le SHA-1 connu de « password »", async () => {
    expect(await sha1Upper("password")).toBe("5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8");
  });
});

describe("countInRange", () => {
  const body = "1E4C9B93F3F0682250B6CF8331B7EE68FD8:3861493\r\nFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF:0\r\n";

  it("retourne le nombre d'apparitions quand le suffixe est présent", () => {
    expect(countInRange("1E4C9B93F3F0682250B6CF8331B7EE68FD8", body)).toBe(3861493);
  });

  it("retourne 0 quand le suffixe est absent", () => {
    expect(countInRange("0000000000000000000000000000000000000", body)).toBe(0);
  });

  it("ne confond pas un suffixe avec un préfixe", () => {
    expect(countInRange("1E4C9B93F3F0682250B6CF8331B7EE68FD", body)).toBe(0);
  });
});
