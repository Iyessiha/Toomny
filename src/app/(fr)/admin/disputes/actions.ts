"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/notifications";
import { assertTransition, type OrderStatus } from "@/lib/escrow";
import { UUID_RE } from "@/lib/orders";
import { recordCompletion, recordRefund } from "@/lib/order-ledger";
import { recordAdminAction } from "@/lib/admin-audit";

const OPEN_STATUSES = ["open", "awaiting_provider", "awaiting_client"];

/**
 * Trancher un litige : en faveur du client (commande remboursée, écriture
 * `refund` au journal) ou du prestataire (commande validée). L'argent est
 * déplacé chez le partenaire agréé ; le journal reflète la décision.
 */
export async function resolveDispute(formData: FormData): Promise<void> {
  const admin = await requireAdmin();

  const disputeId = String(formData.get("disputeId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!UUID_RE.test(disputeId) || (decision !== "client" && decision !== "provider")) return;

  const db = createAdminClient();
  const { data: dispute } = await db
    .from("disputes")
    .select("id, status, order_id")
    .eq("id", disputeId)
    .maybeSingle();
  if (!dispute || !OPEN_STATUSES.includes(dispute.status)) return;

  const { data: order } = await db
    .from("orders")
    .select("id, status, reference, client_id, provider_id, amount_minor, currency")
    .eq("id", dispute.order_id)
    .maybeSingle();
  if (!order || order.status !== "disputed") return;

  const target: OrderStatus = decision === "client" ? "refunded" : "completed";
  try {
    assertTransition("disputed", target);
  } catch {
    return;
  }

  const now = new Date().toISOString();
  const { data: updated, error } = await db
    .from("disputes")
    .update({
      status: decision === "client" ? "resolved_client" : "resolved_provider",
      resolved_by: admin.id,
      resolved_at: now,
    })
    .eq("id", dispute.id)
    .in("status", OPEN_STATUSES)
    .select("id")
    .maybeSingle();
  if (error || !updated) return;

  const { error: orderErr } = await db
    .from("orders")
    .update({
      status: target,
      updated_at: now,
      ...(target === "completed" ? { completed_at: now } : {}),
    })
    .eq("id", order.id)
    .eq("status", "disputed");
  if (orderErr) {
    console.error("resolveDispute order:", orderErr.message);
    return;
  }

  if (target === "completed") await recordCompletion(db, order.id, order.provider_id);
  if (target === "refunded") {
    await recordRefund(db, {
      orderId: order.id,
      profileId: order.client_id,
      amountMinor: order.amount_minor,
      currency: order.currency,
    });
  }

  await recordAdminAction(db, {
    actorId: admin.id,
    action: "dispute.resolve",
    targetType: "dispute",
    targetId: dispute.id,
    details: { decision, orderId: order.id, orderStatus: target },
  });

  const clientWon = decision === "client";
  await notify(db, {
    recipientId: order.client_id,
    type: "dispute_resolved",
    params: { ref: order.reference, outcome: clientWon ? "won" : "lost" },
    link: "/disputes",
  });
  await notify(db, {
    recipientId: order.provider_id,
    type: "dispute_resolved",
    params: { ref: order.reference, outcome: clientWon ? "lost" : "won" },
    link: "/disputes",
  });

  revalidatePath("/admin/disputes");
  revalidatePath(`/orders/${order.id}`);
}
