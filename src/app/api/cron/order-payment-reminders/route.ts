import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCronAuthorized } from "@/lib/cron-auth";
import { notify } from "@/lib/notifications";
import { paymentReminderCutoff } from "@/lib/order-reminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BATCH = 200;

/**
 * Rappel unique, dans l'application seulement (pas d'e-mail, pour le quota) aux
 * clients dont la commande attend le paiement depuis plus de 24 h.
 */
export async function GET(request: Request): Promise<Response> {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const db = createAdminClient();
  const { data: orders, error } = await db
    .from("orders")
    .select("id, reference, client_id")
    .eq("status", "pending_payment")
    .is("payment_reminded_at", null)
    .lt("created_at", paymentReminderCutoff())
    .limit(BATCH);
  if (error) {
    console.error("order-payment-reminders select:", error.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  let sent = 0;
  for (const order of orders ?? []) {
    await notify(db, {
      recipientId: order.client_id,
      type: "order_payment_reminder",
      params: { ref: order.reference },
      link: `/orders/${order.id}`,
      sendEmail: false,
    });
    const { error: updateError } = await db
      .from("orders")
      .update({ payment_reminded_at: new Date().toISOString() })
      .eq("id", order.id);
    if (updateError) console.error("order-payment-reminders update:", updateError.message);
    sent += 1;
  }
  return NextResponse.json({ ok: true, sent });
}
