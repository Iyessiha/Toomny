import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCronAuthorized } from "@/lib/cron-auth";
import { notify } from "@/lib/notifications";
import { paymentExpiryCutoff } from "@/lib/order-reminders";
import { confirmOrderPayment } from "@/lib/payments/confirm-order-payment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BATCH = 200;

/**
 * Annule les commandes restées sans paiement plus de 72 h.
 *
 * Avant d'annuler, on interroge GeniusPay : si le paiement vient d'être confirmé, la
 * commande est financée à la place (on ne retient jamais des fonds sur une commande annulée,
 * puisque Toomny ne peut pas encore rembourser). Un paiement encore en cours est laissé
 * tranquille et réexaminé au passage suivant.
 */
export async function GET(request: Request): Promise<Response> {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const db = createAdminClient();
  const { data: orders, error } = await db
    .from("orders")
    .select("id, reference, client_id, provider_id")
    .eq("status", "pending_payment")
    .lt("created_at", paymentExpiryCutoff())
    .limit(BATCH);
  if (error) {
    console.error("order-auto-cancel select:", error.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  let cancelled = 0;
  let kept = 0;
  for (const order of orders ?? []) {
    let check;
    try {
      check = await confirmOrderPayment(order.id, order.client_id);
    } catch (err) {
      console.error("order-auto-cancel check:", order.id, (err as Error).message);
      kept += 1;
      continue;
    }
    // Paiement confirmé à l'instant, ou encore en cours chez GeniusPay : on ne touche pas à la commande.
    if (check === "funded" || check === "pending") {
      kept += 1;
      continue;
    }

    // Conditionnel sur le statut : si la commande a bougé entre-temps, on ne l'annule pas.
    const { data: cancelledRow, error: updateError } = await db
      .from("orders")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", order.id)
      .eq("status", "pending_payment")
      .select("id")
      .maybeSingle();
    if (updateError || !cancelledRow) {
      if (updateError) console.error("order-auto-cancel update:", updateError.message);
      kept += 1;
      continue;
    }

    await db
      .from("escrow_holds")
      .update({ status: "failed", failure_reason: "Commande annulée : paiement non reçu sous 72 h" })
      .eq("order_id", order.id)
      .eq("status", "requested");

    const params = { ref: order.reference };
    await notify(db, { recipientId: order.client_id, type: "order_cancelled", params, link: `/orders/${order.id}` });
    await notify(db, { recipientId: order.provider_id, type: "order_cancelled", params, link: `/orders/${order.id}` });
    cancelled += 1;
  }

  return NextResponse.json({ ok: true, cancelled, kept });
}
