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

  // Liste récente (affichage) et totaux (sans limite) sont deux lectures distinctes :
  // les totaux ne doivent pas s'arrêter aux 50 dernières commandes.
  const [{ data: orders }, { count: servicesCount }, { data: earnedRows }, { data: spentRows }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, reference, status, amount_minor, provider_net_minor, currency, created_at, client_id, provider_id")
      .or(`client_id.eq.${user.id},provider_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(50),
    isProvider(user.role)
      ? supabase
          .from("services")
          .select("id", { count: "exact", head: true })
          .eq("provider_id", user.id)
          .eq("status", "active")
      : Promise.resolve({ count: 0 }),
    isProvider(user.role)
      ? supabase
          .from("orders")
          .select("status, provider_net_minor")
          .eq("provider_id", user.id)
          .in("status", ["completed", ...HELD])
      : Promise.resolve({ data: [] as { status: string; provider_net_minor: number | string }[] }),
    supabase
      .from("orders")
      .select("amount_minor")
      .eq("client_id", user.id)
      .not("status", "in", "(pending_payment,cancelled,refunded)"),
  ]);

  const rows = (orders ?? []) as OrderRow[];

  let earned = 0n;
  let pending = 0n;
  for (const o of earnedRows ?? []) {
    if (o.status === "completed") earned += BigInt(o.provider_net_minor);
    else pending += BigInt(o.provider_net_minor);
  }
  let spent = 0n;
  for (const o of spentRows ?? []) spent += BigInt(o.amount_minor);

  return {
    orders: rows,
    servicesCount: servicesCount ?? 0,
    earnedMinor: earned,
    spentMinor: spent,
    pendingMinor: pending,
    currency: rows[0]?.currency ?? "XOF",
  };
}

export const ORDER_STATUS_FR: Record<string, string> = {
  pending_payment: "En attente de paiement",
  in_progress: "En cours",
  delivered: "Livré",
  revision_requested: "Révision demandée",
  completed: "Terminé",
  cancelled: "Annulé",
  refunded: "Remboursé",
  funded: "Paiement reçu",
  disputed: "En litige",
};

export function statusTone(status: string): string {
  if (status === "completed") return "bg-[var(--color-brand-50)] text-[var(--color-brand-700)]";
  if (status === "disputed") return "bg-red-50 text-red-700";
  if (status === "cancelled" || status === "refunded") return "bg-neutral-100 text-neutral-600";
  return "bg-amber-50 text-amber-700";
}
