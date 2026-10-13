"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertTransition, type OrderStatus } from "@/lib/escrow";
import { UUID_RE } from "@/lib/orders";
import { recordFunding, recordCompletion } from "@/lib/order-ledger";
import { recordAdminAction } from "@/lib/admin-audit";
import { notify } from "@/lib/notifications";

/**
 * Confirmer un paiement reçu chez le partenaire agréé : pending_payment -> funded.
 * Jusqu'au webhook de paiement, c'est la seule voie vers « funded ». Ne l'utiliser
 * qu'après avoir vérifié le paiement dans le tableau de bord du partenaire.
 */
export async function confirmPaymentReceived(formData: FormData): Promise<void> {
  const admin = await requireAdmin();

  const orderId = String(formData.get("orderId") ?? "");
  if (!UUID_RE.test(orderId)) return;

  const db = createAdminClient();
  const { data: order } = await db
    .from("orders")
    .select("id, status, reference, amount_minor, currency, provider_id")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return;

  try {
    assertTransition(order.status as OrderStatus, "funded");
  } catch {
    return;
  }

  const { error } = await db
    .from("orders")
    .update({ status: "funded", updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("status", "pending_payment");

  if (error) {
    console.error("confirmPaymentReceived:", error.message);
    return;
  }
  await recordFunding(db, order);
  await notify(db, {
    recipientId: order.provider_id,
    type: "order_funded",
    params: { ref: order.reference },
    link: `/orders/${orderId}`,
  });
  await recordAdminAction(db, {
    actorId: admin.id,
    action: "order.confirm_payment",
    targetType: "order",
    targetId: orderId,
    details: { amountMinor: String(order.amount_minor), currency: order.currency },
  });
  revalidatePath("/admin/orders");
  revalidatePath(`/orders/${orderId}`);
}

/**
 * Supprime toutes les données transactionnelles de test (ordres, ledger,
 * escrow, payouts, messages liés). Utilise la fonction SQL SECURITY DEFINER
 * admin_reset_orders() qui contourne le trigger append-only du ledger.
 * Réservé aux environnements de test — à retirer avant mise en production réelle.
 */
export async function resetAllOrders(): Promise<{ error?: string; deleted?: Record<string, number> }> {
  await requireAdmin();
  const db = createAdminClient();
  const { data, error } = await db.rpc("admin_reset_orders");
  if (error) return { error: error.message };
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  return { deleted: data as Record<string, number> };
}

const ADMIN_ALLOWED_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus>> = {
  funded: "in_progress",
  in_progress: "delivered",
  delivered: "completed",
};

/**
 * Forcer manuellement une transition d'état pour une commande bloquée.
 * Uniquement les transitions admin : funded→in_progress, in_progress→delivered,
 * delivered→completed (libération des fonds équivalent 72 h).
 */
export async function forceOrderTransition(formData: FormData): Promise<void> {
  const admin = await requireAdmin();

  const orderId = String(formData.get("orderId") ?? "");
  if (!UUID_RE.test(orderId)) return;

  const db = createAdminClient();
  const { data: order } = await db
    .from("orders")
    .select("id, status, reference, client_id, provider_id, amount_minor, currency")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return;

  const targetStatus = ADMIN_ALLOWED_TRANSITIONS[order.status as OrderStatus];
  if (!targetStatus) return;

  try {
    assertTransition(order.status as OrderStatus, targetStatus);
  } catch {
    return;
  }

  const { error } = await db
    .from("orders")
    .update({ status: targetStatus, updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("status", order.status);

  if (error) {
    console.error("forceOrderTransition:", error.message);
    return;
  }

  if (targetStatus === "completed" && order.provider_id) {
    await recordCompletion(db, orderId, order.provider_id);
  }

  // Notify relevant party of the forced transition.
  if (targetStatus === "in_progress" || targetStatus === "delivered") {
    await notify(db, {
      recipientId: order.client_id,
      type: targetStatus === "delivered" ? "order_delivered" : "order_started",
      params: { ref: order.reference },
      link: `/orders/${orderId}`,
    });
  } else if (targetStatus === "completed") {
    await notify(db, {
      recipientId: order.provider_id,
      type: "order_completed",
      params: { ref: order.reference },
      link: `/orders/${orderId}`,
    });
    await notify(db, {
      recipientId: order.client_id,
      type: "order_completed",
      params: { ref: order.reference },
      link: `/orders/${orderId}`,
    });
  }

  const actionKey = `order.force_${targetStatus}` as
    | "order.force_in_progress"
    | "order.force_delivered"
    | "order.force_completed";
  await recordAdminAction(db, {
    actorId: admin.id,
    action: actionKey,
    targetType: "order",
    targetId: orderId,
    details: { from: order.status, to: targetStatus },
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/orders/${orderId}`);
}
