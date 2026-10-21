import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminCounts, type AdminCounts } from "@/lib/admin-counts";

/**
 * Chiffres de l'administration.
 *
 * Passe par la clé de service, donc contourne RLS : à n'appeler qu'après
 * `requireAdmin()`. Les compteurs utilisent `head: true` (total seul).
 */

/** Commandes dont le paiement a été reçu (fonds retenus ou plus loin). */
const PAID_STATUSES = ["funded", "in_progress", "delivered", "completed", "disputed"];
/** Commandes encore en séquestre : la commission n'est pas acquise. */
const ESCROW_STATUSES = ["funded", "in_progress", "delivered", "disputed"];

export type DailyPoint = { day: string; orders_count: number; amount_minor: bigint };
export type CountryRow = { country_code: string; total: number; providers: number };

export type AdminStats = {
  users: number;
  providers: number;
  services: number;
  activeServices: number;
  orders: number;
  paidOrders: number;
  completedOrders: number;
  /** Part des commandes payées qui sont terminées, en %. null si aucune commande payée. */
  completionPct: number | null;
  gmvMinor: bigint;
  commissionCollectedMinor: bigint;
  commissionPendingMinor: bigint;
  currency: string;
  /** Variation sur 7 jours : commandes et volume, comparés aux 7 jours précédents. */
  trend: { ordersLast7: number; ordersPrev7: number; amountLast7: bigint; amountPrev7: bigint };
  recentUsers: { id: string; display_name: string | null; email: string; role: string; country_code: string; created_at: string }[];
  recentOrders: { id: string; reference: string; status: string; amount_minor: number; currency: string; created_at: string }[];
  dailyOrders: DailyPoint[];
  countryBreakdown: CountryRow[];
  counts: AdminCounts;
};

function sumLast(points: DailyPoint[], from: number, to: number) {
  const slice = points.slice(from, to);
  return {
    orders: slice.reduce((acc, p) => acc + p.orders_count, 0),
    amount: slice.reduce((acc, p) => acc + p.amount_minor, BigInt(0)),
  };
}

export async function getAdminStats(): Promise<AdminStats> {
  const db = createAdminClient();
  const head = { count: "exact" as const, head: true };

  const [counts, users, providers, services, activeServices, orders, completed, paid, paidRows, recentUsers, recentOrders, dailyRaw, countryRaw] =
    await Promise.all([
      getAdminCounts(),
      db.from("profiles").select("id", head),
      db.from("profiles").select("id", head).in("role", ["provider", "both"]),
      db.from("services").select("id", head),
      db.from("services").select("id", head).eq("status", "active"),
      db.from("orders").select("id", head),
      db.from("orders").select("id", head).eq("status", "completed"),
      db.from("orders").select("id", head).in("status", PAID_STATUSES),
      db.from("orders").select("status, amount_minor, commission_minor, currency").in("status", PAID_STATUSES),
      db.from("profiles").select("id, display_name, email, role, country_code, created_at").order("created_at", { ascending: false }).limit(8),
      db.from("orders").select("id, reference, status, amount_minor, currency, created_at").order("created_at", { ascending: false }).limit(8),
      db.rpc("admin_daily_orders", { days: 30 }),
      db.rpc("admin_country_breakdown"),
    ]);

  // Phase 1 : XOF uniquement. Les devises ne se somment pas sans conversion.
  const currency = "XOF";
  let gmv = BigInt(0);
  let collected = BigInt(0);
  let pending = BigInt(0);
  for (const row of paidRows.data ?? []) {
    if (row.currency !== currency) continue;
    const amount = BigInt(row.amount_minor);
    const commission = BigInt(row.commission_minor);
    gmv += amount;
    if (ESCROW_STATUSES.includes(row.status)) pending += commission;
    else collected += commission;
  }

  const dailyOrders: DailyPoint[] = (dailyRaw.data ?? []).map((r: { day: string; orders_count: string | number; amount_minor: string | number }) => ({
    day: String(r.day),
    orders_count: Number(r.orders_count),
    amount_minor: BigInt(r.amount_minor),
  }));
  const last7 = sumLast(dailyOrders, Math.max(dailyOrders.length - 7, 0), dailyOrders.length);
  const prev7 = sumLast(dailyOrders, Math.max(dailyOrders.length - 14, 0), Math.max(dailyOrders.length - 7, 0));

  const countryBreakdown: CountryRow[] = (countryRaw.data ?? []).map((r: { country_code: string; total: string | number; providers: string | number }) => ({
    country_code: r.country_code,
    total: Number(r.total),
    providers: Number(r.providers),
  }));

  const paidCount = paid.count ?? 0;
  const completedCount = completed.count ?? 0;

  return {
    users: users.count ?? 0,
    providers: providers.count ?? 0,
    services: services.count ?? 0,
    activeServices: activeServices.count ?? 0,
    orders: orders.count ?? 0,
    paidOrders: paidCount,
    completedOrders: completedCount,
    completionPct: paidCount > 0 ? Math.round((completedCount / paidCount) * 100) : null,
    gmvMinor: gmv,
    commissionCollectedMinor: collected,
    commissionPendingMinor: pending,
    currency,
    trend: { ordersLast7: last7.orders, ordersPrev7: prev7.orders, amountLast7: last7.amount, amountPrev7: prev7.amount },
    recentUsers: (recentUsers.data ?? []) as AdminStats["recentUsers"],
    recentOrders: (recentOrders.data ?? []) as AdminStats["recentOrders"],
    dailyOrders,
    countryBreakdown,
    counts,
  };
}
