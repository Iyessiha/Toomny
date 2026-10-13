import { describe, expect, it, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { anonymizedEmail, deleteAccount } from "./account";

const USER = "11111111-1111-1111-1111-111111111111";

type Scenario = { openOrders?: unknown[]; openPayouts?: unknown[]; kycFiles?: { name: string }[] };

/** Faux client : enregistre chaque écriture et renvoie les données du scénario. */
function fakeDb(s: Scenario) {
  const writes: { table: string; method: string; args: unknown[] }[] = [];
  const authUpdate = vi.fn().mockResolvedValue({ data: {}, error: null });
  const storageRemove = vi.fn().mockResolvedValue({ error: null });

  const builder = (table: string) => {
    const ops: { method: string; args: unknown[] }[] = [];
    const chain: Record<string, unknown> = {};
    const handler = (method: string) => (...args: unknown[]) => {
      ops.push({ method, args });
      return chain;
    };
    for (const m of ["select", "or", "in", "limit", "eq", "update", "delete"]) chain[m] = handler(m);
    chain.then = (resolve: (v: unknown) => void) => {
      const writing = ops.some((o) => o.method === "update" || o.method === "delete");
      if (writing) ops.forEach((o) => writes.push({ table, method: o.method, args: o.args }));
      const data =
        table === "orders" ? s.openOrders ?? [] : table === "payouts" ? s.openPayouts ?? [] : [];
      resolve({ data, error: null });
    };
    return chain;
  };

  const db = {
    from: (table: string) => builder(table),
    storage: {
      from: () => ({
        list: vi.fn().mockResolvedValue({ data: s.kycFiles ?? [], error: null }),
        remove: storageRemove,
      }),
    },
    auth: { admin: { updateUserById: authUpdate } },
  } as unknown as SupabaseClient;

  return { db, writes, authUpdate, storageRemove };
}

describe("deleteAccount", () => {
  beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}));

  it("refuse tant qu'une commande est en cours, sans rien effacer", async () => {
    const { db, writes, authUpdate } = fakeDb({ openOrders: [{ id: "o1" }] });
    const r = await deleteAccount(db, USER);
    expect(r).toEqual({ ok: false, reason: "active" });
    expect(writes).toHaveLength(0);
    expect(authUpdate).not.toHaveBeenCalled();
  });

  it("refuse tant qu'un versement est en file d'attente", async () => {
    const { db, writes } = fakeDb({ openPayouts: [{ id: "p1" }] });
    expect(await deleteAccount(db, USER)).toEqual({ ok: false, reason: "active" });
    expect(writes).toHaveLength(0);
  });

  it("anonymise le profil et bannit le compte quand tout est soldé", async () => {
    const { db, writes, authUpdate, storageRemove } = fakeDb({
      kycFiles: [{ name: "1700_front.jpg" }],
    });
    const r = await deleteAccount(db, USER);
    expect(r).toEqual({ ok: true });

    // Pièces d'identité supprimées du bucket privé.
    expect(storageRemove).toHaveBeenCalledWith([`${USER}/1700_front.jpg`]);

    // Le profil garde sa ligne (intégrité des commandes), sans donnée personnelle.
    const profileWrite = writes.find((w) => w.table === "profiles" && w.method === "update");
    expect(profileWrite?.args[0]).toMatchObject({
      email: anonymizedEmail(USER),
      display_name: null,
      first_name: null,
      last_name: null,
      phone: null,
      city: null,
    });

    // Le numéro mobile money et la fiche publique disparaissent.
    const providerWrite = writes.find((w) => w.table === "provider_profiles");
    expect(providerWrite?.args[0]).toMatchObject({ payout_msisdn: null, bio: null, headline: null });

    // Les prestations sortent de la vitrine.
    expect(writes.find((w) => w.table === "services")?.args[0]).toEqual({ status: "removed" });

    // Plus de connexion possible.
    expect(authUpdate).toHaveBeenCalledWith(USER, {
      email: anonymizedEmail(USER),
      ban_duration: "876000h",
    });
  });

  it("signale l'échec sans révéler la cause à l'utilisateur", async () => {
    const db = {
      from: () => {
        const chain: Record<string, unknown> = {};
        for (const m of ["select", "or", "in", "limit"]) chain[m] = () => chain;
        chain.then = (resolve: (v: unknown) => void) => resolve({ data: null, error: { message: "boom" } });
        return chain;
      },
    } as unknown as SupabaseClient;
    expect(await deleteAccount(db, USER)).toEqual({ ok: false, reason: "failed" });
  });
});
