import type { SupabaseClient } from "@supabase/supabase-js";
import { recordFunding } from "@/lib/order-ledger";
import { notify } from "@/lib/notifications";
import { fundedDueAt } from "@/lib/order-deadline";

/**
 * Marque le hold `held` puis finance la commande si elle attend encore son paiement.
 * Partagé par le webhook GeniusPay et la vérification demandée par le client, pour
 * que les deux chemins appliquent exactement la même règle.
 * Retourne `true` seulement si cet appel a effectivement financé la commande.
 */
export async function fundOrderFromHold(
  db: SupabaseClient,
  hold: { id: string; order_id: string },
  nowIso: string,
): Promise<boolean> {
  await db.from("escrow_holds").update({ status: "held", held_at: nowIso }).eq("id", hold.id);

  const { data: order } = await db
    .from("orders")
    .select("id, status, reference, client_id, provider_id, amount_minor, currency, created_at, due_at")
    .eq("id", hold.order_id)
    .maybeSingle();

  if (order?.status !== "pending_payment") {
    console.warn("[payments] commande pas en pending_payment:", hold.order_id, order?.status);
    return false;
  }

  // La condition sur le statut garantit qu'un seul des deux chemins finance la commande.
  const { data: funded } = await db
    .from("orders")
    .update({ status: "funded", due_at: fundedDueAt(order, new Date(nowIso)) })
    .eq("id", order.id)
    .eq("status", "pending_payment")
    .select("id")
    .maybeSingle();
  if (!funded) return false;

  await recordFunding(db, order);

  await notify(db, {
    recipientId: order.provider_id,
    type: "order_funded",
    params: { ref: order.reference },
    link: `/orders/${order.id}`,
  });

  console.info("[payments] commande financée:", order.id);
  return true;
}
