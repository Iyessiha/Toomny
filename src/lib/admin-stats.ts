import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Chiffres de l'administration.
 *
 * Passe par la clé de service, donc contourne RLS : à n'appeler qu'après
 * `requireAdmin()`. Les compteurs utilisent `head: true`, qui ne ramène que le
 * total sans transférer les lignes.
 */

/** Commandes dont les fonds ont été retenus : seules elles comptent comme volume. */
const FUNDED_STATUSES = ["funded", "in_progress", "delivered", "completed", "disputed"];

export type AdminStats = {
  users: number;
  providers: number;
  services: number;
  activeServices: number;
  orders: number;
  completedOrders: number;
  openDisputes: number;
  pendingVerifications: number;
  gmvMinor: bigint;
  commissionMinor: bigint;
  currency: string;
  recentUsers: { id: string; display_name: string | null; email: string; role: string; country_code: string; created_at: string }[];
  recentOrders: { id: string; reference: string; status: string; amount_minor: number; currency: string; created_at: string }[];
};

export async function getAdminStats(): Promise<AdminStats> {
  const db = createAdminClient();

  const head = { count: "exact" as const, head: true };

  const [users, providers, services, activeServices, orders, completed, disputes, verifications] =
    await Promise.all([
      db.from("profiles").select("id", head),
      db.from("profiles").select("id", head).in("role", ["provider", "both"]),
      db.from("services").select("id", head),
      db.from("services").select("id", head).eq("status", "active"),
      db.from("orders").select("id", head),
      db.from("orders").select("id", head).eq("status", "completed"),
      db.from("disputes").select("id", head).eq("status", "open"),
      db.from("verifications").select("id", head).eq("status", "pending"),
    ]);

  const [{ data: moneyRows }, { data: recentUsers }, { data: recentOrders }] = await Promise.all([
    db
      .from("orders")
      .select("amount_minor, commission_minor, currency")
      .in("status", FUNDED_STATUSES),
    db.from("profiles").select("id, display_name, email, role, country_code, created_at").order("created_at", { ascending: false }).limit(8),
    db.from("orders").select("id, reference, status, amount_minor, currency, created_at").order("created_at", { ascending: false }).limit(8),
  ]);

  let gmv = 0n;
  let commission = 0n;
  for (const r of moneyRows ?? []) {
    gmv += BigInt(r.amount_minor);
    commission += BigInt(r.commission_minor);
  }

  return {
    users: users.count ?? 0,
    providers: providers.count ?? 0,
    services: services.count ?? 0,
    activeServices: activeServices.count ?? 0,
    orders: orders.count ?? 0,
    completedOrders: completed.count ?? 0,
    openDisputes: disputes.count ?? 0,
    pendingVerifications: verifications.count ?? 0,
    gmvMinor: gmv,
    commissionMinor: commission,
    currency: moneyRows?.[0]?.currency ?? "XOF",
    recentUsers: (recentUsers ?? []) as AdminStats["recentUsers"],
    recentOrders: (recentOrders ?? []) as AdminStats["recentOrders"],
  };
}
