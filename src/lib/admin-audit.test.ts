import { afterEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { recordAdminAction } from "./admin-audit";

function fakeDb(insertError: { message: string } | null = null) {
  const insert = vi.fn().mockResolvedValue({ error: insertError });
  const from = vi.fn(() => ({ insert }));
  return { db: { from } as unknown as SupabaseClient, from, insert };
}

describe("recordAdminAction", () => {
  afterEach(() => vi.restoreAllMocks());

  it("écrit la ligne dans admin_audit_log avec les colonnes attendues", async () => {
    const { db, from, insert } = fakeDb();
    await recordAdminAction(db, {
      actorId: "11111111-1111-1111-1111-111111111111",
      action: "kyc.reject",
      targetType: "verification",
      targetId: "22222222-2222-2222-2222-222222222222",
      details: { reason: "document illisible" },
    });
    expect(from).toHaveBeenCalledWith("admin_audit_log");
    expect(insert).toHaveBeenCalledWith({
      actor_id: "11111111-1111-1111-1111-111111111111",
      action: "kyc.reject",
      target_type: "verification",
      target_id: "22222222-2222-2222-2222-222222222222",
      details: { reason: "document illisible" },
    });
  });

  it("met des détails vides par défaut", async () => {
    const { db, insert } = fakeDb();
    await recordAdminAction(db, {
      actorId: "a",
      action: "kyc.flag",
      targetType: "verification",
      targetId: "b",
    });
    expect(insert.mock.calls[0][0].details).toEqual({});
  });

  it("n'interrompt pas l'action si l'écriture échoue : l'erreur est journalisée", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { db } = fakeDb({ message: "boom" });
    await expect(
      recordAdminAction(db, { actorId: "a", action: "kyc.flag", targetType: "verification", targetId: "b" }),
    ).resolves.toBeUndefined();
    expect(spy).toHaveBeenCalledWith("recordAdminAction:", "boom");
  });
});
