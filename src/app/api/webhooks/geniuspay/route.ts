import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { paymentProvider } from "@/lib/payments/geniuspay";
import { recordFunding } from "@/lib/order-ledger";
import { notify } from "@/lib/notifications";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const rawBody = await request.text();
  const signature = request.headers.get("x-geniuspay-signature");
  const timestamp = request.headers.get("x-geniuspay-timestamp") ?? undefined;

  let event;
  try {
    event = paymentProvider.parseWebhook(rawBody, signature, timestamp);
  } catch (err) {
    console.error("[webhook:geniuspay] rejeté:", (err as Error).message);
    return NextResponse.json({ ok: false, error: "signature invalide" }, { status: 400 });
  }

  if (event.type === "hold.held" && event.partnerHoldRef) {
    const db = createAdminClient();
    const now = new Date().toISOString();

    const { data: hold } = await db
      .from("escrow_holds")
      .select("id, order_id, status")
      .eq("partner", "geniuspay")
      .eq("partner_hold_ref", event.partnerHoldRef)
      .maybeSingle();

    if (!hold) {
      console.error("[webhook:geniuspay] rétention introuvable:", event.partnerHoldRef);
      return NextResponse.json({ ok: true });
    }

    if (hold.status === "held") {
      return NextResponse.json({ ok: true });
    }

    await db
      .from("escrow_holds")
      .update({ status: "held", held_at: now })
      .eq("id", hold.id);

    const { data: order } = await db
      .from("orders")
      .select("id, status, reference, client_id, provider_id, amount_minor, currency")
      .eq("id", hold.order_id)
      .maybeSingle();

    if (order?.status === "pending_payment") {
      await db
        .from("orders")
        .update({ status: "funded" })
        .eq("id", order.id)
        .eq("status", "pending_payment");

      await recordFunding(db, order);

      await notify(db, {
        recipientId: order.provider_id,
        type: "order_funded",
        params: { ref: order.reference },
        link: `/orders/${order.id}`,
      });

      console.info("[webhook:geniuspay] commande financée:", order.id);
    } else {
      console.warn("[webhook:geniuspay] commande pas en pending_payment:", hold.order_id, order?.status);
    }
  }

  if (event.type === "hold.failed" && event.partnerHoldRef) {
    const db = createAdminClient();
    await db
      .from("escrow_holds")
      .update({ status: "failed", failure_reason: "Paiement refusé par GeniusPay" })
      .eq("partner", "geniuspay")
      .eq("partner_hold_ref", event.partnerHoldRef);

    const { data: failedHold } = await db
      .from("escrow_holds")
      .select("order_id")
      .eq("partner", "geniuspay")
      .eq("partner_hold_ref", event.partnerHoldRef)
      .maybeSingle();
    if (failedHold) {
      const { data: failedOrder } = await db
        .from("orders")
        .select("id, reference, client_id")
        .eq("id", failedHold.order_id)
        .maybeSingle();
      if (failedOrder) {
        await notify(db, {
          recipientId: failedOrder.client_id,
          type: "order_payment_failed",
          params: { ref: failedOrder.reference },
          link: `/orders/${failedOrder.id}`,
        });
      }
    }

    console.info("[webhook:geniuspay] hold.failed:", event.partnerHoldRef);
  }

  return NextResponse.json({ ok: true });
}
