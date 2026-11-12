import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCronAuthorized } from "@/lib/cron-auth";
import { notify } from "@/lib/notifications";
import { paymentFinalReminderCutoff, paymentReminderCutoff } from "@/lib/order-reminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BATCH = 200;

/**
 * Relances de paiement, par e-mail et dans l'application :
 *  - 1re relance après 24 h d'attente ;
 *  - dernière relance après 48 h (annulation prévue à 72 h).
 * `payment_reminder_count` évite tout doublon : chaque relance est conditionnée au compteur lu.
 */
export async function GET(request: Request): Promise<Response> {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const db = createAdminClient();
  const { data: orders, error } = await db
    .from("orders")
    .select("id, reference, client_id, payment_reminder_count, created_at")
    .eq("status", "pending_payment")
    .lt("payment_reminder_count", 2)
    .lt("created_at", paymentReminderCutoff())
    .limit(BATCH);
  if (error) {
    console.error("order-payment-reminders select:", error.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const finalCutoff = paymentFinalReminderCutoff();
  let sent = 0;
  for (const order of orders ?? []) {
    const stage = order.payment_reminder_count ?? 0;
    // La dernière relance ne part qu'après 48 h, pas dès la 24e heure.
    if (stage === 1 && order.created_at > finalCutoff) continue;

    const { data: updated, error: updateError } = await db
      .from("orders")
      .update({
        payment_reminder_count: stage + 1,
        payment_reminded_at: new Date().toISOString(),
      })
      .eq("id", order.id)
      .eq("status", "pending_payment")
      .eq("payment_reminder_count", stage)
      .select("id")
      .maybeSingle();
    if (updateError) console.error("order-payment-reminders update:", updateError.message);
    if (updateError || !updated) continue;

    await notify(db, {
      recipientId: order.client_id,
      type: stage === 0 ? "order_payment_reminder" : "order_payment_reminder_final",
      params: { ref: order.reference },
      link: `/orders/${order.id}`,
    });
    sent += 1;
  }
  return NextResponse.json({ ok: true, sent });
}
