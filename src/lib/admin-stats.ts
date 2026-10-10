import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Chiffres de l'administration.
 *
 * Passe par la clé de service, donc contourne RLS : à n'appeler qu'après
 * `requireAdmin()`. Les compteurs utilisent `head: true` (total seul) et les
 * montants sont agrégés en base par `admin_money_totals()`.
 */

export type DailyPoint = { day: string; orders_count: number; amount_minor: bigint };
export type CountryRow = { country_code: string; total: number; providers: number };

export type AdminStats = {
  users: number;
  providers: number;
  services: number;
  activeServices: number;
  draftServices: number;
  orders: number;
  completedOrders: number;
  openDisputes: number;
  pendingVerifications: number;
  gmvMinor: bigint;
  commissionMinor: bigint;
  currency: string;
  recentUsers: { id: string; display_name: string | null; email: string; role: string; country_code: string; created_at: string }[];
  recentOrders: { id: string; reference: string; status: string; amount_minor: number; currency: string; created_at: string }[];
  dailyOrders: DailyPoint[];
  countryBreakdown: CountryRow[];
};

export async function getAdminStats(): Promise<AdminStats> {
  const db = createAdminClient();

  const head = { count: "exact" as const, head: true };

  const [users, providers, services, activeServices, draftServices, orders, completed, disputes, verifications] =
    await Promise.all([
      db.from("profiles").select("id", head),
      db.from("profiles").select("id", head).in("role", ["provider", "both"]),
      db.from("services").select("id", head),
      db.from("services").select("id", head).eq("status", "active"),
      db.from("services").select("id", head).eq("status", "draft"),
      db.from("orders").select("id", head),
      db.from("orders").select("id", head).eq("status", "completed"),
      db.from("disputes").select("id", head).eq("status", "open"),
      db.from("verifications").select("id", head).eq("status", "pending"),
    ]);

  const [{ data: totals }, { data: recentUsers }, { data: recentOrders }, { data: dailyRaw }, { data: countryRaw }] = await Promise.all([
    db.rpc("admin_money_totals"),
    db.from("profiles").select("id, display_name, email, role, country_code, created_at").order("created_at", { ascending: false }).limit(8),
    db.from("orders").select("id, reference, status, amount_minor, currency, created_at").order("created_at", { ascending: false }).limit(8),
    db.rpc("admin_daily_orders", { days: 30 }),
    db.rpc("admin_country_breakdown"),
  ]);

  // Phase 1 : XOF uniquement. Les devises ne se somment pas sans conversion.
  const primary = (totals ?? []).find((t: { currency: string }) => t.currency === "XOF") ?? totals?.[0];
  const gmv = BigInt(primary?.gmv_minor ?? 0);
  const commission = BigInt(primary?.commission_minor ?? 0);

  const dailyOrders: DailyPoint[] = (dailyRaw ?? []).map((r: { day: string; orders_count: string | number; amount_minor: string | number }) => ({
    day: String(r.day),
    orders_count: Number(r.orders_count),
    amount_minor: BigInt(r.amount_minor),
  }));

  const countryBreakdown: CountryRow[] = (countryRaw ?? []).map((r: { country_code: string; total: string | number; providers: string | number }) => ({
    country_code: r.country_code,
    total: Number(r.total),
    providers: Number(r.providers),
  }));

  return {
    users: users.count ?? 0,
    providers: providers.count ?? 0,
    services: services.count ?? 0,
    activeServices: activeServices.count ?? 0,
    draftServices: draftServices.count ?? 0,
    orders: orders.count ?? 0,
    completedOrders: completed.count ?? 0,
    openDisputes: disputes.count ?? 0,
    pendingVerifications: verifications.count ?? 0,
    gmvMinor: gmv,
    commissionMinor: commission,
    currency: primary?.currency ?? "XOF",
    recentUsers: (recentUsers ?? []) as AdminStats["recentUsers"],
    recentOrders: (recentOrders ?? []) as AdminStats["recentOrders"],
    dailyOrders,
    countryBreakdown,
  };
}
