import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { paymentProvider } from "@/lib/payments/geniuspay";
import { fundOrderFromHold } from "@/lib/payments/fund-hold";

/**
 * - funded : GeniusPay confirme le paiement, la commande vient d'être financée
 * - pending : paiement non confirmé (en attente chez GeniusPay ou non encore débité)
 * - failed : paiement refusé, expiré ou annulé
 * - not_applicable : rien à vérifier (commande déjà payée, pas la sienne, pas de paiement en cours)
 */
export type PaymentCheck = "funded" | "pending" | "failed" | "not_applicable";

/**
 * Interroge GeniusPay pour la commande d'un client et la finance si le paiement est confirmé.
 * Sert de filet quand le webhook n'est pas arrivé (délai, URL mal configurée).
 */
export async function confirmOrderPayment(orderId: string, clientId: string): Promise<PaymentCheck> {
  const db = createAdminClient();

  const { data: order } = await db
    .from("orders")
    .select("id, status, client_id")
    .eq("id", orderId)
    .maybeSingle();
  if (!order || order.client_id !== clientId || order.status !== "pending_payment") {
    return "not_applicable";
  }

  const { data: hold } = await db
    .from("escrow_holds")
    .select("id, order_id, partner_hold_ref")
    .eq("order_id", orderId)
    .eq("partner", "geniuspay")
    .eq("status", "requested")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!hold?.partner_hold_ref) return "not_applicable";

  const payment = await paymentProvider.getPayment(hold.partner_hold_ref);
  if (payment.status === "completed") {
    await fundOrderFromHold(db, hold, new Date().toISOString());
    return "funded";
  }
  if (payment.status === "failed" || payment.status === "expired" || payment.status === "cancelled") {
    return "failed";
  }
  return "pending";
}
