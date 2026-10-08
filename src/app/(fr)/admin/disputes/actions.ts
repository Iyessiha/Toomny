"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertTransition, type OrderStatus } from "@/lib/escrow";
import { UUID_RE } from "@/lib/orders";
import { recordCompletion } from "@/lib/order-ledger";

const OPEN_STATUSES = ["open", "awaiting_provider", "awaiting_client"];

/**
 * Trancher un litige : en faveur du client (commande remboursée) ou du prestataire
 * (commande validée). Met à jour les statuts seulement ; l'argent est déplacé chez
 * le partenaire agréé, et le journal n'enregistre pas de remboursement ici.
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
    .select("id, status, provider_id")
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

  revalidatePath("/admin/disputes");
  revalidatePath(`/orders/${order.id}`);
}
