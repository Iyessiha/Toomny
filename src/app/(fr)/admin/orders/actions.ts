"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertTransition, type OrderStatus } from "@/lib/escrow";
import { UUID_RE } from "@/lib/orders";
import { recordFunding } from "@/lib/order-ledger";
import { recordAdminAction } from "@/lib/admin-audit";

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
    .select("id, status, amount_minor, currency")
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
