import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";

export type NavBadge = { count: number; attention: boolean };

/** Une seule lecture par requête : la navigation et l'accueil partagent les mêmes chiffres. */
export type AdminCounts = {
  newUsers7d: number;
  pendingKyc: number;
  draftServices: number;
  openDisputes: number;
  staleDisputes: number;
  overdueOrders: number;
  queuedPayouts: number;
  failedPayouts: number;
  /** Demandes de contact ouvertes, sans réponse de l'équipe. */
  awaitingSupport: number;
};

const HOUR_MS = 60 * 60 * 1000;

export const getAdminCounts = cache(async (): Promise<AdminCounts> => {
  const db = createAdminClient();
  const head = { count: "exact" as const, head: true };
  const now = Date.now();
  const since7d = new Date(now - 7 * 24 * HOUR_MS).toISOString();
  const since48h = new Date(now - 48 * HOUR_MS).toISOString();
  const nowIso = new Date(now).toISOString();

  const [newUsers, pendingKyc, draftServices, openDisputes, staleDisputes, overdueOrders, queuedPayouts, failedPayouts, awaitingSupport] =
    await Promise.all([
      db.from("profiles").select("id", head).gte("created_at", since7d),
      db.from("verifications").select("id", head).eq("status", "pending"),
      db.from("services").select("id", head).eq("status", "draft"),
      db.from("disputes").select("id", head).eq("status", "open"),
      db.from("disputes").select("id", head).eq("status", "open").lt("created_at", since48h),
      db.from("orders").select("id", head).in("status", ["funded", "in_progress"]).lt("due_at", nowIso),
      db.from("payouts").select("id", head).in("status", ["queued", "processing"]),
      db.from("payouts").select("id", head).eq("status", "failed"),
      db.from("support_requests").select("id", head).eq("status", "open").is("replied_at", null),
    ]);

  return {
    newUsers7d: newUsers.count ?? 0,
    pendingKyc: pendingKyc.count ?? 0,
    draftServices: draftServices.count ?? 0,
    openDisputes: openDisputes.count ?? 0,
    staleDisputes: staleDisputes.count ?? 0,
    overdueOrders: overdueOrders.count ?? 0,
    queuedPayouts: queuedPayouts.count ?? 0,
    failedPayouts: failedPayouts.count ?? 0,
    awaitingSupport: awaitingSupport.count ?? 0,
  };
});

/** Badges de la navigation : « attention » (rouge) pour ce qui demande une action. */
export async function getAdminNavCounts(): Promise<Record<string, NavBadge>> {
  const c = await getAdminCounts();
  return {
    "/admin/users": { count: c.newUsers7d, attention: false },
    "/admin/verifications": { count: c.pendingKyc, attention: true },
    "/admin/services": { count: c.draftServices, attention: true },
    "/admin/disputes": { count: c.openDisputes, attention: true },
    "/admin/orders": { count: c.overdueOrders, attention: true },
    "/admin/payouts": { count: c.queuedPayouts + c.failedPayouts, attention: true },
    "/admin/support": { count: c.awaitingSupport, attention: true },
  };
}
