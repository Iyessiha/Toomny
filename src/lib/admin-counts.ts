import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type NavBadge = { count: number; attention: boolean };

/**
 * Compteurs affichés à côté des rubriques admin.
 * attention = à traiter (rouge) ; sinon simple information (bleu).
 */
export async function getAdminNavCounts(): Promise<Record<string, NavBadge>> {
  const db = createAdminClient();
  const head = { count: "exact" as const, head: true };
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [newUsers, pendingKyc, draftServices, openDisputes] = await Promise.all([
    db.from("profiles").select("id", head).gte("created_at", since),
    db.from("verifications").select("id", head).eq("status", "pending"),
    db.from("services").select("id", head).eq("status", "draft"),
    db.from("disputes").select("id", head).eq("status", "open"),
  ]);

  return {
    "/admin/users": { count: newUsers.count ?? 0, attention: false },
    "/admin/verifications": { count: pendingKyc.count ?? 0, attention: true },
    "/admin/services": { count: draftServices.count ?? 0, attention: true },
    "/admin/disputes": { count: openDisputes.count ?? 0, attention: true },
  };
}
