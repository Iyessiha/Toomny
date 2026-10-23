import { describe, expect, it, vi } from "vitest";

// Le module d'e-mail importe `server-only` : hors serveur, on le neutralise.
vi.mock("server-only", () => ({}));
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  NOTIFICATION_TYPES,
  isNotificationType,
  notify,
  renderNotification,
  toParams,
} from "./notifications";

const SAMPLE = {
  from: "Awa K.",
  ref: "TMY-2026-ABCDEF12",
  service: "Logo pro",
  outcome: "won",
  rating: "5",
  amount: "25 000 FCFA",
  plan: "Pro",
} as const;

describe("renderNotification", () => {
  it.each(NOTIFICATION_TYPES)("rend %s en FR et EN", (type) => {
    const fr = renderNotification(type, { ...SAMPLE }, "fr");
    const en = renderNotification(type, { ...SAMPLE }, "en");
    expect(fr).not.toBeNull();
    expect(en).not.toBeNull();
    expect(fr!.title.length).toBeGreaterThan(0);
    expect(fr!.body.length).toBeGreaterThan(0);
    expect(en!.title.length).toBeGreaterThan(0);
    expect(en!.body.length).toBeGreaterThan(0);
  });

  it("mentionne l'expéditeur et la référence quand le type les utilise", () => {
    const fr = renderNotification("order_message", { ...SAMPLE }, "fr")!;
    expect(fr.body).toContain("Awa K.");
    expect(fr.body).toContain("TMY-2026-ABCDEF12");
  });

  it("décline l'issue du litige selon le destinataire", () => {
    const won = renderNotification("dispute_resolved", { ref: "R", outcome: "won" }, "fr")!;
    const lost = renderNotification("dispute_resolved", { ref: "R", outcome: "lost" }, "fr")!;
    expect(won.body).toContain("en votre faveur");
    expect(lost.body).not.toContain("en votre faveur");
  });

  it("rend null pour un type inconnu (ancienne app, ligne corrompue)", () => {
    expect(renderNotification("nope", {}, "fr")).toBeNull();
  });
});

describe("toParams", () => {
  it("ne garde que les clés connues, chaînes non vides, outcome restreint", () => {
    expect(
      toParams({ from: "Awa", ref: 12, hack: "<script>", outcome: "maybe", amount: "" }),
    ).toEqual({ from: "Awa" });
    expect(toParams({ outcome: "lost" })).toEqual({ outcome: "lost" });
  });

  it("rend {} pour tout ce qui n'est pas un objet", () => {
    expect(toParams(null)).toEqual({});
    expect(toParams("x")).toEqual({});
    expect(toParams([1])).toEqual({});
  });
});

describe("isNotificationType", () => {
  it("accepte les 25 types et refuse le reste", () => {
    expect(NOTIFICATION_TYPES).toHaveLength(25);
    expect(isNotificationType("support_replied")).toBe(true);
    expect(isNotificationType("order_funded")).toBe(true);
    expect(isNotificationType("subscription_activated")).toBe(true);
    expect(isNotificationType("ORDER_FUNDED")).toBe(false);
  });
});

describe("notify", () => {
  function fakeDb(impl: { insert?: unknown; error?: { message: string } | null }) {
    const calls: unknown[] = [];
    const db = {
      from: () => ({
        insert: async (row: unknown) => {
          calls.push(row);
          if (impl.insert instanceof Error) throw impl.insert;
          return { error: impl.error ?? null };
        },
      }),
    };
    return { db: db as unknown as SupabaseClient, calls };
  }

  it("insère destinataire, type, paramètres et lien", async () => {
    const { db, calls } = fakeDb({});
    await notify(db, {
      recipientId: "user-1",
      type: "order_funded",
      params: { ref: "R" },
      link: "/orders/abc",
    });
    expect(calls).toEqual([
      { recipient_id: "user-1", type: "order_funded", params: { ref: "R" }, link: "/orders/abc" },
    ]);
  });

  it("refuse les liens externes au lieu de les stocker", async () => {
    const { db, calls } = fakeDb({});
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    await notify(db, {
      recipientId: "user-1",
      type: "order_funded",
      link: "https://evil.example",
    });
    expect(calls).toEqual([]);
    err.mockRestore();
  });

  it("n'échoue jamais : erreur base ou exception sont juste journalisées", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const failing = fakeDb({ error: { message: "boom" } });
    await expect(
      notify(failing.db, { recipientId: "u", type: "order_funded", link: "/orders/abc" }),
    ).resolves.toBeUndefined();
    const throwing = fakeDb({ insert: new Error("down") });
    await expect(
      notify(throwing.db, { recipientId: "u", type: "order_funded", link: "/orders/abc" }),
    ).resolves.toBeUndefined();
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });
});
