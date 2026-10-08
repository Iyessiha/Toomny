import { createClient } from "@/lib/supabase/server";
import { isProvider, type CurrentUser } from "@/lib/auth";

/**
 * Chiffres du tableau de bord.
 *
 * Toutes les requêtes passent par la session de l'utilisateur : RLS garantit
 * qu'il ne voit que ses propres commandes, quoi qu'on écrive ici.
 */

export type OrderRow = {
  id: string;
  reference: string;
  status: string;
  amount_minor: number;
  provider_net_minor: number;
  currency: string;
  created_at: string;
  client_id: string;
  provider_id: string;
};

export type DashboardData = {
  orders: OrderRow[];
  servicesCount: number;
  earnedMinor: bigint;
  spentMinor: bigint;
  pendingMinor: bigint;
  currency: string;
};

const HELD = ["funded", "in_progress", "delivered", "disputed"];

export async function getDashboardData(user: CurrentUser): Promise<DashboardData> {
  const supabase = await createClient();

  const [{ data: orders }, { count: servicesCount }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, reference, status, amount_minor, provider_net_minor, currency, created_at, client_id, provider_id")
      .order("created_at", { ascending: false })
      .limit(50),
    isProvider(user.role)
      ? supabase.from("services").select("id", { count: "exact", head: true }).eq("provider_id", user.id)
      : Promise.resolve({ count: 0 }),
  ]);

  const rows = (orders ?? []) as OrderRow[];

  let earned = 0n;
  let spent = 0n;
  let pending = 0n;

  for (const o of rows) {
    const isMine = o.provider_id === user.id;
    if (isMine && o.status === "completed") earned += BigInt(o.provider_net_minor);
    if (isMine && HELD.includes(o.status)) pending += BigInt(o.provider_net_minor);
    if (
      o.client_id === user.id &&
      o.status !== "pending_payment" &&
      o.status !== "cancelled" &&
      o.status !== "refunded"
    ) {
      spent += BigInt(o.amount_minor);
    }
  }

  return {
    orders: rows,
    servicesCount: servicesCount ?? 0,
    earnedMinor: earned,
    spentMinor: spent,
    pendingMinor: pending,
    currency: rows[0]?.currency ?? "XOF",
  };
}

export function statusTone(status: string): string {
  if (status === "completed") return "bg-[var(--color-brand-50)] text-[var(--color-brand-700)]";
  if (status === "disputed") return "bg-red-50 text-red-700";
  if (status === "cancelled" || status === "refunded") return "bg-neutral-100 text-neutral-600";
  return "bg-amber-50 text-amber-700";
}
