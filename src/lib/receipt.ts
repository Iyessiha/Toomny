import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveDisplayNames } from "@/lib/names";

/** Données d'un reçu de paiement, lues côté serveur et prêtes à être rendues. */
export type Receipt = {
  orderId: string;
  reference: string;
  currency: string;
  serviceTitle: string;
  providerName: string;
  clientName: string;
  priceMinor: bigint;
  feeMinor: bigint;
  totalMinor: bigint;
  dueAt: Date | null;
  paidAt: Date;
  paymentRef: string | null;
  /** Brief du client, tel qu'il l'a rédigé à la commande. */
  requirements: string | null;
  /** Montant net revenant au prestataire (après commission). */
  providerNetMinor: bigint;
};

/**
 * Charge le reçu d'une commande dont le paiement est retenu (hold `held`).
 * Retourne null si la commande n'existe pas ou si rien n'est encore payé.
 * Le total se lit depuis `client_charge_minor` (prix + frais de paiement), comme
 * dans l'initiation du paiement ; les anciennes commandes sans ce champ sont recalculées.
 */
export async function loadReceipt(db: SupabaseClient, orderId: string): Promise<Receipt | null> {
  const { data: order } = await db
    .from("orders")
    .select("id, reference, currency, amount_minor, collect_fee_minor, client_charge_minor, provider_net_minor, requirements, due_at, client_id, provider_id, service:services(title)")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return null;

  const { data: hold } = await db
    .from("escrow_holds")
    .select("partner_hold_ref, held_at")
    .eq("order_id", orderId)
    .eq("status", "held")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!hold?.held_at) return null;

  const priceMinor = BigInt(order.amount_minor);
  const totalMinor = order.client_charge_minor != null
    ? BigInt(order.client_charge_minor)
    : priceMinor + BigInt(order.collect_fee_minor ?? 0);
  const feeMinor = order.collect_fee_minor != null ? BigInt(order.collect_fee_minor) : totalMinor - priceMinor;

  const names = await resolveDisplayNames([order.client_id, order.provider_id]);
  const service = order.service as unknown as { title: string } | null;

  return {
    orderId: order.id,
    reference: order.reference,
    currency: order.currency,
    serviceTitle: service?.title ?? "",
    providerName: names.get(order.provider_id)?.short ?? "—",
    clientName: names.get(order.client_id)?.name ?? "—",
    priceMinor,
    feeMinor,
    totalMinor,
    dueAt: order.due_at ? new Date(order.due_at) : null,
    paidAt: new Date(hold.held_at),
    paymentRef: hold.partner_hold_ref ?? null,
    requirements: order.requirements ?? null,
    providerNetMinor: BigInt(order.provider_net_minor ?? 0),
  };
}
